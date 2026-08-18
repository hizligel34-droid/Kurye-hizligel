import { z } from "zod";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { invokeLLM } from "./_core/llm";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { addMessage, addNotification, buildSupportMessagePayload, calculateOrderFinancials, canTransitionStatus, getDb, getMessages, getOrderByTrackingCode, listNotifications, listOrders, updateUserProfile } from "./db";
import { orders } from "../drizzle/schema";
import { nanoid } from "nanoid";

const statusLabels = { received: "Alındı", on_the_way: "Yolda", delivered: "Teslim Edildi", cancelled: "İptal Edildi" } as const;
export const supportedLanguages = ["tr", "en", "de", "ru", "ar", "zh", "el"] as const;
export function normalizeSupportLanguage(language: string | null | undefined) {
  return supportedLanguages.includes((language ?? "").toLowerCase() as typeof supportedLanguages[number]) ? (language ?? "").toLowerCase() : "tr";
}
export function selectSupportReplyLanguage(customerLanguage: string | null | undefined) {
  return normalizeSupportLanguage(customerLanguage);
}

type TranslationResult = { sourceLanguage: string; translatedText: string };
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

async function getAccessibleOrder(orderId: number, user: { id: number; role: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = result[0];
  if (!order) throw new Error("Sipariş bulunamadı");
  const allowed = user.role === "admin" || order.customerId === user.id || (user.role === "courier" && order.courierId === user.id);
  if (!allowed) throw new Error("Bu siparişe erişim yetkiniz yok");
  return { db, order };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  profile: router({ update: protectedProcedure.input(z.object({ name: z.string().min(2), phone: z.string().min(7) })).mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input)) }),
  pricing: router({
    estimate: publicProcedure.input(z.object({ distanceKm: z.number().min(0) })).query(({ input }) => calculateOrderFinancials(input.distanceKm)),
  }),
  orders: router({
    create: protectedProcedure.input(z.object({ pickupAddress: z.string().min(5), deliveryAddress: z.string().min(5), productDescription: z.string().min(2), customerPhone: z.string().min(7), distanceKm: z.number().min(0) })).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const financials = calculateOrderFinancials(input.distanceKm);
      const trackingCode = `RUN-${nanoid(8).toUpperCase()}`;
      await db.insert(orders).values({ trackingCode, customerId: ctx.user.id, pickupAddress: input.pickupAddress, deliveryAddress: input.deliveryAddress, productDescription: input.productDescription, customerPhone: input.customerPhone, distanceKm: financials.distanceKm.toFixed(2), totalPrice: financials.total.toFixed(2), commission: financials.commission.toFixed(2), courierEarning: financials.courierEarning.toFixed(2), companyRevenue: financials.companyRevenue.toFixed(2), status: "received" });
      await addNotification({ userId: ctx.user.id, title: "Siparişiniz alındı", content: `${trackingCode} numaralı siparişiniz oluşturuldu.` });
      return { trackingCode, ...financials, status: "received" as const };
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
      if (!["admin", "accountant"].includes(ctx.user.role)) throw new Error("Bu raporu görme yetkiniz yok");
      const rows = await listOrders(ctx.user.id, ctx.user.role);
      return rows.reduce((sum, row) => ({ totalOrders: sum.totalOrders + 1, gross: sum.gross + Number(row.totalPrice), commission: sum.commission + Number(row.commission), courierEarnings: sum.courierEarnings + Number(row.courierEarning), companyRevenue: sum.companyRevenue + Number(row.companyRevenue) }), { totalOrders: 0, gross: 0, commission: 0, courierEarnings: 0, companyRevenue: 0 });
    }),
  }),
});

export type AppRouter = typeof appRouter;
