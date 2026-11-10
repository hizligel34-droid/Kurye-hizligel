/** iyzico Checkout Form — tutarlar kuruş, para birimi yalnız TRY. Kart verisi yok. */

export const IYZICO_CURRENCY = "TRY" as const;
export const IYZICO_SANDBOX_URL = "https://sandbox-api.iyzipay.com";
export const IYZICO_LIVE_URL = "https://api.iyzipay.com";
/** Hızlıgel'in kendi işi. Pazar Yeri alt üye yok. */
export const IYZICO_PAYMENT_GROUP_OWN = "LISTING" as const;

export const PAYMENT_RECORD_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentRecordStatus = (typeof PAYMENT_RECORD_STATUSES)[number];

const CARD_KEYS = /^(cardnumber|cardholdername|expiremonth|expireyear|cvc|cvv|pan|cardalias)$/i;

export function assertTry(currency: string) {
  if (currency !== IYZICO_CURRENCY) {
    throw new Error("Yalnız TRY kabul edilir");
  }
}

export function tlToKurus(tl: number): number {
  return Math.round(Number(tl) * 100);
}

export function kurusToIyzicoPrice(kurus: number): string {
  return (Math.round(Number(kurus)) / 100).toFixed(2);
}

export type ServerPriceKurus = {
  currency: typeof IYZICO_CURRENCY;
  distanceKm: number;
  netKurus: number;
  vatKurus: number;
  grossKurus: number;
};

/** Sunucu tarife: 60000 + 5000 × km kuruş, üzerine %20 KDV. İstemci tutarına güvenilmez. */
export function serverPriceKurus(
  distanceKm: number,
  pricing: { baseTry?: number; perKmTry?: number; vatRate?: number } = {},
): ServerPriceKurus {
  const km = Math.max(0, Number(distanceKm) || 0);
  const baseKurus = Math.round((pricing.baseTry ?? 600) * 100);
  const perKmKurus = Math.round((pricing.perKmTry ?? 50) * 100);
  const netKurus = Math.round(baseKurus + perKmKurus * km);
  const vatRate = Number.isFinite(pricing.vatRate) ? Math.max(0, Number(pricing.vatRate)) : 0.2;
  const vatKurus = Math.round(netKurus * vatRate);
  return {
    currency: IYZICO_CURRENCY,
    distanceKm: km,
    netKurus,
    vatKurus,
    grossKurus: netKurus + vatKurus,
  };
}

export function iyzicoBaseUrl(raw?: string | null) {
  const value = String(raw ?? "").trim();
  return value || IYZICO_SANDBOX_URL;
}

export function assertNoCardFields(payload: unknown, path = "body") {
  if (Array.isArray(payload)) {
    payload.forEach((item, index) => assertNoCardFields(item, `${path}[${index}]`));
    return;
  }
  if (!payload || typeof payload !== "object") return;
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (CARD_KEYS.test(key.replace(/[^a-z0-9]/gi, ""))) {
      throw new Error("Kart verisi kabul edilmez; yalnız iyzico Checkout Form kullanılır");
    }
    assertNoCardFields(value, `${path}.${key}`);
  }
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const buf = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(buf), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function iyzicoV2SigningPayload(randomKey: string, uriPath: string, body: string) {
  return `${randomKey}${uriPath}${body}`;
}

export async function iyzicoAuthorizationHeader(opts: {
  apiKey: string;
  secretKey: string;
  randomKey: string;
  uriPath: string;
  body: string;
}): Promise<string> {
  const payload = iyzicoV2SigningPayload(opts.randomKey, opts.uriPath, opts.body);
  const signature = await hmacSha256Hex(opts.secretKey, payload);
  const raw = `apiKey:${opts.apiKey}&randomKey:${opts.randomKey}&signature:${signature}`;
  return `IYZWSv2 ${btoa(raw)}`;
}

function normalizeHex(value: string) {
  return value.trim().toLowerCase().replace(/^sha256=/i, "");
}

export function timingSafeEqualHex(left: string, right: string) {
  const a = normalizeHex(left);
  const b = normalizeHex(right);
  if (!a || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function iyzicoWebhookCandidates(opts: {
  secretKey: string;
  merchantId?: string;
  eventType: string;
  paymentId?: string;
  token?: string;
}): Promise<string[]> {
  const merchantId = opts.merchantId ?? "";
  const eventType = opts.eventType ?? "";
  const paymentId = opts.paymentId ?? "";
  const token = opts.token ?? "";
  return Promise.all([
    hmacSha256Hex(opts.secretKey, merchantId + eventType + token),
    hmacSha256Hex(opts.secretKey, merchantId + eventType + paymentId + token),
    hmacSha256Hex(opts.secretKey, opts.secretKey + eventType + paymentId + token),
  ]);
}

export async function verifyIyzicoWebhookSignature(opts: {
  secretKey: string;
  provided: string;
  merchantId?: string;
  eventType: string;
  paymentId?: string;
  token?: string;
}): Promise<boolean> {
  if (!opts.provided?.trim()) return false;
  const candidates = await iyzicoWebhookCandidates(opts);
  return candidates.some(candidate => timingSafeEqualHex(candidate, opts.provided));
}

export function iyzicoCommissionKurus(input: {
  iyziCommissionRateAmount?: number | string | null;
  iyziCommissionFee?: number | string | null;
}) {
  const rate = tlToKurus(Number(input.iyziCommissionRateAmount ?? 0) || 0);
  const fee = tlToKurus(Number(input.iyziCommissionFee ?? 0) || 0);
  return { rateKurus: rate, feeKurus: fee, totalKurus: rate + fee };
}

export type RefundDecision =
  | { action: "cancel_or_refund"; adminRequired: false; accountingCorrectionRequired: false; within8Days: null }
  | { action: "admin_invoice_cancel"; adminRequired: true; accountingCorrectionRequired: false; within8Days: true }
  | {
      action: "admin_accounting_correction";
      adminRequired: true;
      accountingCorrectionRequired: true;
      within8Days: false;
    };

const DAY_MS = 24 * 60 * 60 * 1000;

export function decideRefund(input: {
  hasInvoice: boolean;
  invoiceIssuedAt?: Date | string | null;
  now?: Date;
}): RefundDecision {
  if (!input.hasInvoice) {
    return {
      action: "cancel_or_refund",
      adminRequired: false,
      accountingCorrectionRequired: false,
      within8Days: null,
    };
  }
  const issuedAt = input.invoiceIssuedAt ? new Date(input.invoiceIssuedAt) : null;
  const now = input.now ?? new Date();
  const within8Days = !issuedAt || Number.isNaN(issuedAt.getTime()) || now.getTime() - issuedAt.getTime() <= 8 * DAY_MS;
  if (within8Days) {
    return {
      action: "admin_invoice_cancel",
      adminRequired: true,
      accountingCorrectionRequired: false,
      within8Days: true,
    };
  }
  return {
    action: "admin_accounting_correction",
    adminRequired: true,
    accountingCorrectionRequired: true,
    within8Days: false,
  };
}

export type PaymentRlsRole = "anon" | "authenticated_customer" | "authenticated_courier" | "admin" | "service_role";

export function canReadPayment(role: PaymentRlsRole, userId: string | null, customerId: string) {
  if (role === "service_role" || role === "admin") return true;
  if (role === "authenticated_customer") return Boolean(userId) && userId === customerId;
  return false;
}

export function canWritePayment(role: PaymentRlsRole) {
  return role === "service_role";
}

/**
 * TODO(pazar-yeri): Alt üye işyeri (subMerchant) bu repoda yok.
 * Pazar Yeri açılırsa: subMerchantKey, subMerchantPrice, withholdingTax, PRIVATE_COMPANY /
 * LIMITED_OR_JOINT_STOCK_COMPANY (PERSONAL kapalı). Komisyon ve stopaj orada hesaplanır.
 */
export const MARKETPLACE_TODO =
  "Pazar Yeri alt üye, komisyon ve stopaj bu repoda yok; yalnız Hızlıgel kendi işi (LISTING).";
