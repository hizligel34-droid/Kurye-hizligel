import {
  calculateDeliveryPrice,
  canTransitionStatus,
  DEFAULT_PRICING,
  generateTrackingCode,
  isActiveOrder,
  nextCourierStatus,
  type DashboardStats,
  type DeliveryOrder,
  type OrderStatus,
  type PackageType,
  type PricingSettings,
  type Profile,
  type UserRole,
} from "@shared/kuryeler";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const DEMO_KEY = "kuryeler.tr.demo.v1";

export const DEMO_ACCOUNTS = [
  {
    email: "musteri@kuryeler.tr",
    password: "KuryelerMusteri1!",
    role: "customer" as const,
    fullName: "Ayşe Müşteri",
    phone: "05551110003",
    id: "demo-customer",
  },
  {
    email: "kurye@kuryeler.tr",
    password: "KuryelerKurye1!",
    role: "courier" as const,
    fullName: "Mehmet Kurye",
    phone: "05551110002",
    id: "demo-courier",
  },
  {
    email: "yonetici@kuryeler.tr",
    password: "KuryelerYonetici1!",
    role: "admin" as const,
    fullName: "Şerif Yönetici",
    phone: "05551110001",
    id: "demo-admin",
  },
] as const;

export type SessionUser = Profile;

export type CreateOrderInput = {
  pickupDistrict: string;
  pickupNeighborhood: string;
  pickupStreet: string;
  pickupNote: string;
  dropoffDistrict: string;
  dropoffNeighborhood: string;
  dropoffStreet: string;
  dropoffNote: string;
  packageType: PackageType;
  notes: string;
  contactPhone: string;
};

export type PublicTrack = {
  trackingCode: string;
  status: OrderStatus;
  pickupDistrict: string;
  dropoffDistrict: string;
  packageType: PackageType;
  createdAt: string;
  updatedAt: string;
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
};

function nowIso() {
  return new Date().toISOString();
}

function composeAddress(district: string, neighborhood: string, street: string) {
  return [neighborhood, street, district, "İstanbul"].filter(Boolean).join(", ");
}

function seedDemo(): DemoState {
  const createdAt = nowIso();
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
  const customerId = "demo-customer";
  const courierId = "demo-courier";
  const pending = calculateDeliveryPrice({
    pickupDistrict: "Kadıköy",
    dropoffDistrict: "Beşiktaş",
    packageType: "evrak",
    distanceKm: 9.5,
  });
  const enRoute = calculateDeliveryPrice({
    pickupDistrict: "Kadıköy",
    dropoffDistrict: "Ataşehir",
    packageType: "orta",
    distanceKm: 7.2,
  });
  const orders: DeliveryOrder[] = [
    {
      id: "demo-order-1",
      trackingCode: "KY-DEMO0001",
      customerId,
      courierId: null,
      status: "pending",
      pickupAddress: "Caferağa, Moda Cad. No 12, Kadıköy, İstanbul",
      pickupDistrict: "Kadıköy",
      pickupNeighborhood: "Caferağa",
      pickupStreet: "Moda Caddesi",
      pickupNote: "Kapıcıya bırakılabilir",
      dropoffAddress: "Levent, Büyükdere Cad. No 120, Beşiktaş, İstanbul",
      dropoffDistrict: "Beşiktaş",
      dropoffNeighborhood: "Levent",
      dropoffStreet: "Büyükdere Caddesi",
      dropoffNote: "Resepsiyon",
      packageType: "evrak",
      notes: "Sözleşme evrakı",
      contactPhone: "05551110003",
      distanceKm: pending.distanceKm,
      totalPriceTl: pending.totalTl,
      courierEarningTl: pending.courierEarningTl,
      companyRevenueTl: pending.companyRevenueTl,
      createdAt,
      updatedAt: createdAt,
      assignedAt: null,
      pickedUpAt: null,
      deliveredAt: null,
      cancelledAt: null,
    },
    {
      id: "demo-order-2",
      trackingCode: "KY-DEMO0002",
      customerId,
      courierId,
      status: "en_route",
      pickupAddress: "Osmanağa, Bahariye Cad. No 45, Kadıköy, İstanbul",
      pickupDistrict: "Kadıköy",
      pickupNeighborhood: "Osmanağa",
      pickupStreet: "Bahariye Caddesi",
      pickupNote: "",
      dropoffAddress: "Atatürk, Ataşehir Bulvarı, Ataşehir, İstanbul",
      dropoffDistrict: "Ataşehir",
      dropoffNeighborhood: "Atatürk",
      dropoffStreet: "Ataşehir Bulvarı",
      dropoffNote: "Daire 8",
      packageType: "orta",
      notes: "Hediyelik kutu",
      contactPhone: "05551110003",
      distanceKm: enRoute.distanceKm,
      totalPriceTl: enRoute.totalTl,
      courierEarningTl: enRoute.courierEarningTl,
      companyRevenueTl: enRoute.companyRevenueTl,
      createdAt,
      updatedAt: createdAt,
      assignedAt: createdAt,
      pickedUpAt: createdAt,
      deliveredAt: null,
      cancelledAt: null,
    },
  ];
  return { sessionId: null, users, orders, pricing: { ...DEFAULT_PRICING } };
}

function loadDemo(): DemoState {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (!raw) {
      const seeded = seedDemo();
      localStorage.setItem(DEMO_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as DemoState;
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

function mapOrder(row: Record<string, unknown>): DeliveryOrder {
  return {
    id: String(row.id),
    trackingCode: String(row.tracking_code),
    customerId: String(row.customer_id),
    courierId: row.courier_id ? String(row.courier_id) : null,
    status: row.status as OrderStatus,
    pickupAddress: String(row.pickup_address),
    pickupDistrict: String(row.pickup_district),
    pickupNeighborhood: String(row.pickup_neighborhood ?? ""),
    pickupStreet: String(row.pickup_street ?? ""),
    pickupNote: String(row.pickup_note ?? ""),
    dropoffAddress: String(row.dropoff_address),
    dropoffDistrict: String(row.dropoff_district),
    dropoffNeighborhood: String(row.dropoff_neighborhood ?? ""),
    dropoffStreet: String(row.dropoff_street ?? ""),
    dropoffNote: String(row.dropoff_note ?? ""),
    packageType: row.package_type as PackageType,
    notes: String(row.notes ?? ""),
    contactPhone: String(row.contact_phone),
    distanceKm: Number(row.distance_km),
    totalPriceTl: Number(row.total_price_tl),
    courierEarningTl: Number(row.courier_earning_tl),
    companyRevenueTl: Number(row.company_revenue_tl),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    assignedAt: row.assigned_at ? String(row.assigned_at) : null,
    pickedUpAt: row.picked_up_at ? String(row.picked_up_at) : null,
    deliveredAt: row.delivered_at ? String(row.delivered_at) : null,
    cancelledAt: row.cancelled_at ? String(row.cancelled_at) : null,
  };
}

function mapPricing(row: Record<string, unknown>): PricingSettings {
  return {
    baseFeeTl: Number(row.base_fee_tl),
    perKmTl: Number(row.per_km_tl),
    commissionRate: Number(row.commission_rate),
    useZones: Boolean(row.use_zones),
    crossSideSurchargeTl: Number(row.cross_side_surcharge_tl),
    packageFees: {
      evrak: Number(row.package_evrak_tl),
      kucuk: Number(row.package_kucuk_tl),
      orta: Number(row.package_orta_tl),
      buyuk: Number(row.package_buyuk_tl),
      gida: Number(row.package_gida_tl),
    },
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
    todayRevenueTl: today.reduce((sum, o) => sum + o.companyRevenueTl, 0),
    activeCouriers: couriersOnline,
    pendingOrders: orders.filter(o => o.status === "pending").length,
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

export async function getPricing(): Promise<PricingSettings> {
  if (kuryelerMode === "demo") return loadDemo().pricing;
  const { data, error } = await getSupabase()!.from("pricing_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  return mapPricing(data as Record<string, unknown>);
}

export async function updatePricing(pricing: PricingSettings): Promise<PricingSettings> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    state.pricing = pricing;
    saveDemo(state);
    notifyDemo();
    return pricing;
  }
  const { data, error } = await getSupabase()!
    .from("pricing_settings")
    .update({
      base_fee_tl: pricing.baseFeeTl,
      per_km_tl: pricing.perKmTl,
      commission_rate: pricing.commissionRate,
      use_zones: pricing.useZones,
      cross_side_surcharge_tl: pricing.crossSideSurchargeTl,
      package_evrak_tl: pricing.packageFees.evrak,
      package_kucuk_tl: pricing.packageFees.kucuk,
      package_orta_tl: pricing.packageFees.orta,
      package_buyuk_tl: pricing.packageFees.buyuk,
      package_gida_tl: pricing.packageFees.gida,
    })
    .eq("id", 1)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapPricing(data as Record<string, unknown>);
}

export function estimateOrder(input: CreateOrderInput, pricing: PricingSettings) {
  return calculateDeliveryPrice({
    pickupDistrict: input.pickupDistrict,
    dropoffDistrict: input.dropoffDistrict,
    packageType: input.packageType,
    pricing,
  });
}

export async function createOrder(customerId: string, input: CreateOrderInput): Promise<DeliveryOrder> {
  const pricing = await getPricing();
  const quote = estimateOrder(input, pricing);
  const pickupAddress = composeAddress(input.pickupDistrict, input.pickupNeighborhood, input.pickupStreet);
  const dropoffAddress = composeAddress(input.dropoffDistrict, input.dropoffNeighborhood, input.dropoffStreet);
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const createdAt = nowIso();
    const order: DeliveryOrder = {
      id: crypto.randomUUID(),
      trackingCode: generateTrackingCode(),
      customerId,
      courierId: null,
      status: "pending",
      pickupAddress,
      pickupDistrict: input.pickupDistrict,
      pickupNeighborhood: input.pickupNeighborhood,
      pickupStreet: input.pickupStreet,
      pickupNote: input.pickupNote,
      dropoffAddress,
      dropoffDistrict: input.dropoffDistrict,
      dropoffNeighborhood: input.dropoffNeighborhood,
      dropoffStreet: input.dropoffStreet,
      dropoffNote: input.dropoffNote,
      packageType: input.packageType,
      notes: input.notes,
      contactPhone: input.contactPhone,
      distanceKm: quote.distanceKm,
      totalPriceTl: quote.totalTl,
      courierEarningTl: quote.courierEarningTl,
      companyRevenueTl: quote.companyRevenueTl,
      createdAt,
      updatedAt: createdAt,
      assignedAt: null,
      pickedUpAt: null,
      deliveredAt: null,
      cancelledAt: null,
    };
    state.orders.unshift(order);
    saveDemo(state);
    notifyDemo();
    return order;
  }
  const { data, error } = await getSupabase()!
    .from("orders")
    .insert({
      tracking_code: generateTrackingCode(),
      customer_id: customerId,
      status: "pending",
      pickup_address: pickupAddress,
      pickup_district: input.pickupDistrict,
      pickup_neighborhood: input.pickupNeighborhood,
      pickup_street: input.pickupStreet,
      pickup_note: input.pickupNote,
      dropoff_address: dropoffAddress,
      dropoff_district: input.dropoffDistrict,
      dropoff_neighborhood: input.dropoffNeighborhood,
      dropoff_street: input.dropoffStreet,
      dropoff_note: input.dropoffNote,
      package_type: input.packageType,
      notes: input.notes,
      contact_phone: input.contactPhone,
      distance_km: quote.distanceKm,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapOrder(data as Record<string, unknown>);
}

export async function listOrdersFor(user: SessionUser): Promise<DeliveryOrder[]> {
  if (kuryelerMode === "demo") {
    const { orders } = loadDemo();
    if (user.role === "admin") return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (user.role === "courier") {
      return orders
        .filter(o => o.courierId === user.id || o.status === "pending")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return orders.filter(o => o.customerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const query = getSupabase()!.from("orders").select("*").order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(row => mapOrder(row as Record<string, unknown>));
}

export async function acceptOrder(orderId: string, courierId: string): Promise<DeliveryOrder> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const order = state.orders.find(o => o.id === orderId);
    if (!order || order.status !== "pending") throw new Error("İş artık müsait değil");
    order.courierId = courierId;
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

export async function advanceStatus(orderId: string, status: OrderStatus): Promise<DeliveryOrder> {
  if (kuryelerMode === "demo") {
    const state = loadDemo();
    const order = state.orders.find(o => o.id === orderId);
    if (!order) throw new Error("Sipariş bulunamadı");
    if (!canTransitionStatus(order.status, status)) throw new Error("Bu durum geçişi geçersiz");
    const stamp = nowIso();
    order.status = status;
    order.updatedAt = stamp;
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
      pickupDistrict: order.pickupDistrict,
      dropoffDistrict: order.dropoffDistrict,
      packageType: order.packageType,
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
    pickupDistrict: row.pickup_district,
    dropoffDistrict: row.dropoff_district,
    packageType: row.package_type,
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
    .subscribe();
  return () => {
    void getSupabase()!.removeChannel(channel);
  };
}

export function dailyEarnings(orders: DeliveryOrder[], courierId: string) {
  const start = todayStartIso();
  const mine = orders.filter(o => o.courierId === courierId && o.createdAt >= start);
  const delivered = mine.filter(o => o.status === "delivered");
  return {
    deliveredCount: delivered.length,
    earningTl: delivered.reduce((sum, o) => sum + o.courierEarningTl, 0),
    activeCount: mine.filter(o => isActiveOrder(o.status)).length,
  };
}

export { nextCourierStatus };
