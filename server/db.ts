import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, Message, messages, notifications, orders, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (['name', 'email', 'loginMethod', 'phone'] as const).forEach(field => {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserProfile(userId: number, input: { name?: string; phone?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(users).set({ name: input.name, phone: input.phone }).where(eq(users.id, userId));
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export function canTransitionStatus(from: string, to: string) {
  if (from === to) return true;
  if (from === "received") return to === "on_the_way" || to === "cancelled";
  if (from === "on_the_way") return to === "delivered" || to === "cancelled";
  return from === to;
}

export function calculateOrderFinancials(distanceKm: number) {
  const safeDistance = Math.max(0, Number(distanceKm) || 0);
  const total = 600 + Math.max(0, safeDistance - 5) * 100;
  const commission = total * 0.2;
  return { distanceKm: Number(safeDistance.toFixed(2)), total: Number(total.toFixed(2)), commission: Number(commission.toFixed(2)), courierEarning: Number((total - commission).toFixed(2)), companyRevenue: Number(commission.toFixed(2)) };
}

export async function listOrders(userId: number, role: string) {
  const db = await getDb(); if (!db) return [];
  if (role === 'admin' || role === 'accountant') return db.select().from(orders).orderBy(desc(orders.createdAt));
  if (role === 'courier') return db.select().from(orders).where(eq(orders.courierId, userId)).orderBy(desc(orders.createdAt));
  return db.select().from(orders).where(eq(orders.customerId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderByTrackingCode(trackingCode: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.trackingCode, trackingCode.toUpperCase())).limit(1);
  return result[0];
}

export async function getMessages(orderId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(messages).where(eq(messages.orderId, orderId)).orderBy(messages.createdAt);
}

export function buildOrderAddressDetails(input: { pickupAddressDetail?: string; deliveryAddressDetail?: string }) {
  const normalize = (value: string | undefined) => (value ?? "Belirtilmedi").trim().slice(0, 240) || "Belirtilmedi";
  return { pickupAddressDetail: normalize(input.pickupAddressDetail), deliveryAddressDetail: normalize(input.deliveryAddressDetail) };
}

export function buildSupportMessagePayload(input: { orderId: number; senderId?: number; senderRole: Message['senderRole']; content: string; detectedLanguage: string; translatedContent: string }) {
  return { orderId: input.orderId, senderId: input.senderId, senderRole: input.senderRole, content: input.content, detectedLanguage: input.detectedLanguage, translatedContent: input.translatedContent };
}

export async function addMessage(input: { orderId: number; senderId?: number; senderRole: Message['senderRole']; content: string; detectedLanguage?: string; translatedContent?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(messages).values(input);
  return getMessages(input.orderId);
}

export async function addNotification(input: { userId: number; orderId?: number; title: string; content: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(notifications).values(input);
}

export async function listNotifications(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}
