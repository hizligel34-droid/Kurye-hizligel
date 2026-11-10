import {
  MAX_WEIGHT_KG,
  PAYMENT_METHODS,
  WEIGHT_LIMIT_MESSAGE,
  type PaymentMethod,
  type RoutingProvider,
} from "./kuryeler";
import { isPlausibleDrivingDistance } from "./kuryelerSecurity";
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

export function validateWeightKg(weightKg: number): string | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return "Paket ağırlığını kg olarak yazın.";
  }
  if (weightKg > MAX_WEIGHT_KG) return WEIGHT_LIMIT_MESSAGE;
  return null;
}

export function validateDeliveryOrder(input: {
  product: string;
  pickupAddress: string;
  dropoffAddress: string;
  recipientName: string;
  recipientPhone?: string;
  scheduledAt: string;
  contactPhone: string;
  paymentMethod: string;
  weightKg: number;
  distanceKm: number;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  asap?: boolean;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.product.trim() || input.product.trim().length < 2) {
    errors.product = "Ürün veya gönderi adını yazın.";
  }
  if (!input.pickupAddress.trim() || input.pickupAddress.trim().length < 4) {
    errors.pickupAddress = "Alım yerini haritadan veya aramadan seçin.";
  }
  if (!input.dropoffAddress.trim() || input.dropoffAddress.trim().length < 4) {
    errors.dropoffAddress = "Gidecek yeri haritadan veya aramadan seçin.";
  }
  const sameAddress =
    input.pickupAddress.trim().toLocaleLowerCase("tr-TR") ===
    input.dropoffAddress.trim().toLocaleLowerCase("tr-TR");
  const samePoint =
    input.pickupLat != null &&
    input.dropoffLat != null &&
    input.pickupLng != null &&
    input.dropoffLng != null &&
    input.pickupLat === input.dropoffLat &&
    input.pickupLng === input.dropoffLng;
  if (sameAddress || samePoint) {
    errors.dropoffAddress = "Alım yeri ve gidecek yer aynı olamaz.";
  }
  if (!input.recipientName.trim() || input.recipientName.trim().length < 2) {
    errors.recipientName = "Teslim alan kişinin adını yazın.";
  }
  if (!input.recipientPhone?.trim()) errors.recipientPhone = "Alıcı telefonu zorunludur.";
  else if (!isValidTurkishMobilePhone(input.recipientPhone)) {
    errors.recipientPhone = "Geçerli bir Türkiye cep numarası girin (05xx xxx xx xx).";
  }
  if (!input.asap && !input.scheduledAt) errors.scheduledAt = "İstenen alım zamanını seçin.";
  if (!input.contactPhone.trim()) errors.contactPhone = "Gönderen telefonu zorunludur.";
  else if (!isValidTurkishMobilePhone(input.contactPhone)) {
    errors.contactPhone = "Geçerli bir Türkiye cep numarası girin (05xx xxx xx xx).";
  }
  if (!PAYMENT_METHODS.includes(input.paymentMethod as PaymentMethod)) {
    errors.paymentMethod = "Ödeme yöntemini seçin.";
  }
  const weightError = validateWeightKg(input.weightKg);
  if (weightError) errors.weightKg = weightError;
  if (!(input.distanceKm > 0) || !input.pickupLat || !input.dropoffLat) {
    errors.route = "Haritada alım ve teslim noktalarını seçip sürüş rotasını hesaplatın.";
  } else if (
    input.pickupLat != null &&
    input.pickupLng != null &&
    input.dropoffLat != null &&
    input.dropoffLng != null &&
    !isPlausibleDrivingDistance(input.distanceKm, {
      lat: input.pickupLat,
      lng: input.pickupLng,
    }, {
      lat: input.dropoffLat,
      lng: input.dropoffLng,
    })
  ) {
    errors.route = "Sürüş mesafesi seçilen noktalarla uyuşmuyor. Rotayı yeniden hesaplayın.";
  }
  return errors;
}

export function validateDistrictPrice(fiyatTl: number): string | null {
  if (!Number.isFinite(fiyatTl) || fiyatTl < 0) return "Fiyat 0 veya daha büyük olmalıdır.";
  if (fiyatTl > 20000) return "Fiyat 20.000 TL’yi aşamaz.";
  return null;
}

export function validateCommissionRate(rate: number): string | null {
  if (!(rate >= 0 && rate <= 1)) {
    return "Komisyon 0 ile 1 arasında olmalıdır (ör. %20 için 0,20).";
  }
  return null;
}

export function validatePricingForm(input: {
  baseTry: number;
  perKmTry: number;
  roundingDecimals: number;
  vatRate: number;
  routingProvider: string;
  commissionRate: number;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!(input.baseTry >= 0)) errors.baseTry = "Açılış ücreti 0 veya daha büyük olmalıdır.";
  if (!(input.perKmTry >= 0)) errors.perKmTry = "Km bedeli 0 veya daha büyük olmalıdır.";
  if (!(input.roundingDecimals >= 0 && input.roundingDecimals <= 6)) {
    errors.roundingDecimals = "Yuvarlama 0–6 basamak olmalıdır.";
  }
  if (!(input.vatRate >= 0 && input.vatRate <= 1)) {
    errors.vatRate = "KDV oranı 0 ile 1 arasında olmalıdır (ör. %20 için 0,20).";
  }
  if (!["osrm", "ors", "custom"].includes(input.routingProvider as RoutingProvider)) {
    errors.routingProvider = "Rota sağlayıcısını seçin.";
  }
  const commission = validateCommissionRate(input.commissionRate);
  if (commission) errors.commissionRate = commission;
  return errors;
}

export function validateTrackingCode(code: string) {
  if (!code.trim()) return "Takip kodunu yazın.";
  if (code.trim().length < 4) return "Takip kodu çok kısa görünüyor.";
  return null;
}
