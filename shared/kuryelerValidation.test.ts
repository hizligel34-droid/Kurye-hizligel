import { describe, expect, it } from "vitest";
import {
  firstError,
  validateAuthForm,
  validateDeliveryOrder,
  validatePricingForm,
  validateTrackingCode,
} from "./kuryelerValidation";

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

  it("aynı alış-teslim adresini reddeder", () => {
    const errors = validateDeliveryOrder({
      pickupDistrict: "Kadıköy",
      pickupNeighborhood: "Caferağa",
      pickupStreet: "Moda",
      dropoffDistrict: "Kadıköy",
      dropoffNeighborhood: "Caferağa",
      dropoffStreet: "Moda",
      contactPhone: "05421110003",
    });
    expect(errors.dropoffStreet).toMatch(/aynı olamaz/);
  });

  it("komisyon aralığını denetler", () => {
    expect(validatePricingForm({ baseFeeTl: 150, perKmTl: 25, commissionRate: 1.2, crossSideSurchargeTl: 40 }).commissionRate).toMatch(/0 ile 1/);
  });

  it("boş takip kodunu çevirir", () => {
    expect(validateTrackingCode("")).toMatch(/Takip kodu/);
  });
});
