/** kuryeler.tr — roller, durumlar, sürüş mesafesi fiyatı ve sipariş modeli. */

export { DISTRICT_NAMES, DISTRICT_PRICES, findDistrictPrice, type DistrictPrice } from "./fiyatListesi";

export const BRAND_NAME = "kuryeler.tr";
export const BRAND_PRODUCT = "Hızlıgel";
export const BRAND_CITY = "İstanbul";
export const CURRENCY_SUFFIX = "TL";
export const VAT_STATUS_NOTE = "KDV ?";
export const BRAND_URL = "https://kuryeler.tr";
export const CONTACT_EMAIL = "iletisim@kuryeler.tr";
export const CONTACT_PHONE_DISPLAY = "0532 474 67 45";
export const CONTACT_WHATSAPP_E164 = "905324746745";

/** Köşeli parantezli alanlar işletme kimliği doldurulunca değişir. */
export const BUSINESS = {
  legalName: "[AD SOYAD]",
  taxOffice: "[VERGİ DAİRESİ]",
  taxId: "[VKN]",
  address: "[AÇIK ADRES], İstanbul",
  kep: "[KEP ADRESİ]",
  chamber: "[ODA ADI – varsa]",
  trademarkNote: "Marka: kuryeler.tr (başvuru no 2026/088618 – tescil süreci devam ediyor)",
  kvkkEffective: "[TARİH]",
  retentionOrdersYears: "[X]",
  retentionPhotoMonths: "[X]",
} as const;

export const MAX_WEIGHT_KG = 30;
export const WEIGHT_LIMIT_MESSAGE = "Maksimum taşıma sınırı 30 kg";

export const USER_ROLES = ["customer", "courier", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ORDER_STATUSES = [
  "pending",
  "assigned",
  "picked_up",
  "en_route",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PUBLIC_STATUSES = ["pending", "picked_up", "en_route", "delivered", "cancelled"] as const;

export const PAYMENT_METHODS = ["nakit", "havale", "kart_kapida"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

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
  assigned: "Bekliyor",
  picked_up: "Alındı",
  en_route: "Yolda",
  delivered: "Teslim edildi",
  cancelled: "İptal",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  nakit: "Nakit",
  havale: "Havale / EFT",
  kart_kapida: "Kapıda kart",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  bekliyor: "Ödeme bekliyor",
  odendi: "Ödendi",
};

export const ROUTING_PROVIDER_LABELS: Record<RoutingProvider, string> = {
  osrm: "OSRM (router.project-osrm.org)",
  ors: "OpenRouteService",
  custom: "Özel OSRM uyumlu sunucu",
};

export type PricingSettings = {
  baseTry: number;
  perKmTry: number;
  roundingDecimals: number;
  routingProvider: RoutingProvider;
  routingUrl: string;
  geocoder: Geocoder;
  commissionRate: number;
  showcaseMode: boolean;
};

export const DEFAULT_PRICING: PricingSettings = {
  baseTry: 600,
  perKmTry: 50,
  roundingDecimals: 2,
  routingProvider: "osrm",
  routingUrl: "https://router.project-osrm.org",
  geocoder: "nominatim",
  commissionRate: 0.2,
  showcaseMode: false,
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
  pending: ["assigned", "cancelled"],
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

export function displayStatus(status: OrderStatus): Exclude<OrderStatus, "assigned"> {
  if (status === "assigned") return "pending";
  return status;
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
  totalTl: number;
  commissionTl: number;
  courierEarningTl: number;
  companyRevenueTl: number;
};

/** Sürüş km’si — kuş uçuşu değil. ücret = açılış_tl + km_tl × km */
export function calculateDeliveryPrice(input: {
  distanceKm: number;
  pricing?: PricingSettings;
}): PriceBreakdown {
  const pricing = input.pricing ?? DEFAULT_PRICING;
  const distanceKm = Math.max(0, Number(input.distanceKm) || 0);
  const distanceFeeTry = pricing.perKmTry * distanceKm;
  const totalTl = roundMoney(pricing.baseTry + distanceFeeTry, pricing.roundingDecimals);
  const commissionTl = roundMoney(totalTl * pricing.commissionRate, pricing.roundingDecimals);
  return {
    distanceKm: roundMoney(distanceKm, Math.max(2, pricing.roundingDecimals)),
    baseTry: pricing.baseTry,
    distanceFeeTry: roundMoney(distanceFeeTry, pricing.roundingDecimals),
    totalTl,
    commissionTl,
    courierEarningTl: roundMoney(totalTl - commissionTl, pricing.roundingDecimals),
    companyRevenueTl: commissionTl,
  };
}

export function formatTl(value: number | string) {
  return `${Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${CURRENCY_SUFFIX}`;
}

export function formatTlWithVat(value: number | string) {
  return `${formatTl(value)} (${VAT_STATUS_NOTE})`;
}

export function formatTariff(pricing: PricingSettings = DEFAULT_PRICING) {
  return `Açılış ${formatTl(pricing.baseTry)} + km başı ${formatTl(pricing.perKmTry)} (${VAT_STATUS_NOTE})`;
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
  return status === "pending" || status === "assigned" || status === "picked_up" || status === "en_route";
}

export function statusTone(status: OrderStatus) {
  switch (displayStatus(status)) {
    case "pending":
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
