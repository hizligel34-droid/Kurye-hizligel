/** kuryeler.tr — roller, durumlar, sürüş mesafesi fiyatı ve sipariş modeli. */

import { DEFAULT_BUSINESS_PROFILE } from "./businessProfile";

export { DISTRICT_NAMES, DISTRICT_PRICES, findDistrictPrice, type DistrictPrice } from "./fiyatListesi";

export const BRAND_NAME = "kuryeler.tr";
export const BRAND_PRODUCT = "Hızlıgel";
export const BRAND_CITY = "İstanbul";
export const CURRENCY_SUFFIX = "TL";
export const VAT_EXCL_LABEL = "KDV hariç";
export const VAT_INCL_LABEL = "KDV dahil";
export const DEFAULT_VAT_RATE = 0.2;
export const BRAND_URL = "https://kuryeler.tr";
export const CONTACT_EMAIL = "serif.tekin@hotmail.com";
export const CONTACT_PHONE_DISPLAY = "0532 474 67 45";
export const CONTACT_PHONE_TEL = "tel:+905324746745";
export const CONTACT_WHATSAPP_E164 = "905324746745";

export {
  DEFAULT_BUSINESS_PROFILE,
  kunyeDisplayLines,
  type BusinessProfile,
} from "./businessProfile";

/** Künye varsayılanı (esnaf). MERSİS yok; TCKN alanı yok. */
export const BUSINESS = DEFAULT_BUSINESS_PROFILE;

export const MAX_WEIGHT_KG = 30;
export const WEIGHT_LIMIT_MESSAGE = "Maksimum taşıma sınırı 30 kg";

export const USER_ROLES = ["customer", "courier", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "assigned",
  "picked_up",
  "en_route",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PUBLIC_STATUSES = ["pending", "picked_up", "en_route", "delivered", "cancelled"] as const;
export const TRACK_STEPS = ["pending", "assigned", "picked_up", "en_route", "delivered"] as const;
export type TrackStep = (typeof TRACK_STEPS)[number];

export const PAYMENT_METHODS = ["iyzico", "nakit", "kart_kapida", "havale"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const CUSTOMER_PAYMENT_METHODS = ["iyzico", "nakit", "kart_kapida"] as const;

export const PAYMENT_STATUSES = ["bekliyor", "odendi"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ROUTING_PROVIDERS = ["osrm", "ors", "custom"] as const;
export type RoutingProvider = (typeof ROUTING_PROVIDERS)[number];

export const GEOCODERS = ["nominatim", "photon"] as const;
export type Geocoder = (typeof GEOCODERS)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Müşteri",
  courier: "Kurye",
  admin: "Yönetici",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Bekliyor",
  confirmed: "Ödendi",
  assigned: "Kurye atandı, alıma gidiyor",
  picked_up: "Alındı",
  en_route: "Yolda",
  delivered: "Teslim edildi",
  cancelled: "İptal",
};

/** Canlıda kurye kendi kaydı kapalı; yalnız yönetici kurye atar. Şerif açarsa true yapılır. */
export const ALLOW_COURIER_SELF_SIGNUP = false;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  iyzico: "Kart (iyzico)",
  nakit: "Nakit",
  havale: "Havale / EFT",
  kart_kapida: "Kapıda kart (POS henüz yok)",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  bekliyor: "Ödeme bekliyor",
  odendi: "Ödendi",
};

export const HAVALE_HINT = "Havale bilgisi onayda iletilir.";

export const BANNED_GOODS_HINT =
  "Tehlikeli madde, canlı hayvan ve yasadışı ürün kabul edilmez.";

export const ETA_DISCLAIMER = "tahmini, trafiğe göre değişebilir";

export function paymentStatusLabel(method: PaymentMethod, status: PaymentStatus): string {
  if (status === "odendi") return PAYMENT_STATUS_LABELS.odendi;
  if (method === "iyzico") return "Kart ödemesi bekleniyor";
  if (method === "nakit") return "Kapıda ödenecek";
  if (method === "havale") return "Havale bekleniyor";
  return "Kapıda tahsil edilecek";
}

export function formatEtaMinutes(durationMin: number | null | undefined): string | null {
  if (!durationMin || !(durationMin > 0) || !Number.isFinite(durationMin)) return null;
  return `Yaklaşık ${Math.round(durationMin)} dk (${ETA_DISCLAIMER})`;
}

export function trackStepReached(current: OrderStatus, step: TrackStep): boolean {
  if (current === "cancelled") return false;
  const normalized = current === "confirmed" ? "pending" : current;
  const currentIndex = TRACK_STEPS.indexOf(normalized as TrackStep);
  const stepIndex = TRACK_STEPS.indexOf(step);
  if (currentIndex < 0 || stepIndex < 0) return false;
  return currentIndex >= stepIndex;
}

export function publicTrackingPath(code: string) {
  return `/takip/${encodeURIComponent(code.trim().toUpperCase())}`;
}

export const ROUTING_PROVIDER_LABELS: Record<RoutingProvider, string> = {
  osrm: "OSRM (router.project-osrm.org)",
  ors: "OpenRouteService",
  custom: "Özel OSRM uyumlu sunucu",
};

export type DeliveryTargetTier = {
  maxKm: number | null;
  label: string;
};

export const DELIVERY_TARGET_DISCLAIMER =
  "Hedef süredir; trafik ve hava koşullarına göre değişebilir.";

export const DEFAULT_DELIVERY_TARGET_TIERS: DeliveryTargetTier[] = [
  { maxKm: 5, label: "60 dakika" },
  { maxKm: 20, label: "2 saat" },
  { maxKm: 40, label: "3 saat" },
  { maxKm: 100, label: "4 saat" },
  { maxKm: null, label: "aynı gün" },
];

export function normalizeDeliveryTargetTiers(raw?: DeliveryTargetTier[] | null): DeliveryTargetTier[] {
  const rows = (raw ?? [])
    .filter(row => row && typeof row.label === "string" && row.label.trim())
    .map(row => ({
      maxKm: row.maxKm == null || !Number.isFinite(Number(row.maxKm)) ? null : Number(row.maxKm),
      label: row.label.trim(),
    }));
  if (rows.length === 0) return DEFAULT_DELIVERY_TARGET_TIERS.map(tier => ({ ...tier }));
  return rows;
}

export function deliveryTargetForDistance(
  distanceKm: number,
  tiers: DeliveryTargetTier[] = DEFAULT_DELIVERY_TARGET_TIERS,
): DeliveryTargetTier {
  const km = Math.max(0, Number(distanceKm) || 0);
  const list = normalizeDeliveryTargetTiers(tiers);
  const bounded = list
    .filter(tier => tier.maxKm != null)
    .sort((a, b) => (a.maxKm as number) - (b.maxKm as number));
  const open = list.find(tier => tier.maxKm == null) ?? { maxKm: null, label: "aynı gün" };
  for (const tier of bounded) {
    if (km <= (tier.maxKm as number)) return tier;
  }
  return open;
}

export function formatDeliveryTarget(
  distanceKm: number,
  tiers: DeliveryTargetTier[] = DEFAULT_DELIVERY_TARGET_TIERS,
) {
  return `Hedef teslim: ${deliveryTargetForDistance(distanceKm, tiers).label}`;
}

export function deliveryTargetRangeLabel(tier: DeliveryTargetTier, previousMaxKm: number | null) {
  if (tier.maxKm == null) {
    return previousMaxKm == null ? "üst kademe" : `${previousMaxKm} km üstü`;
  }
  return `${tier.maxKm} km ve altı`;
}

export function deliveryTargetTable(tiers: DeliveryTargetTier[] = DEFAULT_DELIVERY_TARGET_TIERS) {
  const list = normalizeDeliveryTargetTiers(tiers);
  const bounded = list
    .filter(tier => tier.maxKm != null)
    .sort((a, b) => (a.maxKm as number) - (b.maxKm as number));
  const open = list.find(tier => tier.maxKm == null) ?? { maxKm: null, label: "aynı gün" };
  const rows: Array<{ range: string; label: string }> = [];
  let previous: number | null = null;
  for (const tier of bounded) {
    rows.push({ range: deliveryTargetRangeLabel(tier, previous), label: tier.label });
    previous = tier.maxKm;
  }
  rows.push({ range: deliveryTargetRangeLabel(open, previous), label: open.label });
  return rows;
}

export type PricingSettings = {
  baseTry: number;
  perKmTry: number;
  roundingDecimals: number;
  vatRate: number;
  routingProvider: RoutingProvider;
  routingUrl: string;
  geocoder: Geocoder;
  commissionRate: number;
  showcaseMode: boolean;
  deliveryTargetTiers: DeliveryTargetTier[];
};

export const DEFAULT_PRICING: PricingSettings = {
  baseTry: 600,
  perKmTry: 50,
  roundingDecimals: 2,
  vatRate: DEFAULT_VAT_RATE,
  routingProvider: "osrm",
  routingUrl: "https://router.project-osrm.org",
  geocoder: "nominatim",
  commissionRate: 0.2,
  showcaseMode: false,
  deliveryTargetTiers: DEFAULT_DELIVERY_TARGET_TIERS.map(tier => ({ ...tier })),
};

function readViteFlag(name: string): string {
  try {
    const env = (import.meta as { env?: Record<string, string | undefined> }).env;
    return String(env?.[name] ?? "");
  } catch {
    return "";
  }
}

export function envShowcaseMode() {
  return readViteFlag("VITE_VITRIN_MODU") === "true";
}

export function isShowcaseMode(pricing?: PricingSettings | null) {
  return Boolean(pricing?.showcaseMode) || envShowcaseMode();
}

const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "assigned", "cancelled"],
  confirmed: ["assigned", "cancelled"],
  assigned: ["picked_up", "cancelled"],
  picked_up: ["en_route", "cancelled"],
  en_route: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function canTransitionStatus(from: OrderStatus, to: OrderStatus) {
  if (from === to) return true;
  return STATUS_FLOW[from].includes(to);
}

export function nextCourierStatus(current: OrderStatus): OrderStatus | null {
  if (current === "assigned") return "picked_up";
  if (current === "picked_up") return "en_route";
  if (current === "en_route") return "delivered";
  return null;
}

export function courierStatusActionLabel(current: OrderStatus) {
  if (current === "assigned") return "Paketi aldım";
  if (current === "picked_up") return "Yola çıktım";
  if (current === "en_route") return "Teslim ettim";
  return null;
}

export function displayStatus(status: OrderStatus): OrderStatus {
  return status === "confirmed" ? "pending" : status;
}

export function roundMoney(value: number, decimals: number) {
  const digits = Math.max(0, Math.min(6, Math.floor(Number.isFinite(decimals) ? decimals : 2)));
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

export type PriceBreakdown = {
  distanceKm: number;
  baseTry: number;
  distanceFeeTry: number;
  vatRate: number;
  netTl: number;
  vatTl: number;
  grossTl: number;
  totalTl: number;
  commissionTl: number;
  courierEarningTl: number;
  companyRevenueTl: number;
};

/** Sürüş km’si — kuş uçuşu değil. net = açılış_tl + km_tl × km (KDV hariç); üstüne KDV eklenir. */
export function calculateDeliveryPrice(input: {
  distanceKm: number;
  pricing?: PricingSettings;
}): PriceBreakdown {
  const pricing = input.pricing ?? DEFAULT_PRICING;
  const distanceKm = Math.max(0, Number(input.distanceKm) || 0);
  const vatRate = Number.isFinite(pricing.vatRate) ? Math.max(0, pricing.vatRate) : DEFAULT_VAT_RATE;
  const distanceFeeTry = pricing.perKmTry * distanceKm;
  const netTl = roundMoney(pricing.baseTry + distanceFeeTry, pricing.roundingDecimals);
  const vatTl = roundMoney(netTl * vatRate, pricing.roundingDecimals);
  const grossTl = roundMoney(netTl + vatTl, pricing.roundingDecimals);
  const commissionTl = roundMoney(netTl * pricing.commissionRate, pricing.roundingDecimals);
  return {
    distanceKm: roundMoney(distanceKm, Math.max(2, pricing.roundingDecimals)),
    baseTry: pricing.baseTry,
    distanceFeeTry: roundMoney(distanceFeeTry, pricing.roundingDecimals),
    vatRate,
    netTl,
    vatTl,
    grossTl,
    totalTl: grossTl,
    commissionTl,
    courierEarningTl: roundMoney(netTl - commissionTl, pricing.roundingDecimals),
    companyRevenueTl: commissionTl,
  };
}

export function formatTl(value: number | string) {
  return `${Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${CURRENCY_SUFFIX}`;
}

export function formatVatPercent(rate: number) {
  const pct = roundMoney((Number(rate) || 0) * 100, 2);
  return `%${pct.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}

export function formatTariff(pricing: PricingSettings = DEFAULT_PRICING) {
  return `Açılış ${formatTl(pricing.baseTry)} + km başı ${formatTl(pricing.perKmTry)} (${VAT_EXCL_LABEL})`;
}

export function formatTariffInclusive(pricing: PricingSettings = DEFAULT_PRICING) {
  const vatRate = Number.isFinite(pricing.vatRate) ? Math.max(0, pricing.vatRate) : DEFAULT_VAT_RATE;
  const baseGross = roundMoney(pricing.baseTry * (1 + vatRate), pricing.roundingDecimals);
  const kmGross = roundMoney(pricing.perKmTry * (1 + vatRate), pricing.roundingDecimals);
  return `Açılış ${formatTl(baseGross)} + km başı ${formatTl(kmGross)} (${VAT_INCL_LABEL})`;
}

export function formatPriceInclusive(price: Pick<PriceBreakdown, "grossTl">) {
  return `${formatTl(price.grossTl)} (${VAT_INCL_LABEL})`;
}

export function formatPriceHint(price: Pick<PriceBreakdown, "netTl" | "vatTl">) {
  return `${formatTl(price.netTl)} + ${formatTl(price.vatTl)} KDV`;
}

export function formatPriceBreakdown(price: Pick<PriceBreakdown, "netTl" | "vatTl" | "grossTl" | "vatRate">) {
  return [
    `${formatTl(price.netTl)} ${VAT_EXCL_LABEL}`,
    `KDV (${formatVatPercent(price.vatRate)}): ${formatTl(price.vatTl)}`,
    `${formatTl(price.grossTl)} ${VAT_INCL_LABEL}`,
  ].join(" · ");
}

export function breakdownFromOrder(
  order: Pick<DeliveryOrder, "distanceKm" | "netPriceTl" | "vatTl" | "totalPriceTl" | "courierEarningTl" | "companyRevenueTl">,
  pricing: PricingSettings = DEFAULT_PRICING,
): PriceBreakdown {
  const computed = calculateDeliveryPrice({ distanceKm: order.distanceKm, pricing });
  const netTl = order.netPriceTl > 0 ? order.netPriceTl : computed.netTl;
  const vatTl = order.vatTl > 0 || order.netPriceTl > 0 ? order.vatTl : computed.vatTl;
  const grossTl = order.totalPriceTl > 0 ? order.totalPriceTl : roundMoney(netTl + vatTl, pricing.roundingDecimals);
  return {
    ...computed,
    netTl,
    vatTl,
    grossTl,
    totalTl: grossTl,
    courierEarningTl: order.courierEarningTl || computed.courierEarningTl,
    companyRevenueTl: order.companyRevenueTl || computed.companyRevenueTl,
  };
}

export function formatKm(value: number) {
  return `${Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })} km`;
}

export function generateTrackingCode() {
  const bytes = new Uint8Array(16);
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    throw new Error("Güvenli rastgele üretici yok");
  }
  cryptoObj.getRandomValues(bytes);
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `KY-${hex}`;
}

export function redactPendingForCourier(order: DeliveryOrder): DeliveryOrder {
  const district = order.bolge?.trim() || "İlçe";
  return {
    ...order,
    boardOnly: true,
    product: "Gönderi",
    pickupAddress: district,
    dropoffAddress: district,
    recipientName: "",
    recipientPhone: "",
    contactPhone: "",
    notes: "",
    pickupLat: null,
    pickupLng: null,
    dropoffLat: null,
    dropoffLng: null,
    routeGeojson: null,
    pickupPhoto: null,
    deliveryPhoto: null,
    signatureData: null,
  };
}

export function isActiveOrder(status: OrderStatus) {
  return (
    status === "pending" ||
    status === "confirmed" ||
    status === "assigned" ||
    status === "picked_up" ||
    status === "en_route"
  );
}

export function statusTone(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "bg-[#2a2410] text-[#D4AF37]";
    case "confirmed":
      return "bg-[#14241a] text-[#d4af37]";
    case "assigned":
      return "bg-[#2a2410] text-[#D4AF37]";
    case "picked_up":
      return "bg-[#241a30] text-[#e6d9a8]";
    case "en_route":
      return "bg-[#2a1e0c] text-[#f0d78c]";
    case "delivered":
      return "bg-[#14241a] text-[#d4af37]";
    case "cancelled":
      return "bg-[#1c1c1c] text-[#8a7c52]";
  }
}

export function formatDateTimeTr(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type LatLng = { lat: number; lng: number };

export type DeliveryOrder = {
  id: string;
  trackingCode: string;
  customerId: string;
  courierId: string | null;
  status: OrderStatus;
  product: string;
  pickupAddress: string;
  dropoffAddress: string;
  bolge: string;
  recipientName: string;
  recipientPhone: string;
  scheduledAt: string | null;
  notes: string;
  contactPhone: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  pickupPhoto: string | null;
  deliveryPhoto: string | null;
  signatureData: string | null;
  weightKg: number;
  distanceKm: number;
  durationMin: number;
  netPriceTl: number;
  vatTl: number;
  totalPriceTl: number;
  courierEarningTl: number;
  companyRevenueTl: number;
  boardOnly?: boolean;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  routeGeojson: string | null;
  createdAt: string;
  updatedAt: string;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string;
  cancelledBy: string | null;
};

export type Profile = {
  id: string;
  role: UserRole;
  fullName: string;
  phone: string;
  email: string;
  isOnline: boolean;
  createdAt: string;
};

export type DashboardStats = {
  todayOrders: number;
  todayRevenueTl: number;
  activeCouriers: number;
  pendingOrders: number;
  enRouteOrders: number;
};
