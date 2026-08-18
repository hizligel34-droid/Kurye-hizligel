import { describe, expect, it } from "vitest";
import { isIstanbulCoordinate, validateIstanbulAddress } from "./routers";

describe("İstanbul server-side scope", () => {
  it("accepts a complete Istanbul address hierarchy", () => {
    expect(() => validateIstanbulAddress({
      pickupProvince: "İstanbul",
      pickupDistrict: "Kadıköy",
      pickupNeighborhood: "Caferağa",
      deliveryProvince: "İstanbul",
      deliveryDistrict: "Beşiktaş",
      deliveryNeighborhood: "Vişnezade",
    })).not.toThrow();
  });

  it("rejects a non-Istanbul province", () => {
    expect(() => validateIstanbulAddress({
      pickupProvince: "Ankara",
      pickupDistrict: "Çankaya",
      pickupNeighborhood: "Kızılay",
      deliveryProvince: "İstanbul",
      deliveryDistrict: "Beşiktaş",
      deliveryNeighborhood: "Vişnezade",
    })).toThrow("yalnızca İstanbul");
  });

  it("rejects an incomplete Istanbul hierarchy when province is supplied", () => {
    expect(() => validateIstanbulAddress({ pickupProvince: "İstanbul", deliveryProvince: "İstanbul" })).toThrow("ilçe ve mahalle");
  });

  it("recognizes Istanbul route coordinates and rejects outside coordinates", () => {
    expect(isIstanbulCoordinate({ lat: 41.01, lng: 28.97 })).toBe(true);
    expect(isIstanbulCoordinate({ lat: 39.93, lng: 32.85 })).toBe(false);
  });
});
