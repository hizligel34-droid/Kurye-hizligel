import { describe, expect, it } from "vitest";
import { etaMinutesFromRoute, speedKmhFromMetersPerSecond } from "../client/src/lib/courierEta";

describe("Kurye hız ve ETA yardımcıları", () => {
  it("metre/saniye hızını km/sa değerine yuvarlar", () => {
    expect(speedKmhFromMetersPerSecond(10)).toBe(36);
    expect(speedKmhFromMetersPerSecond(null)).toBeNull();
    expect(speedKmhFromMetersPerSecond(-1)).toBeNull();
  });

  it("doğrulanmış rota süresinden güvenli ETA üretir", () => {
    expect(etaMinutesFromRoute(12.4, "on_the_way")).toBe(12);
    expect(etaMinutesFromRoute(0.2, "received")).toBe(1);
    expect(etaMinutesFromRoute(null, "on_the_way")).toBeNull();
  });

  it("tamamlanan veya iptal edilen siparişte ETA’yı sıfırlar", () => {
    expect(etaMinutesFromRoute(15, "delivered")).toBe(0);
    expect(etaMinutesFromRoute(15, "cancelled")).toBe(0);
  });
});
