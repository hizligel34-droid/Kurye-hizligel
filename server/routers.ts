import { eq, inArray } from "drizzle-orm";
import { createHash, randomInt } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { invokeLLM } from "./_core/llm";
import { makeRequest, type DirectionsResult, type GeocodingResult } from "./_core/map";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { addMessage, addNotification, buildOrderAddressDetails, buildSupportMessagePayload, calculateCourierAchievement, calculateOrderFinancials, canTransitionStatus, createSavedAddress, deleteSavedAddress, evaluateSandboxPayment, filterAndSortCourierReport, getCourierContract, getCourierDocument, getCourierLeaderboard, getDb, getMessages, listCourierOperations, listSavedAddresses, roadApproxDistanceKm, upsertCourierOperation, getOrderByTrackingCode, listCourierDocuments, listNotifications, listOrders, reviewCourierDocument, saveCourierContract, saveCourierDocument, summarizeAccountingRows, updateUserProfile } from "./db";
import { orders, users } from "../drizzle/schema";
import { nanoid } from "nanoid";
import { RUN_KURYE_CONTRACT_VERSION, runKuryeContractNotice, runKuryeContractSections } from "@shared/courierContract";
import { createValhallaProvider } from "./valhallaAdapter";
import { resolveOfflineRoute } from "@shared/offlineRouting";
import { storageGetSignedUrl, storagePut } from "./storage";
import { isValidIstanbulLocation, publishCourierLocation } from "./realtime";
import { arePickupAndDeliveryDifferent, isValidBuildingNo, isValidTurkishMobilePhone, normalizeTurkishMobilePhone } from "@shared/orderValidation";

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
export function safeDocumentName(fileName: string) { const baseName = fileName.split(/[\\/]/).pop() ?? "document"; return baseName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "") .slice(-120) || "document"; }
const chatPhotoTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export function decodeChatPhoto(dataBase64: string, contentType: string) {
  if (!chatPhotoTypes.includes(contentType as typeof chatPhotoTypes[number])) throw new Error("Sohbette yalnızca JPG, PNG veya WebP fotoğraf gönderebilirsiniz");
  const raw = dataBase64.replace(/^data:[^;]+;base64,/, "");
  const bytes = Buffer.from(raw, "base64");
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new Error("Fotoğraf boyutu 5 MB’tan küçük olmalıdır");
  const header = bytes.subarray(0, 12);
  const valid = contentType === "image/jpeg" ? header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff : contentType === "image/png" ? header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47 : header.subarray(0, 4).toString("ascii") === "RIFF" && header.subarray(8, 12).toString("ascii") === "WEBP";
  if (!valid) throw new Error("Fotoğraf içeriği seçilen dosya türüyle eşleşmiyor");
  return { raw, bytes };
}

const deliveryPhotoTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export function decodeDeliveryPhoto(dataBase64: string, contentType: string) {
  if (!deliveryPhotoTypes.includes(contentType as typeof deliveryPhotoTypes[number])) throw new Error("Teslim fotoğrafı JPG, PNG veya WebP olmalıdır");
  const raw = dataBase64.replace(/^data:[^;]+;base64,/, "");
  const bytes = Buffer.from(raw, "base64");
  if (!bytes.length || bytes.length > 6 * 1024 * 1024) throw new Error("Teslim fotoğrafı 6 MB’tan küçük olmalıdır");
  const header = bytes.subarray(0, 12);
  const valid = contentType === "image/jpeg" ? header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff : contentType === "image/png" ? header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47 : header.subarray(0, 4).toString("ascii") === "RIFF" && header.subarray(8, 12).toString("ascii") === "WEBP";
  if (!valid) throw new Error("Teslim fotoğrafı içeriği dosya türüyle eşleşmiyor");
  return bytes;
}
function createDeliveryOtp() { return String(randomInt(100000, 1000000)); }
export function hashDeliveryOtp(code: string) { return createHash("sha256").update(code).digest("hex"); }

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
  if (!isIstanbulCoordinate(pickup) || !isIstanbulCoordinate(delivery)) throw new Error("Run Courier yalnızca İstanbul içinde rota oluşturur");
  return { distanceKm: Number((leg.distance.value / 1000).toFixed(2)), durationMinutes: Number((leg.duration.value / 60).toFixed(1)), pickup, delivery, status: "verified", provider: "google_driving" };
}

function addressPart(value: string | undefined) { return (value ?? "Belirtilmedi").trim().slice(0, 180) || "Belirtilmedi"; }
export function isIstanbulCoordinate(point: { lat: number; lng: number }) { return point.lat >= 40.7 && point.lat <= 41.5 && point.lng >= 28.4 && point.lng <= 29.5; }

function haversineDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radians = (value: number) => value * Math.PI / 180;
  const earthRadiusKm = 6371;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const arc = sinLat * sinLat + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * sinLng * sinLng;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

export type LiveTrafficSnapshot = { remainingDistanceKm: number; etaMinutes: number | null; trafficLevel: "light" | "moderate" | "heavy" | "unknown"; trafficSource: "live_route" | "speed_fallback" | "unavailable" };

export async function resolveLiveTrafficSnapshot(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }, currentSpeedMps: number | null): Promise<LiveTrafficSnapshot> {
  const fallbackDistance = Number(haversineDistanceKm(origin, destination).toFixed(2));
  try {
    const directions = await makeRequest<DirectionsResult>("/maps/api/directions/json", { origin: `${origin.lat},${origin.lng}`, destination: `${destination.lat},${destination.lng}`, mode: "driving", departure_time: "now", units: "metric" });
    const leg = directions.routes?.[0]?.legs?.[0];
    if (leg?.distance?.value && leg.duration?.value) {
      const baseMinutes = leg.duration.value / 60;
      const liveMinutes = (leg.duration_in_traffic?.value ?? leg.duration.value) / 60;
      const ratio = liveMinutes / Math.max(baseMinutes, 1);
      return { remainingDistanceKm: Number((leg.distance.value / 1000).toFixed(2)), etaMinutes: Math.max(1, Math.round(liveMinutes)), trafficLevel: ratio >= 1.35 ? "heavy" : ratio >= 1.12 ? "moderate" : "light", trafficSource: leg.duration_in_traffic ? "live_route" : "speed_fallback" };
    }
  } catch { /* live traffic is optional; use the safe local estimate below */ }
  if (fallbackDistance > 0 && currentSpeedMps != null && currentSpeedMps > 0.5) return { remainingDistanceKm: fallbackDistance, etaMinutes: Math.max(1, Math.round((fallbackDistance / (currentSpeedMps * 3.6)) * 60)), trafficLevel: "unknown", trafficSource: "speed_fallback" };
  return { remainingDistanceKm: fallbackDistance, etaMinutes: null, trafficLevel: "unknown", trafficSource: fallbackDistance > 0 ? "unavailable" : "unavailable" };
}
export function validateIstanbulAddress(input: { pickupProvince?: string; pickupDistrict?: string; pickupNeighborhood?: string; deliveryProvince?: string; deliveryDistrict?: string; deliveryNeighborhood?: string }) {
  const fields = [input.pickupProvince, input.deliveryProvince];
  if (fields.some(value => value && value.trim().toLocaleLowerCase("tr-TR") !== "istanbul")) throw new Error("Run Courier yalnızca İstanbul içinde hizmet verir");
  const required = [input.pickupDistrict, input.pickupNeighborhood, input.deliveryDistrict, input.deliveryNeighborhood];
  if (fields.some(Boolean) && required.some(value => !value?.trim())) throw new Error("İstanbul için ilçe ve mahalle bilgileri zorunludur");
}
async function translateSupportMessage(content: string, targetLanguage: string): Promise<TranslationResult> {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: `You are Run Courier's professional support translator. Detect the source language and translate faithfully into the target language code. Supported codes: tr Turkish, en English, de German, ru Russian, ar Arabic, zh Simplified Chinese, el Greek. Preserve order numbers, prices, addresses, names, and formatting. Return JSON only.` },
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

export const orderCreateInputSchema = z.object({ pickupAddress: z.string().min(5), pickupProvince: z.string().min(1), pickupDistrict: z.string().min(1), pickupNeighborhood: z.string().min(1), pickupStreet: z.string().min(1), pickupBuildingNo: z.string().min(1).max(30), pickupApartmentNo: z.string().max(30).default(""), pickupFloor: z.string().max(20).default(""), pickupCourierNote: z.string().max(500).default(""), pickupAddressDetail: z.string().max(240), deliveryAddress: z.string().min(5), deliveryProvince: z.string().min(1), deliveryDistrict: z.string().min(1), deliveryNeighborhood: z.string().min(1), deliveryStreet: z.string().min(1), deliveryBuildingNo: z.string().min(1).max(30), deliveryApartmentNo: z.string().max(30).default(""), deliveryFloor: z.string().max(20).default(""), deliveryCourierNote: z.string().max(500).default(""), deliveryAddressDetail: z.string().max(240), productDescription: z.string().min(2).max(500), customerPhone: z.string().min(7), paymentMethod: z.enum(["sandbox_card", "cash_on_delivery"]).default("cash_on_delivery"), paymentReference: z.string().regex(/^SANDBOX-[A-Z0-9]{10}$/).optional() }).superRefine((input, ctx) => { if (!isValidBuildingNo(input.pickupBuildingNo)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["pickupBuildingNo"], message: "Alış bina/kapı numarası gerekli" }); if (!isValidBuildingNo(input.deliveryBuildingNo)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliveryBuildingNo"], message: "Teslim bina/kapı numarası gerekli" }); if (!isValidTurkishMobilePhone(input.customerPhone)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customerPhone"], message: "Geçerli Türkiye cep telefonu gerekli" }); if (!arePickupAndDeliveryDifferent(input)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliveryBuildingNo"], message: "Alış ve teslim adresleri aynı olamaz" }); if (input.paymentMethod === "sandbox_card" && !input.paymentReference) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentReference"], message: "Kart ödemesi için sandbox onayı gereklidir" }); if (input.paymentMethod === "cash_on_delivery" && input.paymentReference) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentReference"], message: "Kapıda nakit siparişte kart referansı kullanılamaz" }); });

export const savedAddressInputSchema = z.object({
  label: z.string().trim().min(1).max(80), province: z.literal("İstanbul"), district: z.string().trim().min(1).max(100),
  neighborhood: z.string().trim().min(1).max(140), street: z.string().trim().min(1).max(180),
  buildingNo: z.string().trim().min(1).max(30), apartmentNo: z.string().trim().max(30).default(""),
  floor: z.string().trim().max(20).default(""), courierNote: z.string().trim().max(500).default(""),
  addressDetail: z.string().trim().min(5).max(240),
}).superRefine((input, refinement) => {
  if (!isValidBuildingNo(input.buildingNo)) refinement.addIssue({ code: z.ZodIssueCode.custom, path: ["buildingNo"], message: "Geçerli bina/kapı numarası gerekli" });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  profile: router({ update: protectedProcedure.input(z.object({ name: z.string().min(2), phone: z.string().min(7) })).mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input)) }),
  savedAddresses: router({
    list: protectedProcedure.query(({ ctx }) => listSavedAddresses(ctx.user.id)),
    create: protectedProcedure.input(savedAddressInputSchema).mutation(({ ctx, input }) => createSavedAddress({ userId: ctx.user.id, ...input })),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteSavedAddress(ctx.user.id, input.id)),
  }),
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
  payments: router({
    sandbox: protectedProcedure.input(z.object({ cardNumber: z.string().regex(/^[0-9 ]{12,19}$/), expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/), cvv: z.string().regex(/^\d{3,4}$/), amount: z.number().positive() })).mutation(({ input }) => {
      const result = evaluateSandboxPayment(input);
      return result.status === "approved" ? { ...result, reference: `SANDBOX-${nanoid(10).toUpperCase()}` } : result;
    }),
  }),
  orders: router({
    create: protectedProcedure.input(orderCreateInputSchema).mutation(async ({ ctx, input }) => {
      validateIstanbulAddress(input);
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const route = await resolveRoadRoute(input.pickupAddress, input.deliveryAddress);
      const financials = calculateOrderFinancials(route.distanceKm);
      const addressDetails = buildOrderAddressDetails(input);
      const paymentStatus = input.paymentMethod === "cash_on_delivery" ? "collect_on_delivery" as const : "paid" as const;
      const trackingCode = `RUN-${nanoid(8).toUpperCase()}`;
      const deliveryOtp = createDeliveryOtp();
      await db.insert(orders).values({ trackingCode, customerId: ctx.user.id, pickupAddress: input.pickupAddress, pickupProvince: addressPart(input.pickupProvince), pickupDistrict: addressPart(input.pickupDistrict), pickupNeighborhood: addressPart(input.pickupNeighborhood), pickupStreet: addressPart(input.pickupStreet), ...addressDetails, deliveryAddress: input.deliveryAddress, deliveryProvince: addressPart(input.deliveryProvince), deliveryDistrict: addressPart(input.deliveryDistrict), deliveryNeighborhood: addressPart(input.deliveryNeighborhood), deliveryStreet: addressPart(input.deliveryStreet), productDescription: input.productDescription, customerPhone: normalizeTurkishMobilePhone(input.customerPhone), distanceKm: financials.distanceKm.toFixed(2), routeDurationMinutes: route.durationMinutes.toFixed(1), routeStatus: route.status, routeProvider: route.provider, pickupLatitude: route.pickup.lat.toFixed(7), pickupLongitude: route.pickup.lng.toFixed(7), deliveryLatitude: route.delivery.lat.toFixed(7), deliveryLongitude: route.delivery.lng.toFixed(7), totalPrice: financials.total.toFixed(2), paymentMethod: input.paymentMethod, paymentStatus, paymentReference: input.paymentReference ?? null, commission: financials.commission.toFixed(2), courierEarning: financials.courierEarning.toFixed(2), companyRevenue: financials.companyRevenue.toFixed(2), deliveryOtpHash: hashDeliveryOtp(deliveryOtp), status: "received" });
      await addNotification({ userId: ctx.user.id, title: "Siparişiniz alındı", content: `${trackingCode} numaralı siparişiniz oluşturuldu. Teslimat doğrulama kodunuz: ${deliveryOtp}. Bu kodu yalnızca paketi teslim alırken kuryeyle paylaşın. ${input.paymentMethod === "cash_on_delivery" ? "Ödeme teslimatta nakit tahsil edilecektir." : "Sandbox kart ödemesi onaylandı."}` });
      return { trackingCode, deliveryOtp, ...financials, durationMinutes: route.durationMinutes, routeStatus: route.status, paymentMethod: input.paymentMethod, paymentStatus, status: "received" as const };
    }),
    mine: protectedProcedure.query(({ ctx }) => listOrders(ctx.user.id, ctx.user.role)),
    track: publicProcedure.input(z.object({ trackingCode: z.string().min(4) })).query(async ({ input }) => {
      const order = await getOrderByTrackingCode(input.trackingCode);
      if (!order) return null;
      return { trackingCode: order.trackingCode, status: order.status, distanceKm: order.distanceKm, totalPrice: order.totalPrice, routeDurationMinutes: order.routeDurationMinutes, routeStatus: order.routeStatus, createdAt: order.createdAt, updatedAt: order.updatedAt };
    }),
    publishLocation: protectedProcedure.input(z.object({ orderId: z.number().int().positive(), lat: z.number(), lng: z.number(), accuracy: z.number().nullable().optional(), heading: z.number().nullable().optional(), speed: z.number().nullable().optional() })).mutation(async ({ ctx, input }) => {
      const { order } = await getAccessibleOrder(input.orderId, ctx.user);
      if (ctx.user.role !== "courier" || order.courierId !== ctx.user.id) throw new Error("Konum yalnızca atanmış kurye tarafından paylaşılabilir");
      if (order.status !== "on_the_way") throw new Error("Konum paylaşımı yalnızca yoldaki siparişlerde açıktır");
      if (!isValidIstanbulLocation(input)) throw new Error("Konum İstanbul hizmet alanı dışında");
      const delivery = { lat: Number(order.deliveryLatitude), lng: Number(order.deliveryLongitude) };
      const traffic = Number.isFinite(delivery.lat) && Number.isFinite(delivery.lng)
        ? await resolveLiveTrafficSnapshot({ lat: input.lat, lng: input.lng }, delivery, input.speed ?? null)
        : { remainingDistanceKm: null, etaMinutes: null, trafficLevel: "unknown" as const, trafficSource: "unavailable" as const };
      return publishCourierLocation({ orderId: order.id, trackingCode: order.trackingCode, lat: input.lat, lng: input.lng, accuracy: input.accuracy ?? null, heading: input.heading ?? null, speed: input.speed ?? null, remainingDistanceKm: traffic.remainingDistanceKm, trafficEtaMinutes: traffic.etaMinutes, trafficLevel: traffic.trafficLevel, trafficSource: traffic.trafficSource, updatedAt: Date.now() });
    }),
    updateStatus: protectedProcedure.input(z.object({ orderId: z.number(), status: z.enum(["received", "on_the_way", "delivered", "cancelled"]), courierId: z.number().optional() })).mutation(async ({ ctx, input }) => {
      if (!["admin", "courier"].includes(ctx.user.role)) throw new Error("Bu işlem için yetkiniz yok");
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const current = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!current[0]) throw new Error("Sipariş bulunamadı");
      if (ctx.user.role === "courier" && current[0].courierId !== ctx.user.id) throw new Error("Yalnızca size atanmış siparişleri güncelleyebilirsiniz");
      if (!canTransitionStatus(current[0].status, input.status)) throw new Error("Bu sipariş durumu geçişi geçersiz");
      if (input.status === "delivered") throw new Error("Teslimat, fotoğraf ve teslimat OTP doğrulamasıyla tamamlanmalıdır");
      const assignedCourierId = ctx.user.role === "admin" ? (input.courierId ?? current[0].courierId) : current[0].courierId;
      await db.update(orders).set({ status: input.status, courierId: assignedCourierId, assignedAt: !current[0].courierId && assignedCourierId ? new Date() : undefined, cancelledAt: input.status === "cancelled" ? new Date() : undefined, cancelledByRole: input.status === "cancelled" ? ctx.user.role : undefined }).where(eq(orders.id, input.orderId));
      if (assignedCourierId && input.status === "on_the_way") await upsertCourierOperation({ courierId: assignedCourierId, availability: "busy" });
      await addNotification({ userId: current[0].customerId, orderId: input.orderId, title: `Sipariş durumu: ${statusLabels[input.status]}`, content: `${current[0].trackingCode} numaralı siparişinizin durumu güncellendi.` });
      return { success: true, status: input.status };
    }),
    uploadDeliveryPhoto: protectedProcedure.input(z.object({ orderId: z.number().int().positive(), fileName: z.string().min(1).max(180), contentType: z.string(), dataBase64: z.string().min(20) })).mutation(async ({ ctx, input }) => {
      const { order } = await getAccessibleOrder(input.orderId, ctx.user);
      if (ctx.user.role !== "courier" || order.courierId !== ctx.user.id) throw new Error("Teslim fotoğrafını yalnızca atanmış kurye yükleyebilir");
      if (order.status !== "on_the_way") throw new Error("Teslim fotoğrafı yalnızca yoldaki siparişte yüklenebilir");
      const bytes = decodeDeliveryPhoto(input.dataBase64, input.contentType);
      const safeName = safeDocumentName(input.fileName);
      const stored = await storagePut(`orders/${order.id}/delivery/${nanoid(10)}-${safeName}`, bytes, input.contentType);
      await (await getDb())!.update(orders).set({ deliveryPhotoKey: stored.key, deliveryPhotoUrl: stored.url }).where(eq(orders.id, order.id));
      return { success: true, url: stored.url };
    }),
    completeDelivery: protectedProcedure.input(z.object({ orderId: z.number().int().positive(), deliveryCode: z.string().regex(/^\d{6}$/) })).mutation(async ({ ctx, input }) => {
      const { order, db } = await getAccessibleOrder(input.orderId, ctx.user);
      if (ctx.user.role !== "courier" || order.courierId !== ctx.user.id) throw new Error("Teslimatı yalnızca atanmış kurye tamamlayabilir");
      if (order.status !== "on_the_way") throw new Error("Sipariş teslimata hazır durumda değil");
      if (!order.deliveryPhotoKey) throw new Error("Önce teslim fotoğrafı yükleyin");
      if (!order.deliveryOtpHash || hashDeliveryOtp(input.deliveryCode) !== order.deliveryOtpHash) throw new Error("Teslimat doğrulama kodu hatalı");
      await db.update(orders).set({ status: "delivered", deliveredAt: new Date(), paymentStatus: order.paymentMethod === "cash_on_delivery" ? "paid" : order.paymentStatus }).where(eq(orders.id, order.id));
      if (order.courierId) {
        const active = await db.select({ id: orders.id }).from(orders).where(inArray(orders.status, ["received", "on_the_way"]));
        if (!active.some(row => row.id !== order.id)) await upsertCourierOperation({ courierId: order.courierId, availability: "available" });
      }
      await addNotification({ userId: order.customerId, orderId: order.id, title: "Teslimat tamamlandı", content: `${order.trackingCode} numaralı siparişiniz doğrulama kodu ve teslim fotoğrafı ile tamamlandı.` });
      return { success: true, status: "delivered" as const };
    }),
  }),
  chat: router({
    messages: protectedProcedure.input(z.object({ orderId: z.number() })).query(async ({ ctx, input }) => { const { order } = await getAccessibleOrder(input.orderId, ctx.user); const rows = await getMessages(order.id); return Promise.all(rows.map(async message => message.attachmentKey ? { ...message, attachmentUrl: await storageGetSignedUrl(message.attachmentKey) } : message)); }),
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
    sendPhoto: protectedProcedure.input(z.object({ orderId: z.number().int().positive(), senderRole: z.enum(["customer", "courier", "operator"]), fileName: z.string().min(1).max(180), contentType: z.string(), dataBase64: z.string().min(20) })).mutation(async ({ ctx, input }) => {
      const { order } = await getAccessibleOrder(input.orderId, ctx.user);
      const expectedRole = ctx.user.role === "courier" ? "courier" : ctx.user.role === "admin" ? "operator" : "customer";
      if (input.senderRole !== expectedRole) throw new Error("Gönderici rolü doğrulanamadı");
      const photo = decodeChatPhoto(input.dataBase64, input.contentType);
      const safeName = safeDocumentName(input.fileName);
      const stored = await storagePut(`orders/${order.id}/chat/${ctx.user.id}/${nanoid(10)}-${safeName}`, photo.bytes, input.contentType);
      return addMessage(buildSupportMessagePayload({ orderId: order.id, senderId: ctx.user.id, senderRole: input.senderRole, content: "Fotoğraf gönderildi", detectedLanguage: "und", translatedContent: "Fotoğraf gönderildi", attachmentKey: stored.key, attachmentUrl: stored.url, attachmentContentType: input.contentType, attachmentName: safeName, attachmentSizeBytes: photo.bytes.length }));
    }),
    assistant: publicProcedure.input(z.object({ question: z.string().min(2), trackingCode: z.string().optional() })).mutation(async ({ input }) => {
      const context = input.trackingCode ? await getOrderByTrackingCode(input.trackingCode) : undefined;
      const response = await invokeLLM({ messages: [
        { role: "system", content: "Sen Run Courier müşteri destek asistanısın. Türkçe yanıt ver. Fiyatlandırma değişmez: 600 TL açılış ücreti ilk 5 km dahil, 5 km sonrası her km 100 TL. Komisyon oranı sistemde sabit %20'dir. Sipariş durumunu yalnızca verilen veriden söyle; kişisel veri isteme ve kesin olmayan teslimat süresi için tahmin olduğunu belirt." },
        { role: "user", content: `Müşteri sorusu: ${input.question}\nSipariş verisi: ${context ? JSON.stringify({ trackingCode: context.trackingCode, status: statusLabels[context.status], distanceKm: context.distanceKm, totalPrice: context.totalPrice }) : "Yok"}` },
      ] });
      const content = response.choices?.[0]?.message?.content;
      return { answer: typeof content === "string" ? content : "Run Courier destek ekibi size yardımcı olacaktır." };
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
    operationStatus: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "courier") throw new Error("Operasyon durumu yalnızca kuryeler içindir");
      const rows = await listCourierOperations();
      return rows.find(row => row.courierId === ctx.user.id) ?? { courierId: ctx.user.id, availability: "offline" as const, latitude: null, longitude: null, accuracy: null, lastLocationAt: null };
    }),
    setAvailability: protectedProcedure.input(z.object({ availability: z.enum(["offline", "available", "break"]), lat: z.number().optional(), lng: z.number().optional(), accuracy: z.number().nullable().optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "courier") throw new Error("Müsaitlik durumunu yalnızca kurye değiştirebilir");
      if ((input.lat != null || input.lng != null) && (!Number.isFinite(input.lat) || !Number.isFinite(input.lng) || !isValidIstanbulLocation({ lat: input.lat!, lng: input.lng! }))) throw new Error("Kurye konumu İstanbul hizmet alanı dışında");
      return upsertCourierOperation({ courierId: ctx.user.id, availability: input.availability, lat: input.lat, lng: input.lng, accuracy: input.accuracy ?? null });
    }),
    operations: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Operasyon görünümü yalnızca admin içindir");
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const courierRows = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "courier"));
      const ops = await listCourierOperations();
      const active = await db.select({ courierId: orders.courierId, status: orders.status }).from(orders).where(inArray(orders.status, ["received", "on_the_way"]));
      const loads = new Map<number, number>(); active.forEach(row => { if (row.courierId) loads.set(row.courierId, (loads.get(row.courierId) ?? 0) + 1); });
      const byId = new Map(ops.map(op => [op.courierId, op]));
      return courierRows.map(courier => ({ ...courier, availability: byId.get(courier.id)?.availability ?? "offline", latitude: byId.get(courier.id)?.latitude ?? null, longitude: byId.get(courier.id)?.longitude ?? null, lastLocationAt: byId.get(courier.id)?.lastLocationAt ?? null, activeOrders: loads.get(courier.id) ?? 0 }));
    }),
    assignNext: protectedProcedure.input(z.object({ orderId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Otomatik atama yalnızca admin içindir");
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const current = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!current[0]) throw new Error("Sipariş bulunamadı");
      if (current[0].courierId) throw new Error("Sipariş zaten bir kuryeye atanmış");
      const couriers = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "courier"));
      const ops = await listCourierOperations();
      const active = await db.select({ courierId: orders.courierId }).from(orders).where(inArray(orders.status, ["received", "on_the_way"]));
      const loads = new Map<number, number>(); active.forEach(row => { if (row.courierId) loads.set(row.courierId, (loads.get(row.courierId) ?? 0) + 1); });
      const candidates = couriers.map(courier => { const op = ops.find(item => item.courierId === courier.id); return { ...courier, op, load: loads.get(courier.id) ?? 0 }; }).filter(candidate => candidate.op?.availability === "available");
      if (!candidates.length) throw new Error("Müsait kurye bulunamadı");
      const selected = candidates.sort((a, b) => a.load - b.load || a.id - b.id)[0];
      await db.update(orders).set({ courierId: selected.id, assignedAt: new Date() }).where(eq(orders.id, input.orderId));
      await upsertCourierOperation({ courierId: selected.id, availability: "busy" });
      await addNotification({ userId: current[0].customerId, orderId: input.orderId, title: "Kurye atandı", content: `${current[0].trackingCode} numaralı siparişinize kurye atandı.` });
      return { success: true, courierId: selected.id, courierName: selected.name, activeOrdersBeforeAssignment: selected.load };
    }),
    performance: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "courier") throw new Error("Bu başarı profili yalnızca kuryeler içindir");
      const rows = await listOrders(ctx.user.id, ctx.user.role);
      return calculateCourierAchievement(rows);
    }),
    report: protectedProcedure.input(z.object({ status: z.enum(["all", "received", "on_the_way", "delivered", "cancelled"]).default("all"), from: z.string().optional(), to: z.string().optional(), sortBy: z.enum(["date", "earning", "status"]).default("date"), direction: z.enum(["asc", "desc"]).default("desc") })).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "courier") throw new Error("Detaylı rapor yalnızca kuryeler içindir");
      const rows = await listOrders(ctx.user.id, ctx.user.role);
      const filtered = filterAndSortCourierReport(rows, { ...input, status: input.status === "all" ? undefined : input.status });
      const totals = filtered.reduce((sum, row) => ({ orders: sum.orders + 1, earnings: sum.earnings + Number(row.courierEarning), gross: sum.gross + Number(row.totalPrice) }), { orders: 0, earnings: 0, gross: 0 });
      return { rows: filtered, totals };
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
