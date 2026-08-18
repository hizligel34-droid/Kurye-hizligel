import { eq } from "drizzle-orm";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { invokeLLM } from "./_core/llm";
import { makeRequest, type DirectionsResult, type GeocodingResult } from "./_core/map";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { addMessage, addNotification, buildOrderAddressDetails, buildSupportMessagePayload, calculateCourierAchievement, calculateOrderFinancials, canTransitionStatus, getCourierContract, getCourierDocument, getCourierLeaderboard, getDb, getMessages, getOrderByTrackingCode, listCourierDocuments, listNotifications, listOrders, reviewCourierDocument, saveCourierContract, saveCourierDocument, summarizeAccountingRows, updateUserProfile } from "./db";
import { orders } from "../drizzle/schema";
import { nanoid } from "nanoid";
import { RUN_KURYE_CONTRACT_VERSION, runKuryeContractNotice, runKuryeContractSections } from "@shared/courierContract";
import { createValhallaProvider } from "./valhallaAdapter";
import { resolveOfflineRoute } from "@shared/offlineRouting";
import { storageGetSignedUrl, storagePut } from "./storage";

const courierDocumentTypes = ["identity", "license", "vehicle_registration"] as const;
const courierDocumentContentTypes = ["image/jpeg", "image/png", "application/pdf"] as const;
function decodeCourierDocument(dataBase64: string, contentType: string) {
  if (!courierDocumentContentTypes.includes(contentType as typeof courierDocumentContentTypes[number])) throw new Error("Yalnızca PDF, JPG veya PNG belge yükleyebilirsiniz");
  const raw = dataBase64.replace(/^data:[^;]+;base64,/, "");
  const bytes = Buffer.from(raw, "base64");
  if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new Error("Belge boyutu 8 MB’tan küçük olmalıdır");
  const header = bytes.subarray(0, 8);
  const valid = contentType === "application/pdf" ? header.toString("ascii", 0, 4) === "%PDF" : contentType === "image/png" ? header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47 : header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (!valid) throw new Error("Belge içeriği seçilen dosya türüyle eşleşmiyor");
  return { raw, bytes };
}
function safeDocumentName(fileName: string) { return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "document"; }

const statusLabels = { received: "Alındı", on_the_way: "Yolda", delivered: "Teslim Edildi", cancelled: "İptal Edildi" } as const;
export const supportedLanguages = ["tr", "en", "de", "ru", "ar", "zh", "el"] as const;
export function normalizeSupportLanguage(language: string | null | undefined) {
  return supportedLanguages.includes((language ?? "").toLowerCase() as typeof supportedLanguages[number]) ? (language ?? "").toLowerCase() : "tr";
}
export function selectSupportReplyLanguage(customerLanguage: string | null | undefined) {
  return normalizeSupportLanguage(customerLanguage);
}

type TranslationResult = { sourceLanguage: string; translatedText: string };

type RoadRoute = { distanceKm: number; durationMinutes: number; pickup: { lat: number; lng: number }; delivery: { lat: number; lng: number }; status: "verified"; provider: "google_driving" | "valhalla_offline" };

async function resolveRoadRoute(pickupAddress: string, deliveryAddress: string): Promise<RoadRoute> {
  const [pickupGeo, deliveryGeo] = await Promise.all([
    makeRequest<GeocodingResult>("/maps/api/geocode/json", { address: pickupAddress, region: "tr" }),
    makeRequest<GeocodingResult>("/maps/api/geocode/json", { address: deliveryAddress, region: "tr" }),
  ]);
  const pickup = pickupGeo.results?.[0]?.geometry?.location;
  const delivery = deliveryGeo.results?.[0]?.geometry?.location;
  if (!pickup || !delivery) throw new Error("Adreslerden biri haritada bulunamadı");
  const offlineRoute = await resolveOfflineRoute(
    createValhallaProvider(process.env.VALHALLA_BASE_URL, fetch, process.env.VALHALLA_TILE_EXPIRES_AT),
    pickup,
    delivery,
  );
  if (offlineRoute) return offlineRoute;

  const directions = await makeRequest<DirectionsResult>("/maps/api/directions/json", { origin: `${pickup.lat},${pickup.lng}`, destination: `${delivery.lat},${delivery.lng}`, mode: "driving", units: "metric" });
  const leg = directions.routes?.[0]?.legs?.[0];
  if (!leg?.distance?.value || !leg.duration?.value) throw new Error("Araç rotası oluşturulamadı");
  if (!isIstanbulCoordinate(pickup) || !isIstanbulCoordinate(delivery)) throw new Error("Run Kurye yalnızca İstanbul içinde rota oluşturur");
  return { distanceKm: Number((leg.distance.value / 1000).toFixed(2)), durationMinutes: Number((leg.duration.value / 60).toFixed(1)), pickup, delivery, status: "verified", provider: "google_driving" };
}

function addressPart(value: string | undefined) { return (value ?? "Belirtilmedi").trim().slice(0, 180) || "Belirtilmedi"; }
export function isIstanbulCoordinate(point: { lat: number; lng: number }) { return point.lat >= 40.7 && point.lat <= 41.5 && point.lng >= 28.4 && point.lng <= 29.5; }
export function validateIstanbulAddress(input: { pickupProvince?: string; pickupDistrict?: string; pickupNeighborhood?: string; deliveryProvince?: string; deliveryDistrict?: string; deliveryNeighborhood?: string }) {
  const fields = [input.pickupProvince, input.deliveryProvince];
  if (fields.some(value => value && value.trim().toLocaleLowerCase("tr-TR") !== "istanbul")) throw new Error("Run Kurye yalnızca İstanbul içinde hizmet verir");
  const required = [input.pickupDistrict, input.pickupNeighborhood, input.deliveryDistrict, input.deliveryNeighborhood];
  if (fields.some(Boolean) && required.some(value => !value?.trim())) throw new Error("İstanbul için ilçe ve mahalle bilgileri zorunludur");
}
async function translateSupportMessage(content: string, targetLanguage: string): Promise<TranslationResult> {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: `You are Run Kurye's professional support translator. Detect the source language and translate faithfully into the target language code. Supported codes: tr Turkish, en English, de German, ru Russian, ar Arabic, zh Simplified Chinese, el Greek. Preserve order numbers, prices, addresses, names, and formatting. Return JSON only.` },
      { role: "user", content: `Target language: ${targetLanguage}\nMessage: ${content}` },
    ],
    response_format: { type: "json_schema", json_schema: { name: "support_translation", strict: true, schema: { type: "object", properties: { sourceLanguage: { type: "string" }, translatedText: { type: "string" } }, required: ["sourceLanguage", "translatedText"], additionalProperties: false } } },
  });
  const raw = response.choices?.[0]?.message?.content;
  if (typeof raw === "string") {
    try { const parsed = JSON.parse(raw) as TranslationResult; if (parsed.translatedText) return parsed; } catch { /* fallback below */ }
  }
  return { sourceLanguage: targetLanguage, translatedText: content };
}

export function canAccessOrder(user: { id: number; role: string }, order: { customerId: number; courierId: number | null }) {
  return user.role === "admin" || order.customerId === user.id || (user.role === "courier" && order.courierId === user.id);
}

async function getAccessibleOrder(orderId: number, user: { id: number; role: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = result[0];
  if (!order) throw new Error("Sipariş bulunamadı");
  const allowed = canAccessOrder(user, order);
  if (!allowed) throw new Error("Bu siparişe erişim yetkiniz yok");
  return { db, order };
}

export const orderCreateInputSchema = z.object({ pickupAddress: z.string().min(5), pickupProvince: z.string().min(1), pickupDistrict: z.string().min(1), pickupNeighborhood: z.string().min(1), pickupStreet: z.string().min(1), pickupAddressDetail: z.string().min(1), deliveryAddress: z.string().min(5), deliveryProvince: z.string().min(1), deliveryDistrict: z.string().min(1), deliveryNeighborhood: z.string().min(1), deliveryStreet: z.string().min(1), deliveryAddressDetail: z.string().min(1), productDescription: z.string().min(2), customerPhone: z.string().min(7) });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  profile: router({ update: protectedProcedure.input(z.object({ name: z.string().min(2), phone: z.string().min(7) })).mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input)) }),
  pricing: router({
    estimate: publicProcedure.input(z.object({ distanceKm: z.number().min(0).optional(), pickupAddress: z.string().min(5).optional(), deliveryAddress: z.string().min(5).optional() })).query(async ({ input }) => {
      if (input.pickupAddress && input.deliveryAddress) {
        const route = await resolveRoadRoute(input.pickupAddress, input.deliveryAddress);
        return { ...calculateOrderFinancials(route.distanceKm), durationMinutes: route.durationMinutes, routeStatus: route.status, provider: route.provider };
      }
      if (input.distanceKm !== undefined) return { ...calculateOrderFinancials(input.distanceKm), durationMinutes: null, routeStatus: "unavailable" as const, provider: "manual" as const };
      throw new Error("Rota adresleri veya mesafe gerekli");
    }),
  }),
  orders: router({
    create: protectedProcedure.input(orderCreateInputSchema).mutation(async ({ ctx, input }) => {
      validateIstanbulAddress(input);
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const route = await resolveRoadRoute(input.pickupAddress, input.deliveryAddress);
      const financials = calculateOrderFinancials(route.distanceKm);
      const addressDetails = buildOrderAddressDetails(input);
      const trackingCode = `RUN-${nanoid(8).toUpperCase()}`;
      await db.insert(orders).values({ trackingCode, customerId: ctx.user.id, pickupAddress: input.pickupAddress, pickupProvince: addressPart(input.pickupProvince), pickupDistrict: addressPart(input.pickupDistrict), pickupNeighborhood: addressPart(input.pickupNeighborhood), pickupStreet: addressPart(input.pickupStreet), ...addressDetails, deliveryAddress: input.deliveryAddress, deliveryProvince: addressPart(input.deliveryProvince), deliveryDistrict: addressPart(input.deliveryDistrict), deliveryNeighborhood: addressPart(input.deliveryNeighborhood), deliveryStreet: addressPart(input.deliveryStreet), productDescription: input.productDescription, customerPhone: input.customerPhone, distanceKm: financials.distanceKm.toFixed(2), routeDurationMinutes: route.durationMinutes.toFixed(1), routeStatus: route.status, routeProvider: route.provider, pickupLatitude: route.pickup.lat.toFixed(7), pickupLongitude: route.pickup.lng.toFixed(7), deliveryLatitude: route.delivery.lat.toFixed(7), deliveryLongitude: route.delivery.lng.toFixed(7), totalPrice: financials.total.toFixed(2), commission: financials.commission.toFixed(2), courierEarning: financials.courierEarning.toFixed(2), companyRevenue: financials.companyRevenue.toFixed(2), status: "received" });
      await addNotification({ userId: ctx.user.id, title: "Siparişiniz alındı", content: `${trackingCode} numaralı siparişiniz oluşturuldu.` });
      return { trackingCode, ...financials, durationMinutes: route.durationMinutes, routeStatus: route.status, status: "received" as const };
    }),
    mine: protectedProcedure.query(({ ctx }) => listOrders(ctx.user.id, ctx.user.role)),
    track: publicProcedure.input(z.object({ trackingCode: z.string().min(4) })).query(async ({ input }) => {
      const order = await getOrderByTrackingCode(input.trackingCode);
      if (!order) return null;
      return { trackingCode: order.trackingCode, status: order.status, distanceKm: order.distanceKm, totalPrice: order.totalPrice, createdAt: order.createdAt, updatedAt: order.updatedAt };
    }),
    updateStatus: protectedProcedure.input(z.object({ orderId: z.number(), status: z.enum(["received", "on_the_way", "delivered", "cancelled"]), courierId: z.number().optional() })).mutation(async ({ ctx, input }) => {
      if (!["admin", "courier"].includes(ctx.user.role)) throw new Error("Bu işlem için yetkiniz yok");
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const current = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!current[0]) throw new Error("Sipariş bulunamadı");
      if (ctx.user.role === "courier" && current[0].courierId !== ctx.user.id) throw new Error("Yalnızca size atanmış siparişleri güncelleyebilirsiniz");
      if (!canTransitionStatus(current[0].status, input.status)) throw new Error("Bu sipariş durumu geçişi geçersiz");
      await db.update(orders).set({ status: input.status, courierId: ctx.user.role === "admin" ? (input.courierId ?? current[0].courierId) : current[0].courierId }).where(eq(orders.id, input.orderId));
      await addNotification({ userId: current[0].customerId, orderId: input.orderId, title: `Sipariş durumu: ${statusLabels[input.status]}`, content: `${current[0].trackingCode} numaralı siparişinizin durumu güncellendi.` });
      return { success: true, status: input.status };
    }),
  }),
  chat: router({
    messages: protectedProcedure.input(z.object({ orderId: z.number() })).query(async ({ ctx, input }) => { await getAccessibleOrder(input.orderId, ctx.user); return getMessages(input.orderId); }),
send: protectedProcedure.input(z.object({ orderId: z.number(), content: z.string().min(1), senderRole: z.enum(["customer", "courier", "operator"]), targetLanguage: z.enum(supportedLanguages).optional() })).mutation(async ({ ctx, input }) => {
      const { order } = await getAccessibleOrder(input.orderId, ctx.user);
      const expectedRole = ctx.user.role === "courier" ? "courier" : ctx.user.role === "admin" ? "operator" : "customer";
      if (input.senderRole !== expectedRole) throw new Error("Gönderici rolü doğrulanamadı");
      const priorMessages = await getMessages(input.orderId);
      const customerLanguage = selectSupportReplyLanguage(priorMessages.findLast(message => message.senderRole === "customer")?.detectedLanguage);
      const targetLanguage = input.targetLanguage ?? (input.senderRole === "customer" ? "tr" : customerLanguage);
      const translation = await translateSupportMessage(input.content, targetLanguage);
      return addMessage(buildSupportMessagePayload({ orderId: order.id, senderId: ctx.user.id, senderRole: input.senderRole, content: input.content, detectedLanguage: translation.sourceLanguage, translatedContent: translation.translatedText }));
    }),
    assistant: publicProcedure.input(z.object({ question: z.string().min(2), trackingCode: z.string().optional() })).mutation(async ({ input }) => {
      const context = input.trackingCode ? await getOrderByTrackingCode(input.trackingCode) : undefined;
      const response = await invokeLLM({ messages: [
        { role: "system", content: "Sen Run Kurye müşteri destek asistanısın. Türkçe yanıt ver. Fiyatlandırma değişmez: 600 TL açılış ücreti ilk 5 km dahil, 5 km sonrası her km 100 TL. Komisyon oranı sistemde sabit %20'dir. Sipariş durumunu yalnızca verilen veriden söyle; kişisel veri isteme ve kesin olmayan teslimat süresi için tahmin olduğunu belirt." },
        { role: "user", content: `Müşteri sorusu: ${input.question}\nSipariş verisi: ${context ? JSON.stringify({ trackingCode: context.trackingCode, status: statusLabels[context.status], distanceKm: context.distanceKm, totalPrice: context.totalPrice }) : "Yok"}` },
      ] });
      const content = response.choices?.[0]?.message?.content;
      return { answer: typeof content === "string" ? content : "Run Kurye destek ekibi size yardımcı olacaktır." };
    }),
  }),
  notifications: router({ list: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)) }),
  accounting: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const rows = await listOrders(ctx.user.id, ctx.user.role);
      return { role: ctx.user.role, ...summarizeAccountingRows(rows, ctx.user.role) };
    }),
  }),
  courier: router({
    performance: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "courier") throw new Error("Bu başarı profili yalnızca kuryeler içindir");
      const rows = await listOrders(ctx.user.id, ctx.user.role);
      return calculateCourierAchievement(rows);
    }),
    leaderboard: protectedProcedure.query(async ({ ctx }) => {
      if (!["admin", "accountant", "courier"].includes(ctx.user.role)) throw new Error("Liderlik tablosuna erişim yetkiniz yok");
      return getCourierLeaderboard();
    }),
    contract: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "courier") throw new Error("Bu sözleşme yalnızca kuryeler içindir");
      return { version: RUN_KURYE_CONTRACT_VERSION, sections: runKuryeContractSections, notice: runKuryeContractNotice, accepted: Boolean(await getCourierContract(ctx.user.id)), record: await getCourierContract(ctx.user.id) };
    }),
    acceptContract: protectedProcedure.input(z.object({ courierFullName: z.string().min(2).max(160), identityNumber: z.string().min(5).max(32), residenceAddress: z.string().min(5).max(320), taxOffice: z.string().min(2).max(120), taxNumber: z.string().min(5).max(40), vehiclePlate: z.string().min(2).max(20), iban: z.string().min(10).max(34), accepted: z.literal(true) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "courier") throw new Error("Bu sözleşme yalnızca kuryeler içindir");
      return saveCourierContract({ courierId: ctx.user.id, contractVersion: RUN_KURYE_CONTRACT_VERSION, courierFullName: input.courierFullName.trim(), identityNumber: input.identityNumber.trim(), residenceAddress: input.residenceAddress.trim(), taxOffice: input.taxOffice.trim(), taxNumber: input.taxNumber.trim(), vehiclePlate: input.vehiclePlate.trim().toUpperCase(), iban: input.iban.trim().toUpperCase() });
    }),
    documents: protectedProcedure.query(({ ctx }) => {
      if (!["courier", "admin", "accountant"].includes(ctx.user.role)) throw new Error("Belge alanına erişim yetkiniz yok");
      return listCourierDocuments(ctx.user.role === "courier" ? ctx.user.id : undefined);
    }),
    uploadDocument: protectedProcedure.input(z.object({ documentType: z.enum(courierDocumentTypes), fileName: z.string().min(1).max(180), contentType: z.enum(courierDocumentContentTypes), dataBase64: z.string().min(32).max(12_000_000) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "courier") throw new Error("Belgeleri yalnızca kuryeler yükleyebilir");
      const { bytes } = decodeCourierDocument(input.dataBase64, input.contentType);
      const stored = await storagePut(`couriers/${ctx.user.id}/documents/${input.documentType}/${safeDocumentName(input.fileName)}`, bytes, input.contentType);
      return saveCourierDocument({ courierId: ctx.user.id, documentType: input.documentType, storageKey: stored.key, storageUrl: stored.url, originalName: safeDocumentName(input.fileName), contentType: input.contentType, sizeBytes: bytes.length, status: "pending", reviewNote: null });
    }),
    reviewDocument: protectedProcedure.input(z.object({ documentId: z.number().int().positive(), status: z.enum(["approved", "rejected"]), reviewNote: z.string().max(500).optional() })).mutation(async ({ ctx, input }) => {
      if (!["admin", "accountant"].includes(ctx.user.role)) throw new Error("Belge inceleme yetkiniz yok");
      return reviewCourierDocument(input.documentId, input.status, input.reviewNote?.trim());
    }),
    documentUrl: protectedProcedure.input(z.object({ documentId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const document = await getCourierDocument(input.documentId);
      if (!document) throw new Error("Belge bulunamadı");
      if (ctx.user.role === "courier" && document.courierId !== ctx.user.id) throw new Error("Bu belgeye erişim yetkiniz yok");
      if (!["courier", "admin", "accountant"].includes(ctx.user.role)) throw new Error("Belgeye erişim yetkiniz yok");
      return { url: await storageGetSignedUrl(document.storageKey), expiresInSeconds: 900 };
    }),
  }),
});

export type AppRouter = typeof appRouter;
