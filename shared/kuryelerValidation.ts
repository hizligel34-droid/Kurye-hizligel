import { isValidTurkishMobilePhone } from "./orderValidation";

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function firstError(errors: FieldErrors) {
  return Object.values(errors)[0] ?? null;
}

export function validateAuthForm(input: {
  mode: "giris" | "kayit";
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const email = input.email.trim();
  if (!email) errors.email = "E-posta adresi zorunludur.";
  else if (!EMAIL_RE.test(email)) errors.email = "Geçerli bir e-posta yazın.";
  if (!input.password) errors.password = "Şifre zorunludur.";
  else if (input.mode === "kayit" && input.password.length < 8) {
    errors.password = "Şifre en az 8 karakter olmalıdır.";
  }
  if (input.mode === "kayit") {
    if (!input.fullName?.trim() || input.fullName.trim().length < 2) {
      errors.fullName = "Ad soyad en az 2 karakter olmalıdır.";
    }
    if (!input.phone?.trim()) errors.phone = "Cep telefonu zorunludur.";
    else if (!isValidTurkishMobilePhone(input.phone)) {
      errors.phone = "Geçerli bir Türkiye cep numarası girin (05xx xxx xx xx).";
    }
  }
  return errors;
}

export function validateDeliveryOrder(input: {
  pickupDistrict: string;
  pickupNeighborhood: string;
  pickupStreet: string;
  dropoffDistrict: string;
  dropoffNeighborhood: string;
  dropoffStreet: string;
  contactPhone: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.pickupDistrict) errors.pickupDistrict = "Alış ilçesini seçin.";
  if (!input.pickupNeighborhood.trim()) errors.pickupNeighborhood = "Alış mahallesini yazın.";
  if (!input.pickupStreet.trim()) errors.pickupStreet = "Alış sokak veya caddeyi yazın.";
  if (!input.dropoffDistrict) errors.dropoffDistrict = "Teslim ilçesini seçin.";
  if (!input.dropoffNeighborhood.trim()) errors.dropoffNeighborhood = "Teslim mahallesini yazın.";
  if (!input.dropoffStreet.trim()) errors.dropoffStreet = "Teslim sokak veya caddeyi yazın.";
  const pickupKey = [input.pickupDistrict, input.pickupNeighborhood, input.pickupStreet]
    .join("|")
    .toLocaleLowerCase("tr-TR");
  const dropoffKey = [input.dropoffDistrict, input.dropoffNeighborhood, input.dropoffStreet]
    .join("|")
    .toLocaleLowerCase("tr-TR");
  if (input.pickupDistrict && pickupKey === dropoffKey) {
    errors.dropoffStreet = "Alış ve teslim adresi aynı olamaz.";
  }
  if (!input.contactPhone.trim()) errors.contactPhone = "İletişim telefonu zorunludur.";
  else if (!isValidTurkishMobilePhone(input.contactPhone)) {
    errors.contactPhone = "Geçerli bir Türkiye cep numarası girin (05xx xxx xx xx).";
  }
  return errors;
}

export function validatePricingForm(input: {
  baseFeeTl: number;
  perKmTl: number;
  commissionRate: number;
  crossSideSurchargeTl: number;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!(input.baseFeeTl >= 0)) errors.baseFeeTl = "Açılış ücreti 0 veya daha büyük olmalıdır.";
  if (!(input.perKmTl >= 0)) errors.perKmTl = "Km bedeli 0 veya daha büyük olmalıdır.";
  if (!(input.crossSideSurchargeTl >= 0)) {
    errors.crossSideSurchargeTl = "Bölge ek ücreti 0 veya daha büyük olmalıdır.";
  }
  if (!(input.commissionRate >= 0 && input.commissionRate <= 1)) {
    errors.commissionRate = "Komisyon 0 ile 1 arasında olmalıdır (ör. %20 için 0,20).";
  }
  return errors;
}

export function validateTrackingCode(code: string) {
  if (!code.trim()) return "Takip kodunu yazın.";
  if (code.trim().length < 4) return "Takip kodu çok kısa görünüyor.";
  return null;
}
