import { describe, expect, it } from "vitest";
import { evaluateDeliveryCoverage, isWithinOperatingHours } from "@shared/deliveryCoverage";

const openIstanbul = {
  provinceName: "İstanbul",
  isEnabled: 1,
  operatingStart: "09:00",
  operatingEnd: "22:00",
  etaBufferMinutes: 20,
};

describe("delivery coverage", () => {
  it("gece yarısını aşan çalışma saatlerini doğru değerlendirir", () => {
    expect(isWithinOperatingHours("20:00", "03:00", 22 * 60)).toBe(true);
    expect(isWithinOperatingHours("20:00", "03:00", 2 * 60)).toBe(true);
    expect(isWithinOperatingHours("20:00", "03:00", 12 * 60)).toBe(false);
  });

  it("tanımlanmamış ili anında kapsam dışı gösterir", () => {
    const result = evaluateDeliveryCoverage({
      pickupProvince: "İstanbul",
      deliveryProvince: "Ankara",
      pickupCoverage: openIstanbul,
      deliveryCoverage: null,
      serviceType: "standard",
      currentMinutes: 10 * 60,
    });

    expect(result).toMatchObject({ status: "unsupported", isAvailable: false, estimatedDeliveryMinutes: null });
    expect(result.message).toContain("Ankara");
  });

  it("çalışma saatleri dışında siparişi kapatır", () => {
    const result = evaluateDeliveryCoverage({
      pickupProvince: "İstanbul",
      deliveryProvince: "İstanbul",
      pickupCoverage: openIstanbul,
      deliveryCoverage: openIstanbul,
      serviceType: "express",
      currentMinutes: 23 * 60,
    });

    expect(result).toMatchObject({ status: "closed", isAvailable: false, operatingWindow: "09:00–22:00" });
  });

  it("rota süresine il ek süresini ekleyerek teslimat tahmini üretir", () => {
    const result = evaluateDeliveryCoverage({
      pickupProvince: "İstanbul",
      deliveryProvince: "İstanbul",
      pickupCoverage: openIstanbul,
      deliveryCoverage: { ...openIstanbul, etaBufferMinutes: 35 },
      serviceType: "express",
      routeDurationMinutes: 80,
      currentMinutes: 10 * 60,
    });

    expect(result).toMatchObject({ status: "available", isAvailable: true, estimatedDeliveryMinutes: 130 });
  });
});
