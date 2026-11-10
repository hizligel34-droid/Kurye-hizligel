/** Avukat taslağı yer tutucuları. TCKN alanı/metni yoktur. */

export const LEGAL_DRAFT_BANNER = "TASLAK – yayına alınmadı";
export const LEGAL_VERSION = "?";

export const LEGAL_FILLED = {
  email: "serif.tekin@hotmail.com",
  odemeKurulusu: "iyzico",
} as const;

export const LEGAL_UNKNOWN = {
  vergiNo: "?",
  kep: "?",
  p1YetkiBelgesiNo: "?",
  surum: "?",
  tarih: "?",
  barindirmaSaglayicisi: "?",
} as const;

export function applyLegalPlaceholders(text: string): string {
  return text
    .replace(/TCKN\/VKN/g, "VKN")
    .replace(/T\.C\. kimlik numarası/gi, "kimlik bilgisi")
    .replace(/\[E-POSTA\]/g, LEGAL_FILLED.email)
    .replace(/\[ÖDEME KURULUŞU: iyzico\/PayTR\]/g, LEGAL_FILLED.odemeKurulusu)
    .replace(/\[ÖDEME KURULUŞU\]/g, LEGAL_FILLED.odemeKurulusu)
    .replace(/\[VERGİ NO\]/g, LEGAL_UNKNOWN.vergiNo)
    .replace(/\[KEP\]/g, LEGAL_UNKNOWN.kep)
    .replace(/\[P1 YETKİ BELGESİ NO\]/g, LEGAL_UNKNOWN.p1YetkiBelgesiNo)
    .replace(/\[SÜRÜM NO\]/g, LEGAL_UNKNOWN.surum)
    .replace(/\[TARİH\]/g, LEGAL_UNKNOWN.tarih)
    .replace(/\[BARINDIRMA SAĞLAYICISI\]/g, LEGAL_UNKNOWN.barindirmaSaglayicisi);
}

export function assertNoTckn(text: string) {
  if (/TCKN|T\.C\. kimlik/i.test(text)) {
    throw new Error("TCKN metni yasal taslakta yer alamaz");
  }
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), byte => byte.toString(16).padStart(2, "0")).join("");
}

export const LEGAL_DOC_KEYS = [
  "kunye",
  "kvkk",
  "cerez",
  "on_bilgi",
  "mesafeli",
  "kosullar",
  "kurye_soz",
  "gonderici_soz",
  "aracilik",
  "odeme",
  "islem_rehberi",
] as const;
export type LegalDocKey = (typeof LEGAL_DOC_KEYS)[number];
