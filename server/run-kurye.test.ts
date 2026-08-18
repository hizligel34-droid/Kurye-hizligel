import { describe, expect, it } from "vitest";
import { buildSupportMessagePayload, calculateCourierAchievement, calculateOrderFinancials, canTransitionStatus, summarizeAccountingRows } from "./db";
import { normalizeSupportLanguage, selectSupportReplyLanguage } from "./routers";

describe("Run Kurye role-based accounting", () => {
  const rows = [{ totalPrice: "1000", commission: "200", courierEarning: "800", companyRevenue: "200" }];

  it("shows only the customer's own spending without exposing commission or company revenue", () => {
    expect(summarizeAccountingRows(rows, "user")).toEqual({ totalOrders: 1, gross: 1000, commission: 0, courierEarnings: 0, companyRevenue: 0 });
  });

  it("shows the courier's assigned earnings without company revenue", () => {
    expect(summarizeAccountingRows(rows, "courier")).toEqual({ totalOrders: 1, gross: 1000, commission: 200, courierEarnings: 800, companyRevenue: 0 });
  });

  it("keeps the complete financial split for admin and accountant", () => {
    expect(summarizeAccountingRows(rows, "admin")).toEqual({ totalOrders: 1, gross: 1000, commission: 200, courierEarnings: 800, companyRevenue: 200 });
  });
});

describe("Run Kurye courier achievement", () => {
  it("counts only delivered orders and awards 10 points per completion", () => {
    expect(calculateCourierAchievement([{ status: "delivered" }, { status: "delivered" }, { status: "on_the_way" }])).toMatchObject({ completedDeliveries: 2, points: 20, badgeLabel: "Yeni Başlayan", nextBadgeLabel: "Güvenilir Kurye", nextBadgeAt: 5, remainingToNext: 3, progressPercent: 40 });
  });

  it("promotes a courier at the exact badge threshold", () => {
    expect(calculateCourierAchievement(Array.from({ length: 25 }, () => ({ status: "delivered" })))).toMatchObject({ completedDeliveries: 25, points: 250, badgeLabel: "Hızlı Kurye", nextBadgeLabel: "Usta Kurye", remainingToNext: 25, progressPercent: 0 });
  });

  it("caps elite couriers at the top badge", () => {
    expect(calculateCourierAchievement(Array.from({ length: 125 }, () => ({ status: "delivered" })))).toMatchObject({ completedDeliveries: 125, points: 1250, badgeLabel: "Elit Kurye", nextBadgeLabel: null, nextBadgeAt: null, remainingToNext: 0, progressPercent: 100 });
  });
});

describe("Run Kurye pricing", () => {
  it("charges 600 TL for distances up to 5 km", () => {
    expect(calculateOrderFinancials(5)).toEqual({ distanceKm: 5, total: 600, commission: 120, courierEarning: 480, companyRevenue: 120 });
    expect(calculateOrderFinancials(2)).toEqual({ distanceKm: 2, total: 600, commission: 120, courierEarning: 480, companyRevenue: 120 });
  });

  it("adds 100 TL for each km after the first 5 km", () => {
    expect(calculateOrderFinancials(8)).toEqual({ distanceKm: 8, total: 900, commission: 180, courierEarning: 720, companyRevenue: 180 });
  });

  it("keeps the commission fixed at 20 percent", () => {
    const result = calculateOrderFinancials(17.5);
    expect(result.commission).toBe(result.total * 0.2);
    expect(result.courierEarning + result.companyRevenue).toBe(result.total);
  });
});

describe("Run Kurye multilingual support", () => {
  it("keeps supported language codes for translation", () => {
    expect(normalizeSupportLanguage("en")).toBe("en");
    expect(normalizeSupportLanguage("DE")).toBe("de");
    expect(normalizeSupportLanguage("ar")).toBe("ar");
  });

  it("falls back safely to Turkish for unknown or missing languages", () => {
    expect(normalizeSupportLanguage("ja")).toBe("tr");
    expect(normalizeSupportLanguage(undefined)).toBe("tr");
  });

  it("selects the customer's language for the operator reply", () => {
    expect(selectSupportReplyLanguage("de")).toBe("de");
    expect(selectSupportReplyLanguage("unknown")).toBe("tr");
  });

  it("preserves original and translated message fields for DB storage", () => {
    expect(buildSupportMessagePayload({ orderId: 7, senderId: 2, senderRole: "operator", content: "Merhaba", detectedLanguage: "tr", translatedContent: "Hello" })).toMatchObject({ orderId: 7, content: "Merhaba", detectedLanguage: "tr", translatedContent: "Hello" });
  });
});

describe("Run Kurye status transitions", () => {
  it("allows received to on_the_way and on_the_way to delivered", () => {
    expect(canTransitionStatus("received", "on_the_way")).toBe(true);
    expect(canTransitionStatus("on_the_way", "delivered")).toBe(true);
  });

  it("rejects skipping workflow stages", () => {
    expect(canTransitionStatus("received", "delivered")).toBe(false);
    expect(canTransitionStatus("delivered", "on_the_way")).toBe(false);
  });
});
