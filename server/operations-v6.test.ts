import { describe, expect, it } from "vitest";
import { roadApproxDistanceKm } from "./db";

describe("v6 courier operations", () => {
  it("Istanbul koordinatları arasında yol yaklaşık mesafesini pozitif ve yuvarlanmış üretir", () => {
    const distance = roadApproxDistanceKm({ lat: 41.0082, lng: 28.9784 }, { lat: 41.043, lng: 29.0094 });
    expect(distance).toBeGreaterThan(0);
    expect(Number.isInteger(distance * 100)).toBe(true);
  });

  it("aynı koordinat için sıfır mesafe döndürür", () => {
    expect(roadApproxDistanceKm({ lat: 41.0082, lng: 28.9784 }, { lat: 41.0082, lng: 28.9784 })).toBe(0);
  });
});
