import {
  calculateDeliveryPrice,
  formatConsumerGross,
  formatConsumerVatLine,
  type PriceBreakdown,
  type PricingSettings,
} from "./kuryeler";
import { isValidTurkishMobilePhone, normalizeTurkishMobilePhone } from "./orderValidation";

export { formatConsumerGross, formatConsumerVatLine };

export const GUEST_LEAD_RATE_LIMIT = 3;
export const GUEST_LEAD_WINDOW_MS = 10 * 60 * 1000;
export const GUEST_HONEYPOT_FIELD = "website";

export type GuestLeadInput = {
  fullName: string;
  phone: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceKm: number;
  product?: string;
  website?: string;
  preInfoOk: boolean;
  withdrawOk: boolean;
};

export type GuestLeadFieldErrors = Partial<Record<keyof GuestLeadInput | "form", string>>;

export function quoteGuestLead(distanceKm: number, pricing?: PricingSettings): PriceBreakdown {
  return calculateDeliveryPrice({ distanceKm, pricing });
}

export function isHoneypotFilled(website?: string) {
  return Boolean(website && website.trim());
}

export function validateGuestLead(input: GuestLeadInput): GuestLeadFieldErrors {
  const errors: GuestLeadFieldErrors = {};
  if (!input.fullName.trim() || input.fullName.trim().length < 2) {
    errors.fullName = "Ad soyad en az 2 karakter olmalıdır.";
  }
  if (!input.phone.trim()) errors.phone = "Cep telefonu zorunludur.";
  else if (!isValidTurkishMobilePhone(input.phone)) {
    errors.phone = "Geçerli bir Türkiye cep numarası girin (05xx xxx xx xx).";
  }
  if (!input.pickupAddress.trim() || input.pickupAddress.trim().length < 4) {
    errors.pickupAddress = "Alım adresini yazın.";
  }
  if (!input.dropoffAddress.trim() || input.dropoffAddress.trim().length < 4) {
    errors.dropoffAddress = "Teslim adresini yazın.";
  }
  const same =
    input.pickupAddress.trim().toLocaleLowerCase("tr-TR") ===
    input.dropoffAddress.trim().toLocaleLowerCase("tr-TR");
  if (same && input.pickupAddress.trim()) {
    errors.dropoffAddress = "Alım yeri ve teslim yeri aynı olamaz.";
  }
  if (!(input.distanceKm > 0)) {
    errors.distanceKm = "Sürüş kilometresini yazın.";
  }
  if (!input.preInfoOk) {
    errors.preInfoOk = "Ön bilgilendirme ve mesafeli sözleşme onayını işaretleyin.";
  }
  if (!input.withdrawOk) {
    errors.withdrawOk = "Cayma hakkı bilgisini onaylayın.";
  }
  return errors;
}

export function normalizeGuestLead(input: GuestLeadInput): GuestLeadInput {
  return {
    fullName: input.fullName.trim().slice(0, 80),
    phone: normalizeTurkishMobilePhone(input.phone) || input.phone.trim(),
    pickupAddress: input.pickupAddress.trim().slice(0, 240),
    dropoffAddress: input.dropoffAddress.trim().slice(0, 240),
    distanceKm: Math.max(0, Number(input.distanceKm) || 0),
    product: (input.product ?? "Kurye gönderisi").trim().slice(0, 120) || "Kurye gönderisi",
    website: "",
    preInfoOk: input.preInfoOk,
    withdrawOk: input.withdrawOk,
  };
}

export function buildGuestWhatsappText(input: GuestLeadInput, price: PriceBreakdown) {
  const lead = normalizeGuestLead(input);
  return [
    "Hızlıgel kurye talebi",
    `Ad: ${lead.fullName}`,
    `Telefon: ${lead.phone}`,
    `Alım: ${lead.pickupAddress}`,
    `Teslim: ${lead.dropoffAddress}`,
    `Gönderi: ${lead.product}`,
    `Sürüş: ${lead.distanceKm.toLocaleString("tr-TR")} km`,
    `Ücret: ${formatConsumerGross(price)}`,
    formatConsumerVatLine(price),
  ].join("\n");
}
