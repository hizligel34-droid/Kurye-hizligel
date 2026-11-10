import { describe, expect, it } from "vitest";
import { WEIGHT_LIMIT_MESSAGE } from "./kuryeler";
import {
  firstError,
  validateAuthForm,
  validateCommissionRate,
  validateDeliveryOrder,
  validateDistrictPrice,
  validatePricingForm,
  validateTrackingCode,
  validateWeightKg,
} from "./kuryelerValidation";

const validOrder = {
  product: "Sözleşme evrakı",
  pickupAddress: "Moda Cad. No 12, Kadıköy",
  dropoffAddress: "Büyükdere Cad. No 120, Levent",
  recipientName: "Ayşe Demir",
  scheduledAt: "2026-11-10T14:00",
  contactPhone: "05421110003",
  paymentMethod: "nakit",
  weightKg: 2,
  distanceKm: 7.4,
  pickupLat: 40.9879,
  pickupLng: 29.0256,
  dropoffLat: 41.0814,
  dropoffLng: 29.0119,
};

describe("kuryeler.tr form doğrulama", () => {
  it("kayıtta Türkçe mesaj üretir", () => {
    const errors = validateAuthForm({
      mode: "kayit",
      email: "yanlis",
      password: "123",
      fullName: "A",
      phone: "123",
    });
    expect(errors.email).toMatch(/e-posta/i);
    expect(errors.password).toMatch(/8 karakter/);
    expect(errors.phone).toMatch(/cep/);
    expect(firstError(errors)).toBeTruthy();
  });

  it("geçerli girişi kabul eder", () => {
    expect(
      validateAuthForm({
        mode: "giris",
        email: "musteri@kuryeler.tr",
        password: "gizli",
      }),
    ).toEqual({});
  });

  it("aynı alım ve gidecek yeri reddeder", () => {
    const errors = validateDeliveryOrder({
      ...validOrder,
      pickupAddress: "Moda Cad. No 12",
      dropoffAddress: "Moda Cad. No 12",
    });
    expect(errors.dropoffAddress).toMatch(/aynı olamaz/);
  });

  it("ürün, rota ve teslim alan kişiyi zorunlu tutar", () => {
    const errors = validateDeliveryOrder({
      ...validOrder,
      product: "",
      recipientName: "",
      distanceKm: 0,
      pickupLat: null,
      dropoffLat: null,
    });
    expect(errors.product).toBeTruthy();
    expect(errors.route).toBeTruthy();
    expect(errors.recipientName).toBeTruthy();
  });

  it("geçerli siparişi kabul eder", () => {
    expect(validateDeliveryOrder(validOrder)).toEqual({});
  });

  it("30 kg üzerini tam Türkçe mesajla reddeder", () => {
    expect(validateWeightKg(30)).toBeNull();
    expect(validateWeightKg(30.1)).toBe(WEIGHT_LIMIT_MESSAGE);
    const errors = validateDeliveryOrder({ ...validOrder, weightKg: 31 });
    expect(errors.weightKg).toBe("Maksimum taşıma sınırı 30 kg");
  });

  it("bölge referans fiyatını ve komisyonu denetler", () => {
    expect(validateDistrictPrice(-1)).toMatch(/0 veya/);
    expect(validateDistrictPrice(350)).toBeNull();
    expect(validateCommissionRate(1.2)).toMatch(/0 ile 1/);
    expect(validateCommissionRate(0.2)).toBeNull();
  });

  it("yönetici fiyat formunu denetler", () => {
    expect(
      validatePricingForm({
        baseTry: 600,
        perKmTry: 50,
        roundingDecimals: 2,
        vatRate: 0.2,
        routingProvider: "osrm",
        commissionRate: 0.2,
      }),
    ).toEqual({});
    expect(
      validatePricingForm({
        baseTry: -1,
        perKmTry: 1,
        roundingDecimals: 9,
        vatRate: 0.2,
        routingProvider: "hayir",
        commissionRate: 2,
      }).baseTry,
    ).toBeTruthy();
    expect(
      validatePricingForm({
        baseTry: 600,
        perKmTry: 50,
        roundingDecimals: 2,
        vatRate: 1.5,
        routingProvider: "osrm",
        commissionRate: 0.2,
      }).vatRate,
    ).toMatch(/KDV oranı/);
  });

  it("boş takip kodunu çevirir", () => {
    expect(validateTrackingCode("")).toMatch(/Takip kodu/);
  });
});
