import {
  calculateDeliveryPrice,
  canTransitionStatus,
  DEFAULT_PRICING,
  DISTRICT_PRICES,
  generateTrackingCode,
  isActiveOrder,
  nextCourierStatus,
  normalizeDeliveryTargetTiers,
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
import {
  canCustomerCancel,
  orderStatusNotification,
  ticketSubject,
  type AppNotification,
  type SupportMessage,
  type SupportSender,
  type SupportTicket,
  type SupportTicketKind,
} from "@shared/kuryelerSupport";
import { buildOrderConfirmationMail, type OutboundMail } from "@shared/orderConfirmation";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const DEMO_KEY = "kuryeler.tr.demo.v7";

export type SessionUser = Profile;

export type CreateOrderInput = {
  product: string;
  pickupAddress: string;
  dropoffAddress: string;
  bolge?: string;
  recipientName: string;
  recipientPhone: string;
  scheduledAt: string;
  notes: string;
  contactPhone: string;
  paymentMethod: PaymentMethod;
  weightKg: number;
  distanceKm: number;
  durationMin?: number;
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
  durationMin: number;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
  deliveryPhoto: string | null;
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
  tickets: SupportTicket[];
  messages: SupportMessage[];
  notifications: AppNotification[];
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
    deliveryTargetTiers: normalizeDeliveryTargetTiers(raw?.deliveryTargetTiers ?? DEFAULT_PRICING.deliveryTargetTiers),
  };
}

function quoteFor(distanceKm: number, pricing: PricingSettings) {
  return calculateDeliveryPrice({ distanceKm, pricing });
}

function withQuote(
  order: Omit<DeliveryOrder, "netPriceTl" | "vatTl" | "totalPriceTl" | "courierEarningTl" | "companyRevenueTl"> &
    Partial<Pick<DeliveryOrder, "netPriceTl" | "vatTl" | "totalPriceTl" | "courierEarningTl" | "companyRevenueTl">>,
  pricing: PricingSettings,
): DeliveryOrder {
  const quote = quoteFor(order.distanceKm, pricing);
  return {
    ...order,
    netPriceTl: quote.netTl,
    vatTl: quote.vatTl,
    totalPriceTl: quote.grossTl,
    courierEarningTl: quote.courierEarningTl,
    companyRevenueTl: quote.companyRevenueTl,
  };
}

function emptyOrderExtras(): Pick<
  DeliveryOrder,
  "recipientPhone" | "durationMin" | "cancelReason" | "cancelledBy"
> {
  return { recipientPhone: "", durationMin: 0, cancelReason: "", cancelledBy: null };
}

function seedDemo(): DemoState {
  const createdAt = nowIso();
  const pricing = mergePricing();
  const districtPrices = DISTRICT_PRICES.map(row => ({ ...row }));
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
        recipientPhone: "05421110004",
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
        durationMin: 22,
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
        cancelReason: "",
        cancelledBy: null,
      },
      pricing,
    ),
    withQuote(
      {
        id: "demo-order-2",
        trackingCode: "KY-DEMO0002",
        customerId: "demo-customer",
        courierId: null,
        status: "en_route",
        product: "Hediyelik kutu",
        pickupAddress: "Osmanağa, Bahariye Cad. No 45, Kadıköy, İstanbul",
        dropoffAddress: "Ataşehir Bulvarı Daire 8, Ataşehir, İstanbul",
        bolge: "Ataşehir",
        recipientName: "Can Yılmaz",
        recipientPhone: "05421110005",
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
        durationMin: 34,
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
        cancelReason: "",
        cancelledBy: null,
      },
      pricing,
    ),
  ];
  return {
    sessionId: null,
    users: [],
    orders,
    pricing,
    districtPrices,
    tickets: [],
    messages: [],
    notifications: [],
    outboundMail: [],
  };
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
    parsed.tickets = parsed.tickets ?? [];
    parsed.messages = parsed.messages ?? [];
    parsed.notifications = parsed.notifications ?? [];
    parsed.outboundMail = parsed.outboundMail ?? [];
    parsed.orders = (parsed.orders ?? []).map(order => ({
      ...emptyOrderExtras(),
      ...order,
      recipientPhone: order.recipientPhone ?? "",
      durationMin: order.durationMin ?? 0,
      cancelReason: order.cancelReason ?? "",
      cancelledBy: order.cancelledBy ?? null,
    }));
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
    recipientPhone: String(row.recipient_phone ?? row.recipientPhone ?? ""),
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
    durationMin: Number(row.duration_min ?? row.durationMin ?? 0),
    netPriceTl: Number(row.net_price_tl ?? row.netPriceTl ?? 0),
    vatTl: Number(row.vat_tl ?? row.vatTl ?? 0),
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
    cancelReason: String(row.cancel_reason ?? row.cancelReason ?? ""),
    cancelledBy: row.cancelled_by || row.cancelledBy ? String(row.cancelled_by ?? row.cancelledBy) : null,
  };
}

function toPublicTrack(row: Record<string, unknown> | PublicTrack): PublicTrack {
  const r = row as Record<string, unknown>;
  return {
    trackingCode: String(r.trackingCode ?? r.tracking_code ?? ""),
    status: (r.status as OrderStatus) ?? "pending",
    bolge: String(r.bolge ?? r.dropoff_district ?? ""),
    pickupAddress: String(r.pickupAddress ?? r.pickup_address ?? r.pickup_district ?? ""),
    dropoffAddress: String(r.dropoffAddress ?? r.dropoff_address ?? r.dropoff_district ?? ""),
    distanceKm: Number(r.distanceKm ?? r.distance_km ?? 0),
    durationMin: Number(r.durationMin ?? r.duration_min ?? 0),
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
    deliveredAt: r.deliveredAt || r.delivered_at ? String(r.deliveredAt ?? r.delivered_at) : null,
    deliveryPhoto: r.deliveryPhoto || r.delivery_photo ? String(r.deliveryPhoto ?? r.delivery_photo) : null,
  };
}

function pushDemoNotification(
  state: DemoState,
  userId: string,
  orderId: string,
  status: OrderStatus,
  durationMin?: number,
) {
  const note = orderStatusNotification(status, durationMin);
  state.notifications.unshift({
    id: crypto.randomUUID(),
    userId,
    title: note.title,
    body: note.body,
    orderId,
    readAt: null,
    createdAt: nowIso(),
  });
}

function mapTicket(row: Record<string, unknown>): SupportTicket {
  return {
    id: String(row.id),
    customerId: String(row.customer_id ?? row.customerId),
    orderId: row.order_id || row.orderId ? String(row.order_id ?? row.orderId) : null,
    trackingCode: String(row.tracking_code ?? row.trackingCode ?? ""),
    kind: (row.kind as SupportTicketKind) ?? "destek",
    status: (row.status as SupportTicket["status"]) ?? "acik",
    subject: String(row.subject ?? "Destek"),
    createdAt: String(row.created_at ?? row.createdAt),
    updatedAt: String(row.updated_at ?? row.updatedAt),
  };
}

function mapMessage(row: Record<string, unknown>): SupportMessage {
  return {
    id: String(row.id),
    ticketId: String(row.ticket_id ?? row.ticketId),
    sender: (row.sender as SupportSender) ?? "customer",
    senderId: row.sender_id || row.senderId ? String(row.sender_id ?? row.senderId) : null,
    body: String(row.body ?? ""),
    photoUrl: row.photo_url || row.photoUrl ? String(row.photo_url ?? row.photoUrl) : null,
    createdAt: String(row.created_at ?? row.createdAt),
  };
}

function mapNotification(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? row.userId),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    orderId: row.order_id || row.orderId ? String(row.order_id ?? row.orderId) : null,
    readAt: row.read_at || row.readAt ? String(row.read_at ?? row.readAt) : null,
    createdAt: String(row.created_at ?? row.createdAt),
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
    if (input.role === "customer") {
      for (const order of state.orders) {
        if (order.customerId === "demo-customer") order.customerId = user.id;
      }
    }
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
    vatRate: Number(row.vat_rate ?? row.vatRate ?? DEFAULT_PRICING.vatRate),
    routingProvider: (row.routing_provider ?? row.routingProvider ?? DEFAULT_PRICING.routingProvider) as RoutingProvider,
    routingUrl: String(row.routing_url ?? row.routingUrl ?? DEFAULT_PRICING.routingUrl),
    geocoder: (row.geocoder ?? DEFAULT_PRICING.geocoder) as Geocoder,
    commissionRate: Number(row.commission_rate ?? row.commissionRate ?? DEFAULT_PRICING.commissionRate),
    showcaseMode: Boolean(row.showcase_mode ?? row.showcaseMode ?? DEFAULT_PRICING.showcaseMode),
    deliveryTargetTiers: normalizeDeliveryTargetTiers(
      (row.delivery_target_tiers ?? row.deliveryTargetTiers) as PricingSettings["deliveryTargetTiers"] | undefined,
    ),
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
      vat_rate: next.vatRate,
      routing_provider: next.routingProvider,
      routing_url: next.routingUrl,
      geocoder: next.geocoder,
      commission_rate: next.commissionRate,
      showcase_mode: next.showcaseMode,
      delivery_target_tiers: next.deliveryTargetTiers,
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
        recipientPhone: input.recipientPhone.trim(),
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
        durationMin: input.durationMin ?? 0,
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
        cancelReason: "",
        cancelledBy: null,
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
      recipient_phone: input.recipientPhone.trim(),
      scheduled_at: input.scheduledAt,
      notes: input.notes.trim(),
      contact_phone: input.contactPhone,
      payment_method: input.paymentMethod,
      payment_status: "bekliyor",
      weight_kg: input.weightKg,
      distance_km: input.distanceKm,
      duration_min: input.durationMin ?? 0,
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
    mapped.netPriceTl = quote.netTl;
    mapped.vatTl = quote.vatTl;
    mapped.totalPriceTl = quote.grossTl;
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
  const { error } = await getSupabase()!.rpc("queue_order_confirmation", { p_order_id: order.id });
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
  const supabase = getSupabase()!;
  if (user.role === "courier") {
    const [open, mine] = await Promise.all([
      supabase.rpc("list_courier_open_jobs"),
      supabase.from("orders").select("*").eq("courier_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (open.error && mine.error) throw new Error(open.error.message || mine.error.message);
    const rows = [...((open.data as Record<string, unknown>[] | null) ?? []), ...((mine.data as Record<string, unknown>[] | null) ?? [])];
    const seen = new Set<string>();
    return rows
      .map(row => mapOrder(row))
      .filter(order => {
        if (seen.has(order.id)) return false;
        seen.add(order.id);
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(row => mapOrder(row as Record<string, unknown>));
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
    pushDemoNotification(state, order.customerId, order.id, order.status, order.durationMin);
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
    pushDemoNotification(state, order.customerId, order.id, order.status, order.durationMin);
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
    if (order.status === "assigned") {
      pushDemoNotification(state, order.customerId, order.id, order.status, order.durationMin);
    }
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
  const { error } = await getSupabase()!.rpc("set_user_role", { p_user_id: userId, p_role: role });
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
    return toPublicTrack({
      tracking_code: order.trackingCode,
      status: order.status,
      bolge: order.bolge,
      pickup_address: order.pickupAddress,
      dropoff_address: order.dropoffAddress,
      distance_km: order.distanceKm,
      duration_min: order.durationMin,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      delivered_at: order.deliveredAt,
      delivery_photo: order.deliveryPhoto,
    });
  }
  const { data, error } = await getSupabase()!.rpc("track_order_public", { p_code: trimmed });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return toPublicTrack(row as Record<string, unknown>);
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
    .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => onChange())
    .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, () => onChange())
    .on("postgres_changes", { event: "*", schema: "public", table: "in_app_notifications" }, () => onChange())
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

export async function cancelOwnOrder(orderId: string, reason: string): Promise<DeliveryOrder> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const order = state.orders.find(o => o.id === orderId);
    const me = state.sessionId;
    if (!order || !me) throw new Error("Sipariş bulunamadı");
    if (order.customerId !== me) throw new Error("Yalnızca kendi siparişinizi iptal edebilirsiniz");
    if (!canCustomerCancel(order.status)) throw new Error("Bu sipariş artık iptal edilemez");
    if (!canTransitionStatus(order.status, "cancelled")) throw new Error("Bu durum geçişi geçersiz");
    const stamp = nowIso();
    order.status = "cancelled";
    order.cancelledAt = stamp;
    order.cancelReason = reason.trim();
    order.cancelledBy = me;
    order.updatedAt = stamp;
    const ticket: SupportTicket = {
      id: crypto.randomUUID(),
      customerId: me,
      orderId: order.id,
      trackingCode: order.trackingCode,
      kind: "iptal",
      status: "acik",
      subject: ticketSubject("iptal", order.trackingCode),
      createdAt: stamp,
      updatedAt: stamp,
    };
    state.tickets.unshift(ticket);
    state.messages.push({
      id: crypto.randomUUID(),
      ticketId: ticket.id,
      sender: "customer",
      senderId: me,
      body: reason.trim() || "Müşteri iptal talebi.",
      photoUrl: null,
      createdAt: stamp,
    });
    pushDemoNotification(state, me, order.id, "cancelled");
    saveDemo(state);
    notifyDemo();
    return order;
  }
  const { data, error } = await getSupabase()!.rpc("cancel_own_order", {
    p_order_id: orderId,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
  return mapOrder(data as Record<string, unknown>);
}

export async function listSupportTickets(user: SessionUser): Promise<SupportTicket[]> {
  if (kuryelerMode === "demo") {
    const { tickets } = loadDemo();
    const list = user.role === "admin" ? tickets : tickets.filter(t => t.customerId === user.id);
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { data, error } = await getSupabase()!
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(row => mapTicket(row as Record<string, unknown>));
}

export async function listSupportMessages(ticketId: string): Promise<SupportMessage[]> {
  if (kuryelerMode === "demo") {
    return loadDemo()
      .messages.filter(m => m.ticketId === ticketId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  const { data, error } = await getSupabase()!
    .from("support_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(row => mapMessage(row as Record<string, unknown>));
}

export async function openSupportTicket(input: {
  kind: SupportTicketKind;
  body: string;
  orderId?: string | null;
  trackingCode?: string;
  photoUrl?: string | null;
}): Promise<SupportTicket> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const me = state.sessionId;
    if (!me) throw new Error("Giriş yapmalısınız");
    let order = input.orderId ? state.orders.find(o => o.id === input.orderId) : undefined;
    if (!order && input.trackingCode) {
      order = state.orders.find(
        o => o.trackingCode.toUpperCase() === input.trackingCode!.trim().toUpperCase() && o.customerId === me,
      );
    }
    if (input.orderId && order && order.customerId !== me) throw new Error("Bu sipariş size ait değil");
    const stamp = nowIso();
    const kind = input.kind;
    const ticket: SupportTicket = {
      id: crypto.randomUUID(),
      customerId: me,
      orderId: order?.id ?? null,
      trackingCode: order?.trackingCode ?? input.trackingCode?.trim().toUpperCase() ?? "",
      kind,
      status: "cevap_bekliyor",
      subject: ticketSubject(kind, order?.trackingCode ?? input.trackingCode),
      createdAt: stamp,
      updatedAt: stamp,
    };
    state.tickets.unshift(ticket);
    state.messages.push({
      id: crypto.randomUUID(),
      ticketId: ticket.id,
      sender: "customer",
      senderId: me,
      body: input.body.trim(),
      photoUrl: input.photoUrl ?? null,
      createdAt: stamp,
    });
    saveDemo(state);
    notifyDemo();
    return ticket;
  }
  const { data, error } = await getSupabase()!.rpc("open_support_ticket", {
    p_kind: input.kind,
    p_body: input.body,
    p_order_id: input.orderId ?? null,
    p_tracking_code: input.trackingCode ?? "",
    p_photo: input.photoUrl ?? null,
  });
  if (error) throw new Error(error.message);
  return mapTicket(data as Record<string, unknown>);
}

export async function postSupportMessage(input: {
  ticketId: string;
  body: string;
  photoUrl?: string | null;
  asBot?: boolean;
}): Promise<SupportMessage> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const me = state.users.find(u => u.id === state.sessionId);
    const ticket = state.tickets.find(t => t.id === input.ticketId);
    if (!me || !ticket) throw new Error("Kayıt bulunamadı");
    if (ticket.status === "kapali") throw new Error("Bu yazışma kapalı");
    const sender: SupportSender = input.asBot && me.role === "admin" ? "bot" : me.role === "admin" ? "admin" : "customer";
    if (sender === "customer" && ticket.customerId !== me.id) throw new Error("Yetkisiz");
    const stamp = nowIso();
    const message: SupportMessage = {
      id: crypto.randomUUID(),
      ticketId: ticket.id,
      sender,
      senderId: me.id,
      body: input.body.trim(),
      photoUrl: input.photoUrl ?? null,
      createdAt: stamp,
    };
    state.messages.push(message);
    ticket.updatedAt = stamp;
    ticket.status = sender === "customer" ? "cevap_bekliyor" : "yanitlandi";
    saveDemo(state);
    notifyDemo();
    return message;
  }
  const session = await getSession();
  const row = {
    ticket_id: input.ticketId,
    sender: session?.role === "admin" ? (input.asBot ? "bot" : "admin") : "customer",
    sender_id: session?.id ?? null,
    body: input.body.trim(),
    photo_url: input.photoUrl ?? null,
  };
  const { data, error } = await getSupabase()!.from("support_messages").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return mapMessage(data as Record<string, unknown>);
}

export async function listNotifications(userId: string): Promise<AppNotification[]> {
  if (kuryelerMode === "demo") {
    return loadDemo()
      .notifications.filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { data, error } = await getSupabase()!
    .from("in_app_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(row => mapNotification(row as Record<string, unknown>));
}

export async function markNotificationRead(id: string): Promise<void> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const note = state.notifications.find(n => n.id === id);
    if (note && !note.readAt) note.readAt = nowIso();
    saveDemo(state);
    notifyDemo();
    return;
  }
  const { error } = await getSupabase()!.from("in_app_notifications").update({ read_at: nowIso() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateOwnProfile(input: { fullName: string; phone: string }): Promise<void> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const user = state.users.find(u => u.id === state.sessionId);
    if (!user) throw new Error("Giriş yapmalısınız");
    user.fullName = input.fullName.trim();
    user.phone = input.phone.trim();
    saveDemo(state);
    notifyDemo();
    return;
  }
  const { error } = await getSupabase()!
    .from("profiles")
    .update({ full_name: input.fullName.trim(), phone: input.phone.trim() })
    .eq("id", (await getSession())?.id ?? "");
  if (error) throw new Error(error.message);
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (kuryelerMode === "demo") {
    throw new Error("Demo modunda e-posta gönderilmez. Yeni kayıt ile giriş yapın.");
  }
  const redirectTo = `${window.location.origin}/musteri/giris`;
  const { error } = await getSupabase()!.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) throw new Error(error.message);
}

export { nextCourierStatus };
