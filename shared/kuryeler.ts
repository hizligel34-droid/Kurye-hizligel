/** kuryeler.tr — roller, durumlar, sürüş mesafesi fiyatı ve sipariş modeli. */

export { DISTRICT_NAMES, DISTRICT_PRICES, findDistrictPrice, type DistrictPrice } from "./fiyatListesi";

export const BRAND_NAME = "kuryeler.tr";
export const BRAND_PRODUCT = "Hızlıgel";
export const BRAND_CITY = "İstanbul";
export const CURRENCY_SUFFIX = "TL";
export const USD_SUFFIX = "USD";
export const BRAND_URL = "https://kuryeler.tr";
export const CONTACT_EMAIL = "iletisim@kuryeler.tr";
export const CONTACT_PHONE_DISPLAY = "0532 474 67 45";
export const CONTACT_WHATSAPP_E164 = "905324746745";

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
  baseUsd: number;
  perKmUsd: number;
  roundingDecimals: number;
  usdToTry: number;
  routingProvider: RoutingProvider;
  routingUrl: string;
  geocoder: Geocoder;
  commissionRate: number;
};

export const DEFAULT_PRICING: PricingSettings = {
  baseUsd: 1,
  perKmUsd: 1,
  roundingDecimals: 2,
  usdToTry: 34.5,
  routingProvider: "osrm",
  routingUrl: "https://router.project-osrm.org",
  geocoder: "nominatim",
  commissionRate: 0.2,
};

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
  baseUsd: number;
  distanceFeeUsd: number;
  priceUsd: number;
  priceTl: number;
  commissionUsd: number;
  courierEarningUsd: number;
  totalTl: number;
  commissionTl: number;
  courierEarningTl: number;
  companyRevenueTl: number;
};

/** Sürüş km’si — kuş uçuşu değil. price = baseUsd + perKmUsd * km */
export function calculateDeliveryPrice(input: {
  distanceKm: number;
  pricing?: PricingSettings;
}): PriceBreakdown {
  const pricing = input.pricing ?? DEFAULT_PRICING;
  const distanceKm = Math.max(0, Number(input.distanceKm) || 0);
  const distanceFeeUsd = pricing.perKmUsd * distanceKm;
  const priceUsd = roundMoney(pricing.baseUsd + distanceFeeUsd, pricing.roundingDecimals);
  const priceTl =
    pricing.usdToTry > 0 ? roundMoney(priceUsd * pricing.usdToTry, pricing.roundingDecimals) : 0;
  const commissionUsd = roundMoney(priceUsd * pricing.commissionRate, pricing.roundingDecimals);
  const commissionTl = roundMoney(priceTl * pricing.commissionRate, pricing.roundingDecimals);
  return {
    distanceKm: roundMoney(distanceKm, Math.max(2, pricing.roundingDecimals)),
    baseUsd: pricing.baseUsd,
    distanceFeeUsd: roundMoney(distanceFeeUsd, pricing.roundingDecimals),
    priceUsd,
    priceTl,
    commissionUsd,
    courierEarningUsd: roundMoney(priceUsd - commissionUsd, pricing.roundingDecimals),
    totalTl: priceTl,
    commissionTl,
    courierEarningTl: roundMoney(priceTl - commissionTl, pricing.roundingDecimals),
    companyRevenueTl: commissionTl,
  };
}

export function formatUsd(value: number | string, decimals = 2) {
  return `${Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${USD_SUFFIX}`;
}

export function formatTl(value: number | string) {
  return `${Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${CURRENCY_SUFFIX}`;
}

export function formatKm(value: number) {
  return `${Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })} km`;
}

export function generateTrackingCode(_now = new Date()) {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes, byte => (byte % 36).toString(36).toUpperCase()).join("");
  return `KY-${rand}`;
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
  priceUsd: number;
  totalPriceTl: number;
  courierEarningTl: number;
  companyRevenueTl: number;
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
  todayRevenueUsd: number;
  todayRevenueTl: number;
  activeCouriers: number;
  pendingOrders: number;
  enRouteOrders: number;
};
