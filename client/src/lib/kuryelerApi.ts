import {
  calculateDeliveryPrice,
  canTransitionStatus,
  DEFAULT_PRICING,
  DISTRICT_PRICES,
  generateTrackingCode,
  isActiveOrder,
  nextCourierStatus,
  redactPendingForCourier,
  WEIGHT_LIMIT_MESSAGE,
  type DashboardStats,
  type DeliveryOrder,
  type DistrictPrice,
  type Geocoder,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
  type PricingSettings,
  type Profile,
  type RoutingProvider,
  type UserRole,
} from "@shared/kuryeler";
import { buildOrderConfirmationMail, type OutboundMail } from "@shared/orderConfirmation";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const DEMO_KEY = "kuryeler.tr.demo.v4";

export const DEMO_ACCOUNTS = [
  {
    email: "musteri@kuryeler.tr",
    password: "KuryelerMusteri1!",
    role: "customer" as const,
    fullName: "Ayşe Müşteri",
    phone: "05421110003",
    id: "demo-customer",
  },
  {
    email: "kurye@kuryeler.tr",
    password: "KuryelerKurye1!",
    role: "courier" as const,
    fullName: "Mehmet Kurye",
    phone: "05421110002",
    id: "demo-courier",
  },
  {
    email: "yonetici@kuryeler.tr",
    password: "KuryelerYonetici1!",
    role: "admin" as const,
    fullName: "Şerif Yönetici",
    phone: "05421110001",
    id: "demo-admin",
  },
] as const;

export type SessionUser = Profile;

export type CreateOrderInput = {
  product: string;
  pickupAddress: string;
  dropoffAddress: string;
  bolge?: string;
  recipientName: string;
  scheduledAt: string;
  notes: string;
  contactPhone: string;
  paymentMethod: PaymentMethod;
  weightKg: number;
  distanceKm: number;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  routeGeojson?: string | null;
};

export type PublicTrack = {
  trackingCode: string;
  status: OrderStatus;
  bolge: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceKm: number;
  createdAt: string;
  updatedAt: string;
};

export type StatusProof = {
  pickupPhoto?: string | null;
  deliveryPhoto?: string | null;
  signatureData?: string | null;
};

type DemoState = {
  sessionId: string | null;
  users: Array<{
    id: string;
    email: string;
    password: string;
    role: UserRole;
    fullName: string;
    phone: string;
    isOnline: boolean;
    createdAt: string;
  }>;
  orders: DeliveryOrder[];
  pricing: PricingSettings;
  districtPrices: DistrictPrice[];
  outboundMail: OutboundMail[];
};

function nowIso() {
  return new Date().toISOString();
}

function laterIso(hours = 2) {
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

export function mergePricing(raw?: Partial<PricingSettings> | null): PricingSettings {
  return {
    ...DEFAULT_PRICING,
    ...raw,
    routingProvider: (raw?.routingProvider ?? DEFAULT_PRICING.routingProvider) as RoutingProvider,
    geocoder: (raw?.geocoder ?? DEFAULT_PRICING.geocoder) as Geocoder,
  };
}

function quoteFor(distanceKm: number, pricing: PricingSettings) {
  return calculateDeliveryPrice({ distanceKm, pricing });
}

function withQuote(
  order: Omit<DeliveryOrder, "totalPriceTl" | "courierEarningTl" | "companyRevenueTl"> &
    Partial<Pick<DeliveryOrder, "totalPriceTl" | "courierEarningTl" | "companyRevenueTl">>,
  pricing: PricingSettings,
): DeliveryOrder {
  const quote = quoteFor(order.distanceKm, pricing);
  return {
    ...order,
    totalPriceTl: quote.totalTl,
    courierEarningTl: quote.courierEarningTl,
    companyRevenueTl: quote.companyRevenueTl,
  };
}

function seedDemo(): DemoState {
  const createdAt = nowIso();
  const pricing = mergePricing();
  const districtPrices = DISTRICT_PRICES.map(row => ({ ...row }));
  const users = DEMO_ACCOUNTS.map(account => ({
    id: account.id,
    email: account.email,
    password: account.password,
    role: account.role,
    fullName: account.fullName,
    phone: account.phone,
    isOnline: account.role === "courier",
    createdAt,
  }));
  const orders: DeliveryOrder[] = [
    withQuote(
      {
        id: "demo-order-1",
        trackingCode: "KY-DEMO0001",
        customerId: "demo-customer",
        courierId: null,
        status: "pending",
        product: "Sözleşme evrakı",
        pickupAddress: "Caferağa, Moda Cad. No 12, Kadıköy, İstanbul",
        dropoffAddress: "Levent, Büyükdere Cad. No 120, Beşiktaş, İstanbul",
        bolge: "Beşiktaş",
        recipientName: "Ayşe Demir",
        scheduledAt: laterIso(2),
        notes: "Resepsiyona teslim",
        contactPhone: "05421110003",
        paymentMethod: "nakit",
        paymentStatus: "bekliyor",
        pickupPhoto: null,
        deliveryPhoto: null,
        signatureData: null,
        weightKg: 1.5,
        distanceKm: 7.4,
        pickupLat: 40.9879,
        pickupLng: 29.0256,
        dropoffLat: 41.0814,
        dropoffLng: 29.0119,
        routeGeojson: JSON.stringify([
          [40.9879, 29.0256],
          [41.016, 29.03],
          [41.0814, 29.0119],
        ]),
        createdAt,
        updatedAt: createdAt,
        assignedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
        cancelledAt: null,
      },
      pricing,
    ),
    withQuote(
      {
        id: "demo-order-2",
        trackingCode: "KY-DEMO0002",
        customerId: "demo-customer",
        courierId: "demo-courier",
        status: "en_route",
        product: "Hediyelik kutu",
        pickupAddress: "Osmanağa, Bahariye Cad. No 45, Kadıköy, İstanbul",
        dropoffAddress: "Ataşehir Bulvarı Daire 8, Ataşehir, İstanbul",
        bolge: "Ataşehir",
        recipientName: "Can Yılmaz",
        scheduledAt: laterIso(1),
        notes: "Daire 8",
        contactPhone: "05421110003",
        paymentMethod: "havale",
        paymentStatus: "bekliyor",
        pickupPhoto: null,
        deliveryPhoto: null,
        signatureData: null,
        weightKg: 4,
        distanceKm: 11.2,
        pickupLat: 40.9902,
        pickupLng: 29.0281,
        dropoffLat: 40.9925,
        dropoffLng: 29.1236,
        routeGeojson: JSON.stringify([
          [40.9902, 29.0281],
          [40.991, 29.07],
          [40.9925, 29.1236],
        ]),
        createdAt,
        updatedAt: createdAt,
        assignedAt: createdAt,
        pickedUpAt: createdAt,
        deliveredAt: null,
        cancelledAt: null,
      },
      pricing,
    ),
  ];
  return { sessionId: null, users, orders, pricing, districtPrices, outboundMail: [] };
}

function loadDemo(): DemoState {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (!raw) {
      const seeded = seedDemo();
      localStorage.setItem(DEMO_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as DemoState;
    if (!parsed.districtPrices?.length) parsed.districtPrices = DISTRICT_PRICES.map(row => ({ ...row }));
    parsed.pricing = mergePricing(parsed.pricing);
    parsed.outboundMail = parsed.outboundMail ?? [];
    return parsed;
  } catch {
    return seedDemo();
  }
}

function saveDemo(state: DemoState) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(state));
}

function toProfile(user: DemoState["users"][number]): Profile {
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    isOnline: user.isOnline,
    createdAt: user.createdAt,
  };
}

function numOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapOrder(row: Record<string, unknown>): DeliveryOrder {
  const bolge = String(row.bolge || row.dropoff_district || "");
  return {
    id: String(row.id),
    trackingCode: String(row.tracking_code ?? row.trackingCode),
    customerId: String(row.customer_id ?? row.customerId),
    courierId: row.courier_id || row.courierId ? String(row.courier_id ?? row.courierId) : null,
    status: row.status as OrderStatus,
    product: String(row.product ?? row.notes ?? ""),
    pickupAddress: String(row.pickup_address ?? row.pickupAddress ?? ""),
    dropoffAddress: String(row.dropoff_address ?? row.dropoffAddress ?? ""),
    bolge,
    recipientName: String(row.recipient_name ?? row.recipientName ?? ""),
    scheduledAt: row.scheduled_at || row.scheduledAt ? String(row.scheduled_at ?? row.scheduledAt) : null,
    notes: String(row.notes ?? ""),
    contactPhone: String(row.contact_phone ?? row.contactPhone ?? ""),
    paymentMethod: (row.payment_method ?? row.paymentMethod ?? "nakit") as PaymentMethod,
    paymentStatus: (row.payment_status ?? row.paymentStatus ?? "bekliyor") as PaymentStatus,
    pickupPhoto: row.pickup_photo || row.pickupPhoto ? String(row.pickup_photo ?? row.pickupPhoto) : null,
    deliveryPhoto: row.delivery_photo || row.deliveryPhoto ? String(row.delivery_photo ?? row.deliveryPhoto) : null,
    signatureData: row.signature_data || row.signatureData ? String(row.signature_data ?? row.signatureData) : null,
    weightKg: Number(row.weight_kg ?? row.weightKg ?? 1),
    distanceKm: Number(row.distance_km ?? row.distanceKm ?? 0),
    totalPriceTl: Number(row.total_price_tl ?? row.totalPriceTl ?? 0),
    courierEarningTl: Number(row.courier_earning_tl ?? row.courierEarningTl ?? 0),
    companyRevenueTl: Number(row.company_revenue_tl ?? row.companyRevenueTl ?? 0),
    pickupLat: numOrNull(row.pickup_lat ?? row.pickupLat),
    pickupLng: numOrNull(row.pickup_lng ?? row.pickupLng),
    dropoffLat: numOrNull(row.dropoff_lat ?? row.dropoffLat),
    dropoffLng: numOrNull(row.dropoff_lng ?? row.dropoffLng),
    routeGeojson: row.route_geojson || row.routeGeojson ? String(row.route_geojson ?? row.routeGeojson) : null,
    createdAt: String(row.created_at ?? row.createdAt),
    updatedAt: String(row.updated_at ?? row.updatedAt),
    assignedAt: row.assigned_at || row.assignedAt ? String(row.assigned_at ?? row.assignedAt) : null,
    pickedUpAt: row.picked_up_at || row.pickedUpAt ? String(row.picked_up_at ?? row.pickedUpAt) : null,
    deliveredAt: row.delivered_at || row.deliveredAt ? String(row.delivered_at ?? row.deliveredAt) : null,
    cancelledAt: row.cancelled_at || row.cancelledAt ? String(row.cancelled_at ?? row.cancelledAt) : null,
  };
}

function todayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function dashboardFrom(orders: DeliveryOrder[], couriersOnline: number): DashboardStats {
  const start = todayStartIso();
  const today = orders.filter(o => o.createdAt >= start && o.status !== "cancelled");
  return {
    todayOrders: today.length,
    todayRevenueTl: today.reduce((sum, o) => sum + o.totalPriceTl, 0),
    activeCouriers: couriersOnline,
    pendingOrders: orders.filter(o => o.status === "pending" || o.status === "assigned").length,
    enRouteOrders: orders.filter(o => o.status === "en_route" || o.status === "picked_up").length,
  };
}

const demoListeners = new Set<() => void>();

function notifyDemo() {
  demoListeners.forEach(fn => fn());
}

export const kuryelerMode = isSupabaseConfigured() ? "supabase" : "demo";

export async function getSession(): Promise<SessionUser | null> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const user = state.users.find(u => u.id === state.sessionId);
    return user ? toProfile(user) : null;
  }
  const supabase = getSupabase()!;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return loadProfile(data.user);
}

async function loadProfile(user: User): Promise<SessionUser> {
  const supabase = getSupabase()!;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw new Error(error.message);
  return {
    id: user.id,
    role: (data?.role as UserRole) ?? "customer",
    fullName: data?.full_name || (user.user_metadata?.full_name as string) || "",
    phone: data?.phone || (user.user_metadata?.phone as string) || "",
    email: user.email ?? "",
    isOnline: Boolean(data?.is_online),
    createdAt: data?.created_at ?? user.created_at,
  };
}

export async function signIn(email: string, password: string): Promise<SessionUser> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const user = state.users.find(
      u => u.email.toLocaleLowerCase("tr-TR") === email.trim().toLocaleLowerCase("tr-TR") && u.password === password,
    );
    if (!user) throw new Error("E-posta veya şifre hatalı");
    state.sessionId = user.id;
    saveDemo(state);
    notifyDemo();
    return toProfile(user);
  }
  const supabase = getSupabase()!;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(error?.message || "Giriş başarısız");
  return loadProfile(data.user);
}

export async function signUp(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: "customer" | "courier";
}): Promise<SessionUser> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    if (state.users.some(u => u.email.toLocaleLowerCase("tr-TR") === input.email.trim().toLocaleLowerCase("tr-TR"))) {
      throw new Error("Bu e-posta ile kayıtlı bir hesap var");
    }
    const user = {
      id: `demo-${crypto.randomUUID()}`,
      email: input.email.trim(),
      password: input.password,
      role: input.role,
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      isOnline: false,
      createdAt: nowIso(),
    };
    state.users.push(user);
    state.sessionId = user.id;
    saveDemo(state);
    notifyDemo();
    return toProfile(user);
  }
  const supabase = getSupabase()!;
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName, phone: input.phone, role: input.role },
    },
  });
  if (error || !data.user) throw new Error(error?.message || "Kayıt başarısız");
  if (!data.session) {
    throw new Error("Kayıt alındı. E-posta doğrulamasını tamamladıktan sonra giriş yapın.");
  }
  return loadProfile(data.user);
}

export async function signOut() {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    state.sessionId = null;
    saveDemo(state);
    notifyDemo();
    return;
  }
  await getSupabase()!.auth.signOut();
}

function mapPricingRow(row: Record<string, unknown>): PricingSettings {
  return mergePricing({
    baseTry: Number(row.base_try ?? row.baseTry ?? DEFAULT_PRICING.baseTry),
    perKmTry: Number(row.per_km_try ?? row.perKmTry ?? DEFAULT_PRICING.perKmTry),
    roundingDecimals: Number(row.rounding_decimals ?? row.roundingDecimals ?? DEFAULT_PRICING.roundingDecimals),
    routingProvider: (row.routing_provider ?? row.routingProvider ?? DEFAULT_PRICING.routingProvider) as RoutingProvider,
    routingUrl: String(row.routing_url ?? row.routingUrl ?? DEFAULT_PRICING.routingUrl),
    geocoder: (row.geocoder ?? DEFAULT_PRICING.geocoder) as Geocoder,
    commissionRate: Number(row.commission_rate ?? row.commissionRate ?? DEFAULT_PRICING.commissionRate),
    showcaseMode: Boolean(row.showcase_mode ?? row.showcaseMode ?? DEFAULT_PRICING.showcaseMode),
  });
}

export async function getPricing(): Promise<PricingSettings> {
  if (kuryelerMode === "demo") return mergePricing(loadDemo().pricing);
  const { data, error } = await getSupabase()!.from("pricing_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  return mapPricingRow(data as Record<string, unknown>);
}

export async function listDistrictPrices(): Promise<DistrictPrice[]> {
  if (kuryelerMode === "demo") return loadDemo().districtPrices.map(row => ({ ...row }));
  const { data, error } = await getSupabase()!.from("district_prices").select("*").order("bolge");
  if (error) throw new Error(error.message);
  return (data ?? []).map(row => ({
    bolge: row.bolge as string,
    fiyatTl: Number(row.fiyat_tl),
    lat: Number(row.lat ?? 41.01),
    lng: Number(row.lng ?? 28.98),
  }));
}

export async function updateDistrictPrice(bolge: string, fiyatTl: number): Promise<DistrictPrice[]> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const row = state.districtPrices.find(item => item.bolge === bolge);
    if (!row) throw new Error("Bölge bulunamadı");
    row.fiyatTl = fiyatTl;
    saveDemo(state);
    notifyDemo();
    return state.districtPrices.map(item => ({ ...item }));
  }
  const { error } = await getSupabase()!.from("district_prices").update({ fiyat_tl: fiyatTl }).eq("bolge", bolge);
  if (error) throw new Error(error.message);
  return listDistrictPrices();
}

export async function updatePricing(pricing: PricingSettings): Promise<PricingSettings> {
  const next = mergePricing(pricing);
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    state.pricing = next;
    saveDemo(state);
    notifyDemo();
    return next;
  }
  const { data, error } = await getSupabase()!
    .from("pricing_settings")
    .update({
      base_try: next.baseTry,
      per_km_try: next.perKmTry,
      rounding_decimals: next.roundingDecimals,
      routing_provider: next.routingProvider,
      routing_url: next.routingUrl,
      geocoder: next.geocoder,
      commission_rate: next.commissionRate,
      showcase_mode: next.showcaseMode,
    })
    .eq("id", 1)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapPricingRow(data as Record<string, unknown>);
}

export function estimateOrder(input: Pick<CreateOrderInput, "distanceKm">, pricing: PricingSettings) {
  return calculateDeliveryPrice({
    distanceKm: input.distanceKm,
    pricing,
  });
}

export async function createOrder(customerId: string, input: CreateOrderInput): Promise<DeliveryOrder> {
  if (input.weightKg > 30) {
    throw new Error(WEIGHT_LIMIT_MESSAGE);
  }
  if (!(input.weightKg > 0)) {
    throw new Error("Paket ağırlığını kg olarak yazın.");
  }
  if (!(input.distanceKm > 0) || input.pickupLat == null || input.dropoffLat == null) {
    throw new Error("Haritada alım ve teslim noktalarını seçip sürüş rotasını hesaplatın.");
  }
  const pricing = await getPricing();
  const quote = estimateOrder(input, pricing);
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const createdAt = nowIso();
    const order = withQuote(
      {
        id: crypto.randomUUID(),
        trackingCode: generateTrackingCode(),
        customerId,
        courierId: null,
        status: "pending",
        product: input.product.trim(),
        pickupAddress: input.pickupAddress.trim(),
        dropoffAddress: input.dropoffAddress.trim(),
        bolge: input.bolge?.trim() || "",
        recipientName: input.recipientName.trim(),
        scheduledAt: input.scheduledAt,
        notes: input.notes.trim(),
        contactPhone: input.contactPhone,
        paymentMethod: input.paymentMethod,
        paymentStatus: "bekliyor",
        pickupPhoto: null,
        deliveryPhoto: null,
        signatureData: null,
        weightKg: input.weightKg,
        distanceKm: input.distanceKm,
        pickupLat: input.pickupLat,
        pickupLng: input.pickupLng,
        dropoffLat: input.dropoffLat,
        dropoffLng: input.dropoffLng,
        routeGeojson: input.routeGeojson ?? null,
        createdAt,
        updatedAt: createdAt,
        assignedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
        cancelledAt: null,
      },
      pricing,
    );
    state.orders.unshift(order);
    saveDemo(state);
    notifyDemo();
    return order;
  }
  const district = input.bolge?.trim() || "İstanbul";
  const { data, error } = await getSupabase()!
    .from("orders")
    .insert({
      tracking_code: generateTrackingCode(),
      customer_id: customerId,
      status: "pending",
      product: input.product.trim(),
      pickup_address: input.pickupAddress.trim(),
      pickup_district: district,
      dropoff_address: input.dropoffAddress.trim(),
      dropoff_district: district,
      bolge: district,
      recipient_name: input.recipientName.trim(),
      scheduled_at: input.scheduledAt,
      notes: input.notes.trim(),
      contact_phone: input.contactPhone,
      payment_method: input.paymentMethod,
      payment_status: "bekliyor",
      weight_kg: input.weightKg,
      distance_km: input.distanceKm,
      pickup_lat: input.pickupLat,
      pickup_lng: input.pickupLng,
      dropoff_lat: input.dropoffLat,
      dropoff_lng: input.dropoffLng,
      route_geojson: input.routeGeojson ?? null,
    })
    .select("*")
    .single();
  if (error) {
    const message = error.message || "Sipariş oluşturulamadı";
    if (/30 kg/i.test(message) || /weight/i.test(message)) throw new Error(WEIGHT_LIMIT_MESSAGE);
    throw new Error(message);
  }
  const mapped = mapOrder(data as Record<string, unknown>);
  if (!mapped.totalPriceTl) {
    mapped.totalPriceTl = quote.totalTl;
    mapped.courierEarningTl = quote.courierEarningTl;
    mapped.companyRevenueTl = quote.companyRevenueTl;
  }
  return mapped;
}

export async function queueOrderConfirmation(order: DeliveryOrder, toEmail: string) {
  const mail = buildOrderConfirmationMail(order, toEmail);
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    state.outboundMail = state.outboundMail ?? [];
    state.outboundMail.unshift({
      id: crypto.randomUUID(),
      createdAt: nowIso(),
      ...mail,
    });
    saveDemo(state);
    notifyDemo();
    return;
  }
  const { error } = await getSupabase()!.rpc("queue_order_confirmation", {
    p_to_email: mail.toEmail,
    p_subject: mail.subject,
    p_body: mail.body,
    p_payload: { trackingCode: order.trackingCode, orderId: order.id },
  });
  if (error) throw new Error(error.message);
}

export async function listOrdersFor(user: SessionUser): Promise<DeliveryOrder[]> {
  if (kuryelerMode === "demo") {
    const { orders } = loadDemo();
    if (user.role === "admin") return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (user.role === "courier") {
      const mine = orders.filter(o => o.courierId === user.id);
      const open = orders
        .filter(o => o.status === "pending" && !o.courierId)
        .map(redactPendingForCourier);
      return [...open, ...mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return orders.filter(o => o.customerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { data, error } = await getSupabase()!.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const mine = (data ?? []).map(row => mapOrder(row as Record<string, unknown>));
  if (user.role !== "courier") return mine;
  const { data: openRows, error: openError } = await getSupabase()!.rpc("list_courier_open_jobs");
  if (openError) throw new Error(openError.message);
  const open = (openRows ?? []).map((row: Record<string, unknown>) =>
    redactPendingForCourier(
      mapOrder({
        ...row,
        tracking_code: row.tracking_code ?? String(row.id),
        customer_id: "",
        product: "Gönderi",
        pickup_address: row.pickup_district ?? row.bolge ?? "İlçe",
        dropoff_address: row.dropoff_district ?? row.bolge ?? "İlçe",
      }),
    ),
  );
  return [...open, ...mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function acceptOrder(orderId: string): Promise<DeliveryOrder> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const order = state.orders.find(o => o.id === orderId);
    if (!order || order.status !== "pending" || order.courierId) throw new Error("İş artık müsait değil");
    order.courierId = state.sessionId;
    order.status = "assigned";
    order.assignedAt = nowIso();
    order.updatedAt = order.assignedAt;
    saveDemo(state);
    notifyDemo();
    return order;
  }
  const { data, error } = await getSupabase()!.rpc("accept_order", { p_order_id: orderId });
  if (error) throw new Error(error.message);
  return mapOrder(data as Record<string, unknown>);
}

export async function advanceStatus(
  orderId: string,
  status: OrderStatus,
  proof: StatusProof = {},
): Promise<DeliveryOrder> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const order = state.orders.find(o => o.id === orderId);
    if (!order) throw new Error("Sipariş bulunamadı");
    if (!canTransitionStatus(order.status, status)) throw new Error("Bu durum geçişi geçersiz");
    if (status === "picked_up" && !proof.pickupPhoto) throw new Error("Alım için fotoğraf gereklidir");
    if (status === "delivered" && (!proof.deliveryPhoto || !proof.signatureData)) {
      throw new Error("Teslim için fotoğraf ve imza gereklidir");
    }
    const stamp = nowIso();
    order.status = status;
    order.updatedAt = stamp;
    if (proof.pickupPhoto) order.pickupPhoto = proof.pickupPhoto;
    if (proof.deliveryPhoto) order.deliveryPhoto = proof.deliveryPhoto;
    if (proof.signatureData) order.signatureData = proof.signatureData;
    if (status === "picked_up") order.pickedUpAt = stamp;
    if (status === "delivered") order.deliveredAt = stamp;
    if (status === "cancelled") order.cancelledAt = stamp;
    saveDemo(state);
    notifyDemo();
    return order;
  }
  const { data, error } = await getSupabase()!.rpc("advance_order_status", {
    p_order_id: orderId,
    p_status: status,
    p_pickup_photo: proof.pickupPhoto ?? null,
    p_delivery_photo: proof.deliveryPhoto ?? null,
    p_signature: proof.signatureData ?? null,
  });
  if (error) throw new Error(error.message);
  return mapOrder(data as Record<string, unknown>);
}

export async function assignCourier(orderId: string, courierId: string): Promise<DeliveryOrder> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const order = state.orders.find(o => o.id === orderId);
    const courier = state.users.find(u => u.id === courierId && u.role === "courier");
    if (!order || !courier) throw new Error("Sipariş veya kurye bulunamadı");
    if (order.status === "delivered" || order.status === "cancelled") {
      throw new Error("Bu sipariş atanamaz");
    }
    order.courierId = courierId;
    if (order.status === "pending") order.status = "assigned";
    order.assignedAt = nowIso();
    order.updatedAt = order.assignedAt;
    saveDemo(state);
    notifyDemo();
    return order;
  }
  const { data, error } = await getSupabase()!.rpc("assign_order", {
    p_order_id: orderId,
    p_courier_id: courierId,
  });
  if (error) throw new Error(error.message);
  return mapOrder(data as Record<string, unknown>);
}

export async function setPaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<DeliveryOrder> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const order = state.orders.find(o => o.id === orderId);
    if (!order) throw new Error("Sipariş bulunamadı");
    order.paymentStatus = paymentStatus;
    order.updatedAt = nowIso();
    saveDemo(state);
    notifyDemo();
    return order;
  }
  const { data, error } = await getSupabase()!.rpc("set_payment_status", {
    p_order_id: orderId,
    p_status: paymentStatus,
  });
  if (error) throw new Error(error.message);
  return mapOrder(data as Record<string, unknown>);
}

export async function toggleOnline(userId: string, isOnline: boolean): Promise<void> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const user = state.users.find(u => u.id === userId);
    if (user) user.isOnline = isOnline;
    saveDemo(state);
    notifyDemo();
    return;
  }
  const { error } = await getSupabase()!.from("profiles").update({ is_online: isOnline }).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function listUsers(): Promise<Profile[]> {
  if (kuryelerMode === "demo") return loadDemo().users.map(toProfile);
  const { data, error } = await getSupabase()!
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(row => ({
    id: row.id as string,
    role: row.role as UserRole,
    fullName: row.full_name as string,
    phone: row.phone as string,
    email: "",
    isOnline: Boolean(row.is_online),
    createdAt: row.created_at as string,
  }));
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const user = state.users.find(u => u.id === userId);
    if (user) user.role = role;
    saveDemo(state);
    notifyDemo();
    return;
  }
  const { error } = await getSupabase()!.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function getDashboard(user: SessionUser): Promise<DashboardStats> {
  const orders = await listOrdersFor(user);
  if (kuryelerMode === "demo") {
    const online = loadDemo().users.filter(u => u.role === "courier" && u.isOnline).length;
    return dashboardFrom(orders, online);
  }
  const { data } = await getSupabase()!.from("profiles").select("id").eq("role", "courier").eq("is_online", true);
  return dashboardFrom(orders, data?.length ?? 0);
}

export async function trackPublic(code: string): Promise<PublicTrack | null> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return null;
  if (kuryelerMode === "demo") {
    const order = loadDemo().orders.find(o => o.trackingCode.toUpperCase() === trimmed);
    if (!order) return null;
    return {
      trackingCode: order.trackingCode,
      status: order.status,
      bolge: order.bolge,
      pickupAddress: order.bolge || "İlçe",
      dropoffAddress: order.bolge || "İlçe",
      distanceKm: order.distanceKm,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
  const { data, error } = await getSupabase()!.rpc("track_order_public", { p_code: trimmed });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    trackingCode: row.tracking_code,
    status: row.status,
    bolge: row.bolge || row.dropoff_district,
    pickupAddress: row.pickup_district ?? row.bolge ?? "",
    dropoffAddress: row.dropoff_district ?? row.bolge ?? "",
    distanceKm: Number(row.distance_km ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function subscribeToOrders(onChange: () => void) {
  if (kuryelerMode === "demo") {
    demoListeners.add(onChange);
    return () => {
      demoListeners.delete(onChange);
    };
  }
  const channel = getSupabase()!
    .channel("kuryeler-orders")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => onChange())
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => onChange())
    .on("postgres_changes", { event: "*", schema: "public", table: "pricing_settings" }, () => onChange())
    .subscribe();
  return () => {
    void getSupabase()!.removeChannel(channel);
  };
}

export function dailyEarnings(orders: DeliveryOrder[], courierId: string) {
  const start = todayStartIso();
  const mine = orders.filter(o => o.courierId === courierId);
  const deliveredToday = mine.filter(o => o.status === "delivered" && (o.deliveredAt ?? o.createdAt) >= start);
  return {
    deliveredCount: deliveredToday.length,
    earningTl: deliveredToday.reduce((sum, o) => sum + o.courierEarningTl, 0),
    activeCount: mine.filter(o => isActiveOrder(o.status)).length,
  };
}

export { nextCourierStatus };
