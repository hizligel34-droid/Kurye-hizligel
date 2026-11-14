export const INTERNAL_ROLES = [
  "central_manager",
  "admin",
  "accountant",
  "branch_manager",
  "branch_staff",
  "courier_lead",
  "courier",
] as const;

export type InternalRole = (typeof INTERNAL_ROLES)[number];

export const ROLE_LABELS: Record<InternalRole, string> = {
  central_manager: "Merkez müdür",
  admin: "Admin",
  accountant: "Muhasebe",
  branch_manager: "Şube yetkilisi",
  branch_staff: "Şube çalışanı",
  courier_lead: "Kurye yetkilisi",
  courier: "Kurye",
};

export const ROLE_NOTES: Record<InternalRole, string> = {
  central_manager: "On şube ile merkez şube arasındaki kuryeyi ve iç muhasebeyi görür. Fiyat listesini admin ile birlikte düzenler.",
  admin: "Fiyat listesini görür ve düzenler. Muhasebe defteri bu role kapalıdır.",
  accountant: "İç muhasebeyi görür ve tahsilatı kapatır. Fiyat listesini göremez ve değiştiremez.",
  branch_manager: "Kendi şubesinin merkez kuryesini onaylar. Defterde yalnız kendi şubesine kesilen bedeller vardır.",
  branch_staff: "Kendi şubesi için merkez şube kuryesi açar. Fiyat listesi ve muhasebe kapalıdır.",
  courier_lead: "Kurye atar ve kurye operasyon sohbetini kullanır. Fiyat listesi ve muhasebe kapalıdır.",
  courier: "Yalnızca kendine atanan işi ilerletir. Kazanç ekranında yalnız kendi ödemesi görünür.",
};

export type Branch = {
  id: string;
  name: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
};

export const BRANCHES: readonly Branch[] = [
  { id: "kadikoy", name: "Kadıköy", district: "Kadıköy", address: "Caferağa, Moda Caddesi No:14", latitude: 40.9903, longitude: 29.0291 },
  { id: "besiktas", name: "Beşiktaş", district: "Beşiktaş", address: "Sinanpaşa, Barbaros Bulvarı No:52", latitude: 41.0428, longitude: 29.0072 },
  { id: "sisli", name: "Şişli", district: "Şişli", address: "Merkez, Halaskargazi Caddesi No:88", latitude: 41.0602, longitude: 28.9871 },
  { id: "bakirkoy", name: "Bakırköy", district: "Bakırköy", address: "Zeytinlik, İstanbul Caddesi No:21", latitude: 40.9796, longitude: 28.8724 },
  { id: "uskudar", name: "Üsküdar", district: "Üsküdar", address: "Mimar Sinan, Uncular Caddesi No:9", latitude: 41.0256, longitude: 29.015 },
  { id: "atasehir", name: "Ataşehir", district: "Ataşehir", address: "Barbaros, Atatürk Caddesi No:40", latitude: 40.9923, longitude: 29.1244 },
  { id: "beyoglu", name: "Beyoğlu", district: "Beyoğlu", address: "Hüseyinağa, İstiklal Caddesi No:112", latitude: 41.0369, longitude: 28.9775 },
  { id: "maltepe", name: "Maltepe", district: "Maltepe", address: "Cevizli, Bağdat Caddesi No:270", latitude: 40.9352, longitude: 29.1306 },
  { id: "pendik", name: "Pendik", district: "Pendik", address: "Batı, Ankara Caddesi No:16", latitude: 40.8775, longitude: 29.2332 },
  { id: "basaksehir", name: "Başakşehir", district: "Başakşehir", address: "Başakşehir, Atatürk Bulvarı No:5", latitude: 41.0934, longitude: 28.8021 },
];

export const BRANCH_LIMIT = 10;

export const CENTRAL_BRANCH: Branch = {
  id: "merkez",
  name: "Merkez şube",
  district: "Şişli",
  address: "Büyükdere Caddesi No:1",
  latitude: 41.0782,
  longitude: 28.987,
};

export type JobType = "hub";
export type HubDirection = "to_central" | "from_central";
export type JobStatus = "requested" | "approved" | "assigned" | "picked_up" | "delivered" | "cancelled";
export type LedgerKind = "branch_charge" | "courier_payout";
export type RoomKind = "hq" | "dispatch" | "branch_pair" | "hub";

export type Tariff = {
  transferOpeningFeeTl: number;
  transferPerKmTl: number;
  courierPayoutOpeningTl: number;
  courierPayoutPerKmTl: number;
};

export const DEFAULT_TARIFF: Tariff = {
  transferOpeningFeeTl: 150,
  transferPerKmTl: 40,
  courierPayoutOpeningTl: 70,
  courierPayoutPerKmTl: 18,
};

export const TARIFF_FIELDS: { key: keyof Tariff; label: string; hint: string }[] = [
  { key: "transferOpeningFeeTl", label: "Şube bedeli açılış", hint: "Merkez hattındaki her işte şubeye yazılır" },
  { key: "transferPerKmTl", label: "Şube bedeli km", hint: "Şube ile merkez şube arasındaki her kilometre" },
  { key: "courierPayoutOpeningTl", label: "Kurye ödemesi açılış", hint: "Kurye çalışanına yazılan taban ödeme" },
  { key: "courierPayoutPerKmTl", label: "Kurye ödemesi km", hint: "Kurye çalışanının kilometre ödemesi" },
];

export const STATUS_LABELS: Record<JobStatus, string> = {
  requested: "Talep",
  approved: "Onaylandı",
  assigned: "Kurye atandı",
  picked_up: "Alındı",
  delivered: "Teslim edildi",
  cancelled: "İptal",
};

export type Staff = {
  id: string;
  name: string;
  role: InternalRole;
  branchId: string | null;
};

export type MoneyQuote = {
  distanceKm: number;
  branchChargeTl: number;
  courierPayoutTl: number;
};

export type PriceRow = {
  branchId: string;
  distanceKm: number;
  chargeTl: number;
  payoutTl: number;
};

export type JobRecord = {
  id: string;
  code: string;
  type: JobType;
  direction: HubDirection;
  storeBranchId: string;
  fromBranchId: string;
  toBranchId: string;
  destinationLabel: string;
  product: string;
  quantity: number;
  weightKg: number;
  distanceKm: number;
  status: JobStatus;
  requestedBy: string;
  approvedBy: string | null;
  courierId: string | null;
  branchChargeTl: number | null;
  courierPayoutTl: number | null;
  estimateChargeTl: number;
  estimatePayoutTl: number;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type LedgerEntry = {
  id: string;
  jobId: string;
  jobCode: string;
  kind: LedgerKind;
  branchId: string;
  courierId: string | null;
  amountTl: number;
  description: string;
  settled: boolean;
  createdAt: string;
};

export function branchById(branchId: string) {
  return BRANCHES.find(branch => branch.id === branchId);
}

export function locationById(branchId: string) {
  if (branchId === CENTRAL_BRANCH.id) return CENTRAL_BRANCH;
  return branchById(branchId);
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function drivingDistanceKm(from: Branch, to: Branch) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const crowKm = 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(haversine)));
  return Math.max(1, Math.round(crowKm * 1.35 * 10) / 10);
}

export function priceKm(openingFeeTl: number, perKmTl: number, distanceKm: number) {
  return roundMoney(openingFeeTl + perKmTl * distanceKm);
}

export function quoteTransfer(tariff: Tariff, from: Branch, to: Branch): MoneyQuote {
  if (from.id === to.id) throw new Error("Transfer aynı şubeye yapılamaz");
  const distanceKm = drivingDistanceKm(from, to);
  return {
    distanceKm,
    branchChargeTl: priceKm(tariff.transferOpeningFeeTl, tariff.transferPerKmTl, distanceKm),
    courierPayoutTl: priceKm(tariff.courierPayoutOpeningTl, tariff.courierPayoutPerKmTl, distanceKm),
  };
}

export function hubPrice(tariff: Tariff, branch: Branch): PriceRow {
  const distanceKm = drivingDistanceKm(branch, CENTRAL_BRANCH);
  return {
    branchId: branch.id,
    distanceKm,
    chargeTl: priceKm(tariff.transferOpeningFeeTl, tariff.transferPerKmTl, distanceKm),
    payoutTl: priceKm(tariff.courierPayoutOpeningTl, tariff.courierPayoutPerKmTl, distanceKm),
  };
}

export function buildPriceList(tariff: Tariff) {
  return BRANCHES.map(branch => hubPrice(tariff, branch));
}

export function assertMoney(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0 || value > 20000) throw new Error(`${label} 0 ile 20000 TL arasında olmalı`);
  return roundMoney(value);
}

export function assertTariff(input: Tariff): Tariff {
  const next = {} as Tariff;
  for (const field of TARIFF_FIELDS) {
    const value = input[field.key];
    if (!Number.isFinite(value) || value < 0 || value > 5000) {
      throw new Error(`${field.label} 0 ile 5000 TL arasında olmalı`);
    }
    next[field.key] = roundMoney(value);
  }
  return next;
}

export function canEditTariff(role: InternalRole) {
  return role === "central_manager" || role === "admin";
}

export function canViewTariff(role: InternalRole) {
  return canEditTariff(role);
}

export function canViewLedger(role: InternalRole) {
  return role === "central_manager" || role === "accountant" || role === "branch_manager" || role === "courier";
}

export function canSettleLedger(role: InternalRole) {
  return role === "central_manager" || role === "accountant";
}

export function ledgerTitle(role: InternalRole) {
  if (role === "courier") return "Kazancım";
  if (role === "branch_manager") return "Şube muhasebesi";
  return "İç muhasebe";
}

export function canCreateForBranch(actor: Staff, branchId: string) {
  if (!branchById(branchId)) return false;
  if (actor.role === "central_manager") return true;
  return (actor.role === "branch_manager" || actor.role === "branch_staff") && actor.branchId === branchId;
}

export function canSeeJob(actor: Staff, job: JobRecord) {
  if (actor.role === "central_manager" || actor.role === "admin" || actor.role === "accountant" || actor.role === "courier_lead") return true;
  if (actor.role === "courier") return job.courierId === actor.id;
  if (actor.role === "branch_manager" || actor.role === "branch_staff") {
    return job.fromBranchId === actor.branchId || job.toBranchId === actor.branchId;
  }
  return false;
}

export function visibleCharge(actor: Staff, job: JobRecord) {
  const involved =
    (actor.role === "branch_manager" || actor.role === "branch_staff") &&
    (actor.branchId === job.fromBranchId || actor.branchId === job.toBranchId);
  const full = actor.role === "central_manager" || actor.role === "admin" || actor.role === "accountant";
  if (!full && !involved) return null;
  if (job.branchChargeTl != null && job.status !== "requested" && job.status !== "cancelled") return job.branchChargeTl;
  return job.estimateChargeTl;
}

export function visiblePayout(actor: Staff, job: JobRecord) {
  const full = actor.role === "central_manager" || actor.role === "admin" || actor.role === "accountant";
  const lead = actor.role === "courier_lead";
  const ownCourier = actor.role === "courier" && job.courierId === actor.id;
  if (!full && !lead && !ownCourier) return null;
  if (job.courierPayoutTl != null && job.status !== "requested" && job.status !== "cancelled") return job.courierPayoutTl;
  return job.estimatePayoutTl;
}

export function filterLedger(actor: Staff, entries: LedgerEntry[]) {
  if (actor.role === "central_manager" || actor.role === "accountant") return entries;
  if (actor.role === "branch_manager") {
    return entries.filter(entry => entry.kind === "branch_charge" && entry.branchId === actor.branchId);
  }
  if (actor.role === "courier") {
    return entries.filter(entry => entry.kind === "courier_payout" && entry.courierId === actor.id);
  }
  return [];
}

function managesStore(actor: Staff, job: JobRecord) {
  return actor.role === "branch_manager" && actor.branchId === job.storeBranchId;
}

export function canApprove(actor: Staff, job: JobRecord) {
  if (job.status !== "requested") return false;
  if (actor.role === "central_manager") return true;
  return managesStore(actor, job);
}

export function canAssign(actor: Staff, job: JobRecord) {
  if (job.status !== "approved" && job.status !== "assigned") return false;
  if (actor.role === "central_manager" || actor.role === "courier_lead") return true;
  return managesStore(actor, job);
}

export function canAdvance(actor: Staff, job: JobRecord, next: "picked_up" | "delivered") {
  const expected = next === "picked_up" ? "assigned" : "picked_up";
  if (job.status !== expected) return false;
  if (actor.role === "central_manager" || actor.role === "courier_lead") return true;
  if (actor.role === "courier" && job.courierId === actor.id) return true;
  return managesStore(actor, job);
}

export function canCancel(actor: Staff, job: JobRecord) {
  if (job.status === "delivered" || job.status === "cancelled") return false;
  if (actor.role === "central_manager") return true;
  if (managesStore(actor, job)) return true;
  return actor.id === job.requestedBy && job.status === "requested";
}

export function pairRoomId(leftBranchId: string, rightBranchId: string) {
  const [first, second] = [leftBranchId, rightBranchId].sort();
  return `pair:${first}:${second}`;
}

export function hubRoomId(branchId: string) {
  return `hub:${branchId}`;
}

export function roomTitle(roomId: string) {
  if (roomId === "hq") return "Merkez duyuru";
  if (roomId === "dispatch") return "Kurye operasyon";
  if (roomId.startsWith("hub:")) return `${branchById(roomId.slice(4))?.name ?? "Şube"} ↔ Merkez şube`;
  if (!roomId.startsWith("pair:")) return "Sohbet";
  const [, leftId, rightId] = roomId.split(":");
  const left = branchById(leftId ?? "")?.name ?? leftId;
  const right = branchById(rightId ?? "")?.name ?? rightId;
  return `${left} ↔ ${right}`;
}

export function roomKind(roomId: string): RoomKind | null {
  if (roomId === "hq") return "hq";
  if (roomId === "dispatch") return "dispatch";
  if (roomId.startsWith("hub:")) return branchById(roomId.slice(4)) ? "hub" : null;
  if (!roomId.startsWith("pair:")) return null;
  const [, leftId, rightId] = roomId.split(":");
  if (!leftId || !rightId || leftId === rightId || !branchById(leftId) || !branchById(rightId)) return null;
  return "branch_pair";
}

export function roomAccess(actor: Staff, roomId: string) {
  const kind = roomKind(roomId);
  if (!kind) return { read: false, post: false };
  if (actor.role === "central_manager" || actor.role === "admin") return { read: true, post: true };
  if (kind === "hub") {
    const branchId = roomId.slice(4);
    if (actor.role === "accountant" || actor.role === "courier_lead") return { read: true, post: false };
    if ((actor.role === "branch_manager" || actor.role === "branch_staff") && actor.branchId === branchId) return { read: true, post: true };
    return { read: false, post: false };
  }
  if (kind === "hq") {
    if (actor.role === "branch_manager" || actor.role === "courier_lead") return { read: true, post: true };
    return { read: true, post: false };
  }
  if (kind === "dispatch") {
    if (actor.role === "accountant") return { read: false, post: false };
    return { read: true, post: true };
  }
  const [, leftId, rightId] = roomId.split(":");
  if (actor.role === "accountant") return { read: true, post: false };
  if (
    (actor.role === "branch_manager" || actor.role === "branch_staff") &&
    actor.branchId &&
    (actor.branchId === leftId || actor.branchId === rightId)
  ) {
    return { read: true, post: true };
  }
  return { read: false, post: false };
}

export function cleanText(value: string, max: number) {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
