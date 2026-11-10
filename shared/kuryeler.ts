/** kuryeler.tr domain: roles, statuses, Istanbul coverage and pricing. */

export const BRAND_NAME = "kuryeler.tr";
export const BRAND_CITY = "İstanbul";
export const CURRENCY_SUFFIX = "TL";
export const BRAND_URL = "https://kuryeler.tr";
export const CONTACT_EMAIL = "iletisim@kuryeler.tr";
export const CONTACT_PHONE_DISPLAY = "0532 474 67 45";
/** WhatsApp uluslararası format (başında + yok). VITE_WHATSAPP_NUMBER ile override. */
export const CONTACT_WHATSAPP_E164 = "905324746745";

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

export const PACKAGE_TYPES = ["evrak", "kucuk", "orta", "buyuk", "gida"] as const;
export type PackageType = (typeof PACKAGE_TYPES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Müşteri",
  courier: "Kurye",
  admin: "Yönetici",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Beklemede",
  assigned: "Kuryeye atandı",
  picked_up: "Alındı",
  en_route: "Yolda",
  delivered: "Teslim edildi",
  cancelled: "İptal",
};

export const PACKAGE_LABELS: Record<PackageType, string> = {
  evrak: "Evrak",
  kucuk: "Küçük paket",
  orta: "Orta paket",
  buyuk: "Büyük paket",
  gida: "Gıda",
};

export const PACKAGE_DESCRIPTIONS: Record<PackageType, string> = {
  evrak: "Zarf, belge, küçük dosya",
  kucuk: "Ayakkabı kutusu veya küçük poşet",
  orta: "Standart koli, birkaç ürün",
  buyuk: "Büyük koli veya hacimli gönderi",
  gida: "Sıcak/soğuk gıda, market poşeti",
};

export type ContinentSide = "avrupa" | "anadolu";

export type IstanbulDistrict = {
  name: string;
  side: ContinentSide;
  lat: number;
  lng: number;
};

/** İstanbul ilçe merkezleri (yaklaşık); km tahmini için haversine. */
export const ISTANBUL_DISTRICTS: IstanbulDistrict[] = [
  { name: "Adalar", side: "anadolu", lat: 40.876, lng: 29.095 },
  { name: "Arnavutköy", side: "avrupa", lat: 41.185, lng: 28.74 },
  { name: "Ataşehir", side: "anadolu", lat: 40.983, lng: 29.127 },
  { name: "Avcılar", side: "avrupa", lat: 40.979, lng: 28.721 },
  { name: "Bağcılar", side: "avrupa", lat: 41.039, lng: 28.856 },
  { name: "Bahçelievler", side: "avrupa", lat: 41.002, lng: 28.86 },
  { name: "Bakırköy", side: "avrupa", lat: 40.981, lng: 28.877 },
  { name: "Başakşehir", side: "avrupa", lat: 41.093, lng: 28.802 },
  { name: "Bayrampaşa", side: "avrupa", lat: 41.048, lng: 28.9 },
  { name: "Beşiktaş", side: "avrupa", lat: 41.043, lng: 29.008 },
  { name: "Beykoz", side: "anadolu", lat: 41.125, lng: 29.108 },
  { name: "Beylikdüzü", side: "avrupa", lat: 41.001, lng: 28.642 },
  { name: "Beyoğlu", side: "avrupa", lat: 41.038, lng: 28.985 },
  { name: "Büyükçekmece", side: "avrupa", lat: 41.021, lng: 28.585 },
  { name: "Çatalca", side: "avrupa", lat: 41.143, lng: 28.461 },
  { name: "Çekmeköy", side: "anadolu", lat: 41.037, lng: 29.2 },
  { name: "Esenler", side: "avrupa", lat: 41.043, lng: 28.876 },
  { name: "Esenyurt", side: "avrupa", lat: 41.033, lng: 28.675 },
  { name: "Eyüpsultan", side: "avrupa", lat: 41.056, lng: 28.922 },
  { name: "Fatih", side: "avrupa", lat: 41.018, lng: 28.95 },
  { name: "Gaziosmanpaşa", side: "avrupa", lat: 41.076, lng: 28.911 },
  { name: "Güngören", side: "avrupa", lat: 41.021, lng: 28.873 },
  { name: "Kadıköy", side: "anadolu", lat: 40.983, lng: 29.037 },
  { name: "Kağıthane", side: "avrupa", lat: 41.08, lng: 28.973 },
  { name: "Kartal", side: "anadolu", lat: 40.911, lng: 29.194 },
  { name: "Küçükçekmece", side: "avrupa", lat: 41.003, lng: 28.78 },
  { name: "Maltepe", side: "anadolu", lat: 40.935, lng: 29.151 },
  { name: "Pendik", side: "anadolu", lat: 40.877, lng: 29.233 },
  { name: "Sancaktepe", side: "anadolu", lat: 41.002, lng: 29.237 },
  { name: "Sarıyer", side: "avrupa", lat: 41.166, lng: 29.057 },
  { name: "Silivri", side: "avrupa", lat: 41.073, lng: 28.246 },
  { name: "Sultanbeyli", side: "anadolu", lat: 40.968, lng: 29.267 },
  { name: "Sultangazi", side: "avrupa", lat: 41.107, lng: 28.868 },
  { name: "Şile", side: "anadolu", lat: 41.175, lng: 29.613 },
  { name: "Şişli", side: "avrupa", lat: 41.06, lng: 28.987 },
  { name: "Tuzla", side: "anadolu", lat: 40.816, lng: 29.305 },
  { name: "Ümraniye", side: "anadolu", lat: 41.016, lng: 29.124 },
  { name: "Üsküdar", side: "anadolu", lat: 41.023, lng: 29.016 },
  { name: "Zeytinburnu", side: "avrupa", lat: 41.003, lng: 28.91 },
];

export const DISTRICT_NAMES = ISTANBUL_DISTRICTS.map(d => d.name);

export type PricingSettings = {
  baseFeeTl: number;
  perKmTl: number;
  commissionRate: number;
  useZones: boolean;
  crossSideSurchargeTl: number;
  packageFees: Record<PackageType, number>;
};

export const DEFAULT_PRICING: PricingSettings = {
  baseFeeTl: 150,
  perKmTl: 25,
  commissionRate: 0.2,
  useZones: true,
  crossSideSurchargeTl: 40,
  packageFees: {
    evrak: 0,
    kucuk: 0,
    orta: 25,
    buyuk: 50,
    gida: 20,
  },
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

export function findDistrict(name: string) {
  const key = name.trim().toLocaleLowerCase("tr-TR");
  return ISTANBUL_DISTRICTS.find(d => d.name.toLocaleLowerCase("tr-TR") === key) ?? null;
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const arc =
    sinLat * sinLat +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * sinLng * sinLng;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

/** District-center distance with a 1.35 road-factor (not bird-flight). */
export function estimateDistanceKm(pickupDistrict: string, dropoffDistrict: string) {
  const pickup = findDistrict(pickupDistrict);
  const dropoff = findDistrict(dropoffDistrict);
  if (!pickup || !dropoff) return 0;
  if (pickup.name === dropoff.name) return 3;
  return Number((haversineKm(pickup, dropoff) * 1.35).toFixed(2));
}

export type PriceBreakdown = {
  distanceKm: number;
  baseFeeTl: number;
  distanceFeeTl: number;
  packageFeeTl: number;
  zoneSurchargeTl: number;
  totalTl: number;
  commissionTl: number;
  courierEarningTl: number;
  companyRevenueTl: number;
};

export function calculateDeliveryPrice(input: {
  pickupDistrict: string;
  dropoffDistrict: string;
  packageType: PackageType;
  distanceKm?: number;
  pricing?: PricingSettings;
}): PriceBreakdown {
  const pricing = input.pricing ?? DEFAULT_PRICING;
  const distanceKm =
    input.distanceKm != null && Number.isFinite(input.distanceKm)
      ? Math.max(0, Number(input.distanceKm))
      : estimateDistanceKm(input.pickupDistrict, input.dropoffDistrict);
  const packageFeeTl = pricing.packageFees[input.packageType] ?? 0;
  const pickup = findDistrict(input.pickupDistrict);
  const dropoff = findDistrict(input.dropoffDistrict);
  const crossSide =
    Boolean(pricing.useZones && pickup && dropoff && pickup.side !== dropoff.side);
  const zoneSurchargeTl = crossSide ? pricing.crossSideSurchargeTl : 0;
  const distanceFeeTl = Number((distanceKm * pricing.perKmTl).toFixed(2));
  const rawTotal = pricing.baseFeeTl + distanceFeeTl + packageFeeTl + zoneSurchargeTl;
  const totalTl = Number(Math.max(pricing.baseFeeTl, rawTotal).toFixed(2));
  const commissionTl = Number((totalTl * pricing.commissionRate).toFixed(2));
  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    baseFeeTl: pricing.baseFeeTl,
    distanceFeeTl,
    packageFeeTl,
    zoneSurchargeTl,
    totalTl,
    commissionTl,
    courierEarningTl: Number((totalTl - commissionTl).toFixed(2)),
    companyRevenueTl: commissionTl,
  };
}

export function formatTl(value: number | string) {
  return `${Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${CURRENCY_SUFFIX}`;
}

export function generateTrackingCode(now = new Date()) {
  const stamp = now
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(2, 12);
  const rand = Math.floor(Math.random() * 36 ** 3)
    .toString(36)
    .toUpperCase()
    .padStart(3, "0");
  return `KY-${stamp}${rand}`.slice(0, 16);
}

export function isActiveOrder(status: OrderStatus) {
  return status === "pending" || status === "assigned" || status === "picked_up" || status === "en_route";
}

export function statusTone(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "bg-[#2a2410] text-[#D4AF37]";
    case "assigned":
      return "bg-[#1a2330] text-[#d4c48a]";
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

export type DeliveryOrder = {
  id: string;
  trackingCode: string;
  customerId: string;
  courierId: string | null;
  status: OrderStatus;
  pickupAddress: string;
  pickupDistrict: string;
  pickupNeighborhood: string;
  pickupStreet: string;
  pickupNote: string;
  dropoffAddress: string;
  dropoffDistrict: string;
  dropoffNeighborhood: string;
  dropoffStreet: string;
  dropoffNote: string;
  packageType: PackageType;
  notes: string;
  contactPhone: string;
  distanceKm: number;
  totalPriceTl: number;
  courierEarningTl: number;
  companyRevenueTl: number;
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
