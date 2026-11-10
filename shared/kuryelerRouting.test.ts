import { describe, expect, it } from "vitest";
import { calculateDeliveryPrice, DEFAULT_PRICING, roundMoney } from "./kuryeler";
import { parseRouteGeometry } from "./kuryelerRouting";

describe("sürüş mesafesi fiyatı", () => {
  it("600 TL açılış + 50 TL/km örneğini KDV hariç üretir (10 km → 1.100 + 220 = 1.320)", () => {
    const result = calculateDeliveryPrice({ distanceKm: 10 });
    expect(result.netTl).toBe(1100);
    expect(result.vatTl).toBe(220);
    expect(result.grossTl).toBe(1320);
    expect(result.totalTl).toBe(1320);
    expect(result.baseTry).toBe(600);
    expect(result.distanceFeeTry).toBe(500);
  });

  it("kuş uçuşu varsaymaz; verilen sürüş km’sini kullanır", () => {
    const a = calculateDeliveryPrice({ distanceKm: 10 });
    const b = calculateDeliveryPrice({ distanceKm: 3 });
    const c = calculateDeliveryPrice({ distanceKm: 12 });
    expect(a.netTl).toBe(1100);
    expect(a.grossTl).toBe(1320);
    expect(b.netTl).toBe(750);
    expect(b.vatTl).toBe(150);
    expect(b.grossTl).toBe(900);
    expect(c.netTl).toBe(1200);
    expect(c.vatTl).toBe(240);
    expect(c.grossTl).toBe(1440);
  });

  it("yönetici yuvarlama basamağını net ve KDV’ye uygular", () => {
    expect(roundMoney(8.456, 2)).toBe(8.46);
    const result = calculateDeliveryPrice({
      distanceKm: 7.333,
      pricing: { ...DEFAULT_PRICING, roundingDecimals: 1 },
    });
    expect(result.netTl).toBe(966.7);
    expect(result.vatTl).toBe(193.3);
    expect(result.grossTl).toBe(1160);
    expect(result.totalTl).toBe(1160);
  });

  it("açılış ve km bedelini yönetici değerinden okur, üzerine KDV ekler", () => {
    const result = calculateDeliveryPrice({
      distanceKm: 5,
      pricing: { ...DEFAULT_PRICING, baseTry: 90, perKmTry: 30 },
    });
    expect(result.netTl).toBe(240);
    expect(result.vatTl).toBe(48);
    expect(result.grossTl).toBe(288);
    expect(result.totalTl).toBe(288);
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
