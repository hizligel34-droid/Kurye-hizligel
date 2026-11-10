import { describe, expect, it } from "vitest";
import { calculateDeliveryPrice, DEFAULT_PRICING, roundMoney } from "./kuryeler";
import { parseRouteGeometry } from "./kuryelerRouting";

describe("sürüş mesafesi fiyatı", () => {
  it("1 USD açılış + 1 USD/km örneğini üretir (7,4 km → 8,4 USD)", () => {
    const result = calculateDeliveryPrice({ distanceKm: 7.4 });
    expect(result.priceUsd).toBe(8.4);
    expect(result.baseUsd).toBe(1);
    expect(result.distanceFeeUsd).toBe(7.4);
  });

  it("kuş uçuşu varsaymaz; verilen sürüş km’sini kullanır", () => {
    const a = calculateDeliveryPrice({ distanceKm: 10 });
    const b = calculateDeliveryPrice({ distanceKm: 3 });
    expect(a.priceUsd).toBe(11);
    expect(b.priceUsd).toBe(4);
  });

  it("yönetici yuvarlama basamağını uygular", () => {
    expect(roundMoney(8.456, 2)).toBe(8.46);
    const result = calculateDeliveryPrice({
      distanceKm: 7.44,
      pricing: { ...DEFAULT_PRICING, roundingDecimals: 1 },
    });
    expect(result.priceUsd).toBe(8.4);
  });

  it("USD/TL kuru isteğe bağlı eşdeğer üretir", () => {
    const withRate = calculateDeliveryPrice({
      distanceKm: 7.4,
      pricing: { ...DEFAULT_PRICING, usdToTry: 40 },
    });
    expect(withRate.priceTl).toBe(336);
    const noRate = calculateDeliveryPrice({
      distanceKm: 7.4,
      pricing: { ...DEFAULT_PRICING, usdToTry: 0 },
    });
    expect(noRate.priceTl).toBe(0);
  });

  it("açılış ve km bedelini yönetici değerinden okur", () => {
    const result = calculateDeliveryPrice({
      distanceKm: 5,
      pricing: { ...DEFAULT_PRICING, baseUsd: 2, perKmUsd: 1.5 },
    });
    expect(result.priceUsd).toBe(9.5);
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
