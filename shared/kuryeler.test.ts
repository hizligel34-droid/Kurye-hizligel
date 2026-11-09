import { describe, expect, it } from "vitest";
import {
  calculateDeliveryPrice,
  canTransitionStatus,
  DEFAULT_PRICING,
  estimateDistanceKm,
  generateTrackingCode,
  nextCourierStatus,
  STATUS_LABELS,
} from "./kuryeler";

describe("kuryeler.tr sipariş durumları", () => {
  it("Beklemede → atandı → alındı → yolda → teslim adımlarına izin verir", () => {
    expect(canTransitionStatus("pending", "assigned")).toBe(true);
    expect(canTransitionStatus("assigned", "picked_up")).toBe(true);
    expect(canTransitionStatus("picked_up", "en_route")).toBe(true);
    expect(canTransitionStatus("en_route", "delivered")).toBe(true);
  });

  it("aşama atlamayı reddeder", () => {
    expect(canTransitionStatus("pending", "delivered")).toBe(false);
    expect(canTransitionStatus("assigned", "en_route")).toBe(false);
    expect(canTransitionStatus("delivered", "en_route")).toBe(false);
  });

  it("iptali teslimattan önce izinli tutar", () => {
    expect(canTransitionStatus("pending", "cancelled")).toBe(true);
    expect(canTransitionStatus("en_route", "cancelled")).toBe(true);
    expect(canTransitionStatus("delivered", "cancelled")).toBe(false);
  });

  it("kurye bir sonraki adımı sırayla önerir", () => {
    expect(nextCourierStatus("assigned")).toBe("picked_up");
    expect(nextCourierStatus("picked_up")).toBe("en_route");
    expect(nextCourierStatus("en_route")).toBe("delivered");
    expect(nextCourierStatus("pending")).toBeNull();
  });

  it("Türkçe durum etiketlerini korur", () => {
    expect(STATUS_LABELS.pending).toBe("Beklemede");
    expect(STATUS_LABELS.assigned).toBe("Kuryeye atandı");
    expect(STATUS_LABELS.picked_up).toBe("Alındı");
    expect(STATUS_LABELS.en_route).toBe("Yolda");
    expect(STATUS_LABELS.delivered).toBe("Teslim edildi");
    expect(STATUS_LABELS.cancelled).toBe("İptal");
  });
});

describe("kuryeler.tr fiyatlandırma", () => {
  it("açılış ücreti + km bedeli + paket ek ücretini toplar", () => {
    const result = calculateDeliveryPrice({
      pickupDistrict: "Kadıköy",
      dropoffDistrict: "Kadıköy",
      packageType: "orta",
      distanceKm: 4,
      pricing: DEFAULT_PRICING,
    });
    expect(result.baseFeeTl).toBe(150);
    expect(result.distanceFeeTl).toBe(100);
    expect(result.packageFeeTl).toBe(25);
    expect(result.zoneSurchargeTl).toBe(0);
    expect(result.totalTl).toBe(275);
    expect(result.commissionTl).toBe(55);
    expect(result.courierEarningTl).toBe(220);
  });

  it("Avrupa–Anadolu geçişinde bölge ek ücreti uygular", () => {
    const result = calculateDeliveryPrice({
      pickupDistrict: "Beşiktaş",
      dropoffDistrict: "Kadıköy",
      packageType: "evrak",
      distanceKm: 8,
    });
    expect(result.zoneSurchargeTl).toBe(40);
    expect(result.totalTl).toBe(150 + 8 * 25 + 40);
  });

  it("bölge kapalıysa kıta ek ücreti almaz", () => {
    const result = calculateDeliveryPrice({
      pickupDistrict: "Beşiktaş",
      dropoffDistrict: "Kadıköy",
      packageType: "evrak",
      distanceKm: 8,
      pricing: { ...DEFAULT_PRICING, useZones: false },
    });
    expect(result.zoneSurchargeTl).toBe(0);
    expect(result.totalTl).toBe(350);
  });

  it("Kadıköy–Beşiktaş mesafe tahminini üretir", () => {
    const km = estimateDistanceKm("Kadıköy", "Beşiktaş");
    expect(km).toBeGreaterThan(4);
    expect(km).toBeLessThan(20);
  });
});

describe("kuryeler.tr takip kodu", () => {
  it("KY- önekiyle üretir", () => {
    expect(generateTrackingCode()).toMatch(/^KY-[A-Z0-9]+$/);
  });
});
