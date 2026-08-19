import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { CourierContract, CourierDocument, CourierOperation, InsertUser, Message, courierContracts, courierDocuments, courierOperations, messages, notifications, orders, savedAddresses, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function listSavedAddresses(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(savedAddresses).where(eq(savedAddresses.userId, userId)).orderBy(desc(savedAddresses.updatedAt));
}

export async function createSavedAddress(input: {
  userId: number; label: string; province: string; district: string; neighborhood: string;
  street: string; buildingNo: string; apartmentNo?: string; floor?: string;
  courierNote?: string; addressDetail: string;
}) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const values = {
    userId: input.userId, label: input.label.trim(), province: input.province.trim(),
    district: input.district.trim(), neighborhood: input.neighborhood.trim(), street: input.street.trim(),
    buildingNo: input.buildingNo.trim(), apartmentNo: input.apartmentNo?.trim() ?? "",
    floor: input.floor?.trim() ?? "", courierNote: input.courierNote?.trim() ?? "",
    addressDetail: input.addressDetail.trim(),
  };
  await db.insert(savedAddresses).values(values);
  const rows = await db.select().from(savedAddresses).where(eq(savedAddresses.userId, input.userId)).orderBy(desc(savedAddresses.id)).limit(1);
  return rows[0];
}

export async function deleteSavedAddress(userId: number, addressId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.delete(savedAddresses).where(and(eq(savedAddresses.id, addressId), eq(savedAddresses.userId, userId)));
  return { deleted: true };
}

export async function upsertCourierOperation(input: { courierId: number; availability?: "offline" | "available" | "busy" | "break"; lat?: number; lng?: number; accuracy?: number | null }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const values = { courierId: input.courierId, availability: input.availability ?? "offline" as const, latitude: input.lat?.toFixed(7), longitude: input.lng?.toFixed(7), accuracy: input.accuracy == null ? null : input.accuracy.toFixed(2), lastLocationAt: input.lat != null && input.lng != null ? new Date() : undefined };
  await db.insert(courierOperations).values(values).onDuplicateKeyUpdate({ set: { ...values, updatedAt: new Date() } });
  const rows = await db.select().from(courierOperations).where(eq(courierOperations.courierId, input.courierId)).limit(1);
  return rows[0];
}

export async function listCourierOperations(): Promise<CourierOperation[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(courierOperations);
}

export function roadApproxDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Number((6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 1.25).toFixed(2));
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

export async function getCourierContract(courierId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(courierContracts).where(eq(courierContracts.courierId, courierId)).limit(1);
  return result[0];
}

export async function saveCourierContract(input: Omit<CourierContract, "id" | "acceptedAt" | "updatedAt">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(courierContracts).values(input).onDuplicateKeyUpdate({ set: { ...input, updatedAt: new Date() } });
  return getCourierContract(input.courierId);
}

export async function listCourierDocuments(courierId?: number) {
  const db = await getDb(); if (!db) return [];
  return courierId
    ? db.select().from(courierDocuments).where(eq(courierDocuments.courierId, courierId))
    : db.select().from(courierDocuments);
}

export async function saveCourierDocument(input: Omit<CourierDocument, "id" | "uploadedAt" | "reviewedAt">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(courierDocuments).values(input);
  const rows = await db.select().from(courierDocuments).where(eq(courierDocuments.courierId, input.courierId));
  return rows.filter(row => row.documentType === input.documentType).sort((a, b) => b.id - a.id)[0];
}

export async function getCourierDocument(documentId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(courierDocuments).where(eq(courierDocuments.id, documentId)).limit(1);
  return rows[0];
}

export async function reviewCourierDocument(documentId: number, status: "approved" | "rejected", reviewNote?: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(courierDocuments).set({ status, reviewNote: reviewNote || null, reviewedAt: new Date() }).where(eq(courierDocuments.id, documentId));
  const rows = await db.select().from(courierDocuments).where(eq(courierDocuments.id, documentId)).limit(1);
  return rows[0];
}

export function canTransitionStatus(from: string, to: string) {
  if (from === to) return true;
  if (from === "received") return to === "on_the_way" || to === "cancelled";
  if (from === "on_the_way") return to === "delivered" || to === "cancelled";
  return from === to;
}

export function evaluateSandboxPayment(input: { cardNumber: string; amount: number }) {
  const digits = input.cardNumber.replace(/\s/g, "");
  if (digits === "4000000000000002") return { status: "declined" as const, message: "Sandbox kartı reddedildi." };
  if (digits.length < 16) return { status: "declined" as const, message: "Sandbox kart numarası geçersiz." };
  return { status: "approved" as const, message: "Sandbox ödeme başarılı. Gerçek tahsilat yapılmadı.", amount: Number(input.amount.toFixed(2)) };
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

export type CourierReportRow = { id: number; trackingCode: string; status: string; totalPrice: string | number; courierEarning: string | number; createdAt: Date | string | number };

export function filterAndSortCourierReport(rows: CourierReportRow[], input: { status?: string; from?: string; to?: string; sortBy?: "date" | "earning" | "status"; direction?: "asc" | "desc" }) {
  const from = input.from ? new Date(`${input.from}T00:00:00`) : null;
  const to = input.to ? new Date(`${input.to}T23:59:59.999`) : null;
  const filtered = rows.filter(row => {
    const date = new Date(row.createdAt);
    return (!input.status || row.status === input.status) && (!from || date >= from) && (!to || date <= to);
  });
  const direction = input.direction === "asc" ? 1 : -1;
  return [...filtered].sort((a, b) => {
    if (input.sortBy === "earning") return (Number(a.courierEarning) - Number(b.courierEarning)) * direction;
    if (input.sortBy === "status") return a.status.localeCompare(b.status, "tr") * direction;
    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
  });
}

export function summarizeAccountingRows(rows: Array<{ totalPrice: string | number; commission: string | number; courierEarning: string | number; companyRevenue: string | number }>, role: string) {
  const summary = rows.reduce((sum, row) => ({
    totalOrders: sum.totalOrders + 1,
    gross: sum.gross + Number(row.totalPrice),
    commission: sum.commission + Number(row.commission),
    courierEarnings: sum.courierEarnings + Number(row.courierEarning),
    companyRevenue: sum.companyRevenue + Number(row.companyRevenue),
  }), { totalOrders: 0, gross: 0, commission: 0, courierEarnings: 0, companyRevenue: 0 });
  if (role === "courier") return { ...summary, companyRevenue: 0 };
  if (role === "user") return { ...summary, commission: 0, courierEarnings: 0, companyRevenue: 0 };
  return summary;
}

export type CourierAchievement = {
  completedDeliveries: number;
  points: number;
  badgeKey: "starter" | "reliable" | "swift" | "master" | "elite";
  badgeLabel: string;
  nextBadgeLabel: string | null;
  nextBadgeAt: number | null;
  progressPercent: number;
  remainingToNext: number;
};

const courierBadgeLevels = [
  { key: "starter" as const, at: 0, label: "Yeni Başlayan" },
  { key: "reliable" as const, at: 5, label: "Güvenilir Kurye" },
  { key: "swift" as const, at: 25, label: "Hızlı Kurye" },
  { key: "master" as const, at: 50, label: "Usta Kurye" },
  { key: "elite" as const, at: 100, label: "Elit Kurye" },
];

export function calculateCourierAchievement(rows: Array<{ status: string }>): CourierAchievement {
  const completedDeliveries = rows.filter(row => row.status === "delivered").length;
  const current = [...courierBadgeLevels].reverse().find(level => completedDeliveries >= level.at) ?? courierBadgeLevels[0];
  const next = courierBadgeLevels.find(level => level.at > completedDeliveries) ?? null;
  const span = next ? next.at - current.at : 1;
  const progressPercent = next ? Math.min(100, Math.round(((completedDeliveries - current.at) / span) * 100)) : 100;
  return {
    completedDeliveries,
    points: completedDeliveries * 10,
    badgeKey: current.key,
    badgeLabel: current.label,
    nextBadgeLabel: next?.label ?? null,
    nextBadgeAt: next?.at ?? null,
    progressPercent,
    remainingToNext: next ? Math.max(0, next.at - completedDeliveries) : 0,
  };
}

export type CourierLeaderboardEntry = {
  rank: number;
  courierId: number;
  displayName: string;
  completedDeliveries: number;
  points: number;
  badgeKey: CourierAchievement["badgeKey"];
  badgeLabel: string;
};

export function rankCourierLeaderboard(entries: Array<Omit<CourierLeaderboardEntry, "rank">>): CourierLeaderboardEntry[] {
  return [...entries].sort((a, b) => b.points - a.points || b.completedDeliveries - a.completedDeliveries || a.displayName.localeCompare(b.displayName, "tr"))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function getCourierLeaderboard(): Promise<CourierLeaderboardEntry[]> {
  const db = await getDb();
  if (!db) return [];
  const courierRows = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "courier"));
  const deliveredRows = await db.select({ courierId: orders.courierId, status: orders.status }).from(orders).where(eq(orders.status, "delivered"));
  const counts = new Map<number, number>();
  deliveredRows.forEach(row => { if (row.courierId) counts.set(row.courierId, (counts.get(row.courierId) ?? 0) + 1); });
  return rankCourierLeaderboard(courierRows.map(courier => {
    const completedDeliveries = counts.get(courier.id) ?? 0;
    const achievement = calculateCourierAchievement(Array.from({ length: completedDeliveries }, () => ({ status: "delivered" })));
    return { courierId: courier.id, displayName: courier.name?.trim().split(/\\s+/)[0] || "Kurye", completedDeliveries, points: achievement.points, badgeKey: achievement.badgeKey, badgeLabel: achievement.badgeLabel };
  }));
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

export function buildOrderAddressDetails(input: { pickupAddressDetail?: string; deliveryAddressDetail?: string; pickupBuildingNo?: string; deliveryBuildingNo?: string; pickupApartmentNo?: string; deliveryApartmentNo?: string; pickupFloor?: string; deliveryFloor?: string; pickupCourierNote?: string; deliveryCourierNote?: string }) {
  const normalize = (value: string | undefined) => (value ?? "Belirtilmedi").trim().slice(0, 240) || "Belirtilmedi";
  const optional = (value: string | undefined, max: number) => (value ?? "").trim().slice(0, max);
  return {
    pickupAddressDetail: normalize(input.pickupAddressDetail),
    deliveryAddressDetail: normalize(input.deliveryAddressDetail),
    pickupBuildingNo: optional(input.pickupBuildingNo, 30),
    deliveryBuildingNo: optional(input.deliveryBuildingNo, 30),
    pickupApartmentNo: optional(input.pickupApartmentNo, 30),
    deliveryApartmentNo: optional(input.deliveryApartmentNo, 30),
    pickupFloor: optional(input.pickupFloor, 20),
    deliveryFloor: optional(input.deliveryFloor, 20),
    pickupCourierNote: optional(input.pickupCourierNote, 500),
    deliveryCourierNote: optional(input.deliveryCourierNote, 500),
  };
}

export function buildSupportMessagePayload(input: { orderId: number; senderId?: number; senderRole: Message['senderRole']; content: string; detectedLanguage: string; translatedContent: string; attachmentKey?: string | null; attachmentUrl?: string | null; attachmentContentType?: string | null; attachmentName?: string | null; attachmentSizeBytes?: number | null }) {
  return { orderId: input.orderId, senderId: input.senderId, senderRole: input.senderRole, content: input.content, detectedLanguage: input.detectedLanguage, translatedContent: input.translatedContent, attachmentKey: input.attachmentKey ?? null, attachmentUrl: input.attachmentUrl ?? null, attachmentContentType: input.attachmentContentType ?? null, attachmentName: input.attachmentName ?? null, attachmentSizeBytes: input.attachmentSizeBytes ?? null };
}

export async function addMessage(input: { orderId: number; senderId?: number; senderRole: Message['senderRole']; content: string; detectedLanguage?: string; translatedContent?: string; attachmentKey?: string | null; attachmentUrl?: string | null; attachmentContentType?: string | null; attachmentName?: string | null; attachmentSizeBytes?: number | null }) {
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
