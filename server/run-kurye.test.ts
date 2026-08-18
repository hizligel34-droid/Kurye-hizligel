import { describe, expect, it } from "vitest";
import { buildSupportMessagePayload, calculateOrderFinancials, canTransitionStatus } from "./db";
import { normalizeSupportLanguage, selectSupportReplyLanguage } from "./routers";

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
