import { describe, expect, it } from "vitest";
import { validateDeliveryAddress } from "./routers";
import { isValidTurkeyLocation } from "./realtime";

describe("Türkiye geneli adres sözleşmesi", () => {
  it("tam bir İstanbul adres hiyerarşisini kabul eder", () => {
    expect(() => validateDeliveryAddress({
      pickupProvince: "İstanbul",
      pickupDistrict: "Kadıköy",
      pickupNeighborhood: "Caferağa",
      deliveryProvince: "İstanbul",
      deliveryDistrict: "Beşiktaş",
      deliveryNeighborhood: "Vişnezade",
    })).not.toThrow();
  });

  it("tam bir Ankara adres hiyerarşisini kabul eder", () => {
    expect(() => validateDeliveryAddress({
      pickupProvince: "Ankara",
      pickupDistrict: "Çankaya",
      pickupNeighborhood: "Kızılay",
      deliveryProvince: "İstanbul",
      deliveryDistrict: "Beşiktaş",
      deliveryNeighborhood: "Vişnezade",
    })).not.toThrow();
  });

  it("il seçildiğinde eksik ilçe veya mahalle bilgisini reddeder", () => {
    expect(() => validateDeliveryAddress({ pickupProvince: "İstanbul", deliveryProvince: "İstanbul" })).toThrow("İl, ilçe ve mahalle");
  });

  it("Türkiye içi rota koordinatlarını kabul eder ve ülke dışını reddeder", () => {
    expect(isValidTurkeyLocation({ lat: 41.01, lng: 28.97 })).toBe(true);
    expect(isValidTurkeyLocation({ lat: 39.93, lng: 32.85 })).toBe(true);
    expect(isValidTurkeyLocation({ lat: 48.85, lng: 2.35 })).toBe(false);
  });
});
