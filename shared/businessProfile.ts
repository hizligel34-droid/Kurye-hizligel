/** Künye / fatura üst bilgisi. T.C. kimlik numarası alanı yoktur ve eklenmez. */

import { CONTACT_PHONE_DISPLAY } from "./contactConfig";

export const KUNYE_UNKNOWN = "?";
export const BUSINESS_EMAIL = "serif.tekin@hotmail.com";
export const BUSINESS_TAX_OFFICE = "Maslak Vergi Dairesi";

export const TRADER_KINDS = ["esnaf", "tacir"] as const;
export type TraderKind = (typeof TRADER_KINDS)[number];

export type BusinessProfile = {
  legalName: string;
  ownerName: string;
  traderKind: TraderKind;
  taxOffice: string;
  taxId: string;
  mersis: string;
  tradeRegistryNo: string;
  address: string;
  phone: string;
  email: string;
  kep: string;
  chamber: string;
  trademarkNote: string;
  kvkkEffective: string;
  retentionOrdersYears: string;
  retentionPhotoMonths: string;
};

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  legalName: "Canan Tekin Organizasyon ve Kurye Hizmetleri",
  ownerName: "Canan Tekin",
  traderKind: "esnaf",
  taxOffice: BUSINESS_TAX_OFFICE,
  taxId: KUNYE_UNKNOWN,
  mersis: KUNYE_UNKNOWN,
  tradeRegistryNo: KUNYE_UNKNOWN,
  address: "Büyük Beşiktaş Çarşısı, Ortabahçe Caddesi No: 10, Kat 1, No: 143, Beşiktaş/İstanbul",
  phone: CONTACT_PHONE_DISPLAY,
  email: BUSINESS_EMAIL,
  kep: KUNYE_UNKNOWN,
  chamber: KUNYE_UNKNOWN,
  trademarkNote: "Marka: kuryeler.tr (başvuru no 2026/088618 – tescil süreci devam ediyor)",
  kvkkEffective: "[TARİH]",
  retentionOrdersYears: "[X]",
  retentionPhotoMonths: "[X]",
};

export type KunyeLine = { label: string; value: string };

/** Esnafta MERSİS satırı yok; VKN ve vergi dairesi gösterilir. Tacirse MERSİS gösterilir. */
export function kunyeDisplayLines(profile: BusinessProfile = DEFAULT_BUSINESS_PROFILE): KunyeLine[] {
  const lines: KunyeLine[] = [
    { label: "Unvan", value: profile.legalName },
    { label: "İşletme sahibi", value: profile.ownerName },
  ];
  if (profile.traderKind === "tacir") {
    const mersis = profile.mersis.trim();
    if (mersis && mersis !== KUNYE_UNKNOWN) {
      lines.push({ label: "MERSİS", value: mersis });
    }
  }
  lines.push(
    { label: "Vergi dairesi", value: profile.taxOffice || KUNYE_UNKNOWN },
    { label: "Vergi kimlik no", value: profile.taxId || KUNYE_UNKNOWN },
    { label: "Merkez adresi", value: profile.address },
    { label: "Telefon", value: profile.phone },
    { label: "E-posta", value: profile.email || KUNYE_UNKNOWN },
    { label: "KEP adresi", value: profile.kep || KUNYE_UNKNOWN },
  );
  if (profile.chamber && profile.chamber !== KUNYE_UNKNOWN) {
    lines.push({ label: "Meslek odası", value: profile.chamber });
  } else {
    lines.push({ label: "Meslek odası", value: KUNYE_UNKNOWN });
  }
  return lines;
}

export function kunyeShowsMersis(profile: BusinessProfile = DEFAULT_BUSINESS_PROFILE) {
  return kunyeDisplayLines(profile).some(line => line.label === "MERSİS");
}

/** VKN loglarda ve hata metinlerinde maskelenir; TCKN alanı yoktur. */
export function maskTaxId(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw || raw === KUNYE_UNKNOWN) return KUNYE_UNKNOWN;
  if (raw.length <= 4) return "****";
  return `${raw.slice(0, 2)}****${raw.slice(-2)}`;
}

export function sanitizeBusinessForLog(profile: BusinessProfile): BusinessProfile {
  return { ...profile, taxId: maskTaxId(profile.taxId) };
}

const SECRET_KEY = /^(taxid|tax_id|vkn|cardnumber|card_number|cvv|cvc|pan|expiremonth|expireyear|identitynumber)$/i;

export function stripSecretsForLog(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSecretsForLog);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY.test(key.replace(/[^a-z0-9]/gi, ""))) {
        out[key] = "[redacted]";
        continue;
      }
      out[key] = stripSecretsForLog(entry);
    }
    return out;
  }
  return value;
}

export function mapBusinessProfileRow(row: Record<string, unknown> | null | undefined): BusinessProfile {
  const src = row ?? {};
  return {
    legalName: String(src.legal_name ?? src.legalName ?? DEFAULT_BUSINESS_PROFILE.legalName),
    ownerName: String(src.owner_name ?? src.ownerName ?? DEFAULT_BUSINESS_PROFILE.ownerName),
    traderKind: src.trader_kind === "tacir" || src.traderKind === "tacir" ? "tacir" : "esnaf",
    taxOffice: String(src.tax_office ?? src.taxOffice ?? BUSINESS_TAX_OFFICE),
    taxId: String(src.tax_id ?? src.taxId ?? KUNYE_UNKNOWN),
    mersis: String(src.mersis ?? KUNYE_UNKNOWN),
    tradeRegistryNo: String(src.trade_registry_no ?? src.tradeRegistryNo ?? KUNYE_UNKNOWN),
    address: String(src.address ?? DEFAULT_BUSINESS_PROFILE.address),
    phone: String(src.phone ?? DEFAULT_BUSINESS_PROFILE.phone),
    email: String(src.email ?? BUSINESS_EMAIL),
    kep: String(src.kep ?? KUNYE_UNKNOWN),
    chamber: String(src.chamber ?? KUNYE_UNKNOWN),
    trademarkNote: String(src.trademark_note ?? src.trademarkNote ?? DEFAULT_BUSINESS_PROFILE.trademarkNote),
    kvkkEffective: String(src.kvkk_effective ?? src.kvkkEffective ?? DEFAULT_BUSINESS_PROFILE.kvkkEffective),
    retentionOrdersYears: String(
      src.retention_orders_years ?? src.retentionOrdersYears ?? DEFAULT_BUSINESS_PROFILE.retentionOrdersYears,
    ),
    retentionPhotoMonths: String(
      src.retention_photo_months ?? src.retentionPhotoMonths ?? DEFAULT_BUSINESS_PROFILE.retentionPhotoMonths,
    ),
  };
}
