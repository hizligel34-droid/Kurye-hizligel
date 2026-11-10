import { describe, expect, it } from "vitest";
import { calculateDeliveryPrice, DEFAULT_PRICING, roundMoney } from "./kuryeler";
import { parseRouteGeometry } from "./kuryelerRouting";

describe("sürüş mesafesi fiyatı", () => {
  it("600 TL açılış + 50 TL/km örneğini üretir (7,4 km → 970 TL)", () => {
    const result = calculateDeliveryPrice({ distanceKm: 7.4 });
    expect(result.totalTl).toBe(970);
    expect(result.baseTry).toBe(600);
    expect(result.distanceFeeTry).toBe(370);
  });

  it("kuş uçuşu varsaymaz; verilen sürüş km’sini kullanır", () => {
    const a = calculateDeliveryPrice({ distanceKm: 10 });
    const b = calculateDeliveryPrice({ distanceKm: 3 });
    expect(a.totalTl).toBe(1100);
    expect(b.totalTl).toBe(750);
  });

  it("yönetici yuvarlama basamağını uygular", () => {
    expect(roundMoney(8.456, 2)).toBe(8.46);
    const result = calculateDeliveryPrice({
      distanceKm: 7.333,
      pricing: { ...DEFAULT_PRICING, roundingDecimals: 1 },
    });
    expect(result.totalTl).toBe(966.7);
  });

  it("açılış ve km bedelini yönetici değerinden okur", () => {
    const result = calculateDeliveryPrice({
      distanceKm: 5,
      pricing: { ...DEFAULT_PRICING, baseTry: 90, perKmTry: 30 },
    });
    expect(result.totalTl).toBe(240);
  });
});

describe("rota geometrisi", () => {
  it("kayıtlı [lat,lng] dizisini okur", () => {
    expect(parseRouteGeometry("[[41,29],[41.1,29.1]]")).toEqual([
      [41, 29],
      [41.1, 29.1],
    ]);
  });
});
