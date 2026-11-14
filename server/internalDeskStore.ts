import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  BRANCHES,
  BRANCH_LIMIT,
  CENTRAL_BRANCH,
  DEFAULT_TARIFF,
  ROLE_LABELS,
  type HubDirection,
  type InternalRole,
  type JobRecord,
  type LedgerEntry,
  type PriceRow,
  type Staff,
  type Tariff,
  assertMoney,
  assertTariff,
  branchById,
  buildPriceList,
  canAdvance,
  canApprove,
  canAssign,
  canCancel,
  canCreateForBranch,
  canEditTariff,
  canSeeJob,
  canSettleLedger,
  canViewLedger,
  canViewTariff,
  cleanText,
  filterLedger,
  hubRoomId,
  ledgerTitle,
  locationById,
  pairRoomId,
  roomAccess,
  roomKind,
  roomTitle,
  visibleCharge,
  visiblePayout,
} from "../shared/internalDesk";

export class DeskError extends Error {
  constructor(
    message: string,
    readonly status: "FORBIDDEN" | "BAD_REQUEST" = "BAD_REQUEST",
  ) {
    super(message);
  }
}

type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

type DeskState = {
  staff: Staff[];
  pins: Map<string, string>;
  failures: Map<string, number>;
  sessions: Map<string, string>;
  tariff: Tariff;
  prices: PriceRow[];
  tariffUpdatedBy: string | null;
  tariffUpdatedAt: string;
  jobs: JobRecord[];
  ledger: LedgerEntry[];
  messages: ChatMessage[];
  transferSeq: number;
  ids: number;
};

const MANAGER_ID = "merkez-mudur";

function pinFor(staffId: string) {
  if (staffId === MANAGER_ID) {
    const fromEnv = process.env.INTERNAL_DESK_MANAGER_PIN?.replace(/\D/g, "").slice(0, 6);
    return fromEnv && fromEnv.length >= 4 ? fromEnv : "4812";
  }
  const hash = createHash("sha256").update(`kurye-ic-masa:${staffId}`).digest("hex");
  return String(1000 + (parseInt(hash.slice(0, 6), 16) % 9000));
}

function buildStaff(): Staff[] {
  const people: Staff[] = [
    { id: MANAGER_ID, name: "Merkez müdür", role: "central_manager", branchId: null },
    { id: "admin", name: "Admin", role: "admin", branchId: null },
    { id: "muhasebe", name: "Muhasebe", role: "accountant", branchId: null },
    { id: "kurye-yetkili", name: "Kurye yetkilisi", role: "courier_lead", branchId: null },
    { id: "kurye-1", name: "Kurye çalışanı 1", role: "courier", branchId: "kadikoy" },
    { id: "kurye-2", name: "Kurye çalışanı 2", role: "courier", branchId: "sisli" },
    { id: "kurye-3", name: "Kurye çalışanı 3", role: "courier", branchId: "bakirkoy" },
    { id: "kurye-4", name: "Kurye çalışanı 4", role: "courier", branchId: "pendik" },
  ];
  for (const branch of BRANCHES) {
    people.push(
      { id: `${branch.id}-yetkili`, name: `${branch.name} şube yetkilisi`, role: "branch_manager", branchId: branch.id },
      { id: `${branch.id}-calisan`, name: `${branch.name} şube çalışanı`, role: "branch_staff", branchId: branch.id },
    );
  }
  return people;
}

function sameSecret(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function seedState(now: string): DeskState {
  if (BRANCHES.length !== BRANCH_LIMIT) throw new Error("Şube sayısı 10 olmalıdır");
  const staff = buildStaff();
  const pins = new Map(staff.map(person => [person.id, pinFor(person.id)]));
  const tariff = { ...DEFAULT_TARIFF };
  const prices = buildPriceList(tariff);
  const kadikoy = prices.find(row => row.branchId === "kadikoy")!;
  const besiktas = prices.find(row => row.branchId === "besiktas")!;
  const bakirkoy = prices.find(row => row.branchId === "bakirkoy")!;
  const jobs: JobRecord[] = [
    {
      id: "job-1",
      code: "MK-2401",
      type: "hub",
      direction: "to_central",
      storeBranchId: "kadikoy",
      fromBranchId: "kadikoy",
      toBranchId: CENTRAL_BRANCH.id,
      destinationLabel: "Merkez şube",
      product: "Depo sevkiyatı — kutu kolonya",
      quantity: 12,
      weightKg: 8,
      distanceKm: kadikoy.distanceKm,
      status: "delivered",
      requestedBy: "kadikoy-calisan",
      approvedBy: "kadikoy-yetkili",
      courierId: "kurye-1",
      branchChargeTl: kadikoy.chargeTl,
      courierPayoutTl: kadikoy.payoutTl,
      estimateChargeTl: kadikoy.chargeTl,
      estimatePayoutTl: kadikoy.payoutTl,
      note: "Reyon fazlası merkez depoya dönüyor",
      createdAt: "2026-11-13T07:10:00.000Z",
      updatedAt: "2026-11-13T09:40:00.000Z",
    },
    {
      id: "job-2",
      code: "MK-2402",
      type: "hub",
      direction: "from_central",
      storeBranchId: "besiktas",
      fromBranchId: CENTRAL_BRANCH.id,
      toBranchId: "besiktas",
      destinationLabel: "Beşiktaş şubesi",
      product: "Vitrin ayakkabı çifti",
      quantity: 4,
      weightKg: 3,
      distanceKm: besiktas.distanceKm,
      status: "requested",
      requestedBy: "besiktas-calisan",
      approvedBy: null,
      courierId: null,
      branchChargeTl: null,
      courierPayoutTl: null,
      estimateChargeTl: besiktas.chargeTl,
      estimatePayoutTl: besiktas.payoutTl,
      note: "",
      createdAt: "2026-11-14T05:05:00.000Z",
      updatedAt: "2026-11-14T05:05:00.000Z",
    },
    {
      id: "job-3",
      code: "MK-2403",
      type: "hub",
      direction: "to_central",
      storeBranchId: "bakirkoy",
      fromBranchId: "bakirkoy",
      toBranchId: CENTRAL_BRANCH.id,
      destinationLabel: "Merkez şube",
      product: "İade kolisi",
      quantity: 2,
      weightKg: 6,
      distanceKm: bakirkoy.distanceKm,
      status: "assigned",
      requestedBy: "bakirkoy-yetkili",
      approvedBy: "bakirkoy-yetkili",
      courierId: "kurye-3",
      branchChargeTl: bakirkoy.chargeTl,
      courierPayoutTl: bakirkoy.payoutTl,
      estimateChargeTl: bakirkoy.chargeTl,
      estimatePayoutTl: bakirkoy.payoutTl,
      note: "Merkez sayım için",
      createdAt: "2026-11-14T04:20:00.000Z",
      updatedAt: "2026-11-14T04:45:00.000Z",
    },
  ];
  const ledger: LedgerEntry[] = [
    {
      id: "ldg-1",
      jobId: "job-1",
      jobCode: "MK-2401",
      kind: "branch_charge",
      branchId: "kadikoy",
      courierId: null,
      amountTl: kadikoy.chargeTl,
      description: "Kadıköy → Merkez şube kurye bedeli",
      settled: false,
      createdAt: "2026-11-13T09:40:00.000Z",
    },
    {
      id: "ldg-2",
      jobId: "job-1",
      jobCode: "MK-2401",
      kind: "courier_payout",
      branchId: "kadikoy",
      courierId: "kurye-1",
      amountTl: kadikoy.payoutTl,
      description: "MK-2401 kurye ödemesi",
      settled: false,
      createdAt: "2026-11-13T09:40:00.000Z",
    },
  ];
  const messages: ChatMessage[] = [
    {
      id: "msg-1",
      roomId: "hq",
      senderId: MANAGER_ID,
      body: "Kurye, on mağaza şubesi ile merkez şube arasında çalışır. Fiyat listesini yalnız merkez müdür ve admin görür.",
      createdAt: "2026-11-13T06:00:00.000Z",
    },
    {
      id: "msg-2",
      roomId: pairRoomId("kadikoy", "atasehir"),
      senderId: "kadikoy-calisan",
      body: "Kolonya kolileri yola çıktı. Teslimde ürün adedini birlikte sayalım.",
      createdAt: "2026-11-13T08:15:00.000Z",
    },
    {
      id: "msg-3",
      roomId: "dispatch",
      senderId: "kurye-yetkili",
      body: "Bakırköy çıkışlı merkez sevki kurye çalışanı 3 üzerinde.",
      createdAt: "2026-11-14T04:45:00.000Z",
    },
  ];
  return {
    staff,
    pins,
    failures: new Map(),
    sessions: new Map(),
    tariff,
    prices,
    tariffUpdatedBy: null,
    tariffUpdatedAt: now,
    jobs,
    ledger,
    messages,
    transferSeq: 2403,
    ids: 3,
  };
}

export type InternalDesk = ReturnType<typeof createInternalDesk>;

export function createInternalDesk(now: () => string = () => new Date().toISOString()) {
  const state = seedState("2026-11-13T06:00:00.000Z");

  function person(staffId: string) {
    return state.staff.find(item => item.id === staffId) ?? null;
  }

  function requirePerson(staffId: string) {
    const found = person(staffId);
    if (!found) throw new DeskError("Personel kaydı bulunamadı");
    return found;
  }

  function nextId(prefix: string) {
    state.ids += 1;
    return `${prefix}-${state.ids}`;
  }

  function publicPerson(actor: Staff) {
    return { id: actor.id, name: actor.name, role: actor.role, roleLabel: ROLE_LABELS[actor.role], branchId: actor.branchId };
  }

  function jobView(actor: Staff, job: JobRecord) {
    const locked = job.branchChargeTl != null && job.status !== "requested" && job.status !== "cancelled";
    return {
      id: job.id,
      code: job.code,
      type: job.type,
      direction: job.direction,
      typeLabel: job.direction === "to_central" ? "Şubeden merkez şubeye" : "Merkez şubeden şubeye",
      storeBranchId: job.storeBranchId,
      fromBranchId: job.fromBranchId,
      fromBranchName: locationById(job.fromBranchId)?.name ?? job.fromBranchId,
      toBranchId: job.toBranchId,
      toBranchName: locationById(job.toBranchId)?.name ?? job.toBranchId,
      destinationLabel: job.destinationLabel,
      product: job.product,
      quantity: job.quantity,
      weightKg: job.weightKg,
      distanceKm: job.distanceKm,
      status: job.status,
      requestedBy: job.requestedBy,
      courierId: job.courierId,
      courierName: job.courierId ? person(job.courierId)?.name ?? null : null,
      note: job.note,
      branchChargeTl: visibleCharge(actor, job),
      courierPayoutTl: visiblePayout(actor, job),
      feeLabel: locked ? "kesin" : "tahmini",
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      actions: {
        approve: canApprove(actor, job),
        assign: canAssign(actor, job),
        pickup: canAdvance(actor, job, "picked_up"),
        deliver: canAdvance(actor, job, "delivered"),
        cancel: canCancel(actor, job),
      },
    };
  }

  function roomsFor(actor: Staff) {
    const ids = ["hq", "dispatch", ...BRANCHES.map(branch => hubRoomId(branch.id))];
    for (let index = 0; index < BRANCHES.length; index += 1) {
      for (let other = index + 1; other < BRANCHES.length; other += 1) {
        ids.push(pairRoomId(BRANCHES[index]!.id, BRANCHES[other]!.id));
      }
    }
    return ids.flatMap(id => {
      const access = roomAccess(actor, id);
      const kind = roomKind(id);
      if (!access.read || !kind) return [];
      return [{ id, kind, title: roomTitle(id), canPost: access.post }];
    });
  }

  function ledgerView(actor: Staff) {
    if (!canViewLedger(actor.role)) return null;
    const entries = filterLedger(actor, state.ledger).map(entry => ({
      ...entry,
      branchName: branchById(entry.branchId)?.name ?? entry.branchId,
      courierName: entry.courierId ? person(entry.courierId)?.name ?? null : null,
    }));
    const charges = roundListed(entries.filter(entry => entry.kind === "branch_charge"));
    const payouts = roundListed(entries.filter(entry => entry.kind === "courier_payout"));
    const fullBooks = actor.role === "central_manager" || actor.role === "accountant";
    return {
      title: ledgerTitle(actor.role),
      canSettle: canSettleLedger(actor.role),
      showCharges: actor.role !== "courier",
      showPayouts: actor.role !== "branch_manager",
      entries,
      chargeTotalTl: charges,
      payoutTotalTl: payouts,
      marginTl: fullBooks ? roundListedAmount(charges - payouts) : null,
    };
  }

  function requireJob(actor: Staff, jobId: string) {
    const job = state.jobs.find(item => item.id === jobId);
    if (!job || !canSeeJob(actor, job)) throw new DeskError("Bu işi görme yetkiniz yok", "FORBIDDEN");
    return job;
  }

  function originBranch(actor: Staff, requested?: string) {
    if (requested && actor.role !== "central_manager" && requested !== actor.branchId) {
      throw new DeskError("Bu şube adına iş açma yetkiniz yok", "FORBIDDEN");
    }
    const branchId = actor.role === "central_manager" ? requested : actor.branchId;
    if (!branchId || !canCreateForBranch(actor, branchId)) {
      throw new DeskError("Bu şube adına iş açma yetkiniz yok", "FORBIDDEN");
    }
    return branchById(branchId)!;
  }

  function listedPrice(branchId: string) {
    const row = state.prices.find(item => item.branchId === branchId);
    if (!row) throw new DeskError("Bu şube fiyat listesinde yok");
    return row;
  }

  function priceListView() {
    return {
      centralBranchName: CENTRAL_BRANCH.name,
      updatedAt: state.tariffUpdatedAt,
      updatedBy: state.tariffUpdatedBy ? person(state.tariffUpdatedBy)?.name ?? null : null,
      tariff: { ...state.tariff },
      rows: state.prices.map(row => ({ ...row, branchName: branchById(row.branchId)?.name ?? row.branchId })),
    };
  }

  function assertPriceEditor(actor: Staff) {
    if (!canEditTariff(actor.role)) throw new DeskError("Fiyat listesini yalnız merkez müdür ve admin düzenler", "FORBIDDEN");
  }

  function issueSession(actor: Staff) {
    const token = randomBytes(24).toString("hex");
    state.sessions.set(token, actor.id);
    return { token, staff: publicPerson(actor) };
  }

  function postLedger(job: JobRecord, when: string) {
    if (job.branchChargeTl == null || job.courierPayoutTl == null) throw new DeskError("Ücret kilitlenmeden teslim kapanamaz");
    const storeName = branchById(job.storeBranchId)?.name ?? job.storeBranchId;
    state.ledger.push(
      {
        id: nextId("ldg"),
        jobId: job.id,
        jobCode: job.code,
        kind: "branch_charge",
        branchId: job.storeBranchId,
        courierId: null,
        amountTl: job.branchChargeTl,
        description: `${storeName} ↔ ${CENTRAL_BRANCH.name} kurye bedeli`,
        settled: false,
        createdAt: when,
      },
      {
        id: nextId("ldg"),
        jobId: job.id,
        jobCode: job.code,
        kind: "courier_payout",
        branchId: job.storeBranchId,
        courierId: job.courierId,
        amountTl: job.courierPayoutTl,
        description: `${job.code} kurye ödemesi`,
        settled: false,
        createdAt: when,
      },
    );
  }

  return {
    directory() {
      return {
        branchCount: BRANCHES.length,
        branchLimit: BRANCH_LIMIT,
        centralBranch: { id: CENTRAL_BRANCH.id, name: CENTRAL_BRANCH.name, district: CENTRAL_BRANCH.district, address: CENTRAL_BRANCH.address },
        branches: BRANCHES.map(branch => ({ id: branch.id, name: branch.name, district: branch.district, address: branch.address })),
        staff: state.staff.map(publicPerson),
        managerHint: "İlk merkez müdür kodu 4812. Diğer personel kodlarını merkez müdür ekranından paylaşın.",
      };
    },
    login(staffId: string, pin: string) {
      const actor = person(staffId);
      if (!actor) throw new DeskError("Giriş kodu hatalı", "FORBIDDEN");
      const attempts = state.failures.get(staffId) ?? 0;
      if (attempts >= 8) throw new DeskError("Çok fazla hatalı deneme. Sunucu yenilenene kadar bu kart kilitli.", "FORBIDDEN");
      const expected = state.pins.get(staffId) ?? "";
      if (!sameSecret(expected, pin.trim())) {
        state.failures.set(staffId, attempts + 1);
        throw new DeskError("Giriş kodu hatalı", "FORBIDDEN");
      }
      state.failures.delete(staffId);
      return issueSession(actor);
    },
    logout(token: string | undefined) {
      if (token) state.sessions.delete(token);
      return { success: true as const };
    },
    actorFromToken(token: string | undefined) {
      if (!token) return null;
      const staffId = state.sessions.get(token);
      return staffId ? person(staffId) : null;
    },
    home(actor: Staff) {
      const jobs = state.jobs
        .filter(job => canSeeJob(actor, job))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map(job => jobView(actor, job));
      const openJobs = jobs.filter(job => job.status !== "delivered" && job.status !== "cancelled");
      return {
        actor: publicPerson(actor),
        note: "Kurye on şube ile merkez şube arasında çalışır. Fiyat listesini yalnız merkez müdür ve admin görür.",
        capabilities: {
          canCreate: actor.role === "central_manager" || actor.role === "branch_manager" || actor.role === "branch_staff",
          canEditTariff: canEditTariff(actor.role),
          canViewTariff: canViewTariff(actor.role),
          canViewLedger: canViewLedger(actor.role),
          canSettle: canSettleLedger(actor.role),
          canAssign: actor.role === "central_manager" || actor.role === "courier_lead" || actor.role === "branch_manager",
          canManagePins: actor.role === "central_manager",
          ledgerTitle: canViewLedger(actor.role) ? ledgerTitle(actor.role) : null,
        },
        branches: BRANCHES.map(branch => ({
          id: branch.id,
          name: branch.name,
          district: branch.district,
          address: branch.address,
          openJobs: state.jobs.filter(job => job.fromBranchId === branch.id && job.status !== "delivered" && job.status !== "cancelled").length,
        })),
        couriers: actor.role === "central_manager" || actor.role === "courier_lead" || actor.role === "branch_manager"
          ? state.staff.filter(item => item.role === "courier").map(publicPerson)
          : [],
        jobs,
        openJobCount: openJobs.length,
        ledger: ledgerView(actor),
        priceList: canViewTariff(actor.role) ? priceListView() : null,
        rooms: roomsFor(actor),
      };
    },
    quote(actor: Staff, input: { branchId?: string; direction: HubDirection }) {
      const store = originBranch(actor, input.branchId);
      return presentQuote(actor, listedPrice(store.id), input.direction);
    },
    createHubJob(actor: Staff, input: { branchId?: string; direction: HubDirection; product: string; quantity: number; weightKg: number; note?: string }) {
      const store = originBranch(actor, input.branchId);
      const price = listedPrice(store.id);
      const towardCentral = input.direction === "to_central";
      const when = now();
      state.transferSeq += 1;
      const job: JobRecord = {
        id: nextId("job"),
        code: `MK-${state.transferSeq}`,
        type: "hub",
        direction: input.direction,
        storeBranchId: store.id,
        fromBranchId: towardCentral ? store.id : CENTRAL_BRANCH.id,
        toBranchId: towardCentral ? CENTRAL_BRANCH.id : store.id,
        destinationLabel: towardCentral ? CENTRAL_BRANCH.name : `${store.name} şubesi`,
        product: requiredText(input.product, 2, 120, "Ürün"),
        quantity: whole(input.quantity, 1, 500, "Adet"),
        weightKg: weight(input.weightKg),
        distanceKm: price.distanceKm,
        status: "requested",
        requestedBy: actor.id,
        approvedBy: null,
        courierId: null,
        branchChargeTl: null,
        courierPayoutTl: null,
        estimateChargeTl: price.chargeTl,
        estimatePayoutTl: price.payoutTl,
        note: cleanText(input.note ?? "", 300),
        createdAt: when,
        updatedAt: when,
      };
      state.jobs.push(job);
      return jobView(actor, job);
    },
    approve(actor: Staff, jobId: string) {
      const job = requireJob(actor, jobId);
      if (!canApprove(actor, job)) throw new DeskError("Bu işi onaylama yetkiniz yok", "FORBIDDEN");
      const price = listedPrice(job.storeBranchId);
      job.distanceKm = price.distanceKm;
      job.branchChargeTl = price.chargeTl;
      job.courierPayoutTl = price.payoutTl;
      job.status = "approved";
      job.approvedBy = actor.id;
      job.updatedAt = now();
      return jobView(actor, job);
    },
    assign(actor: Staff, jobId: string, courierId: string) {
      const job = requireJob(actor, jobId);
      if (!canAssign(actor, job)) throw new DeskError("Kurye atama yetkiniz yok", "FORBIDDEN");
      const courier = requirePerson(courierId);
      if (courier.role !== "courier") throw new DeskError("İş yalnız kurye çalışanına atanır");
      job.courierId = courier.id;
      job.status = "assigned";
      job.updatedAt = now();
      return jobView(actor, job);
    },
    advance(actor: Staff, jobId: string, next: "picked_up" | "delivered") {
      const job = requireJob(actor, jobId);
      if (!canAdvance(actor, job, next)) throw new DeskError("İşin durumunu değiştirme yetkiniz yok", "FORBIDDEN");
      const when = now();
      job.status = next;
      job.updatedAt = when;
      if (next === "delivered") postLedger(job, when);
      return jobView(actor, job);
    },
    cancel(actor: Staff, jobId: string) {
      const job = requireJob(actor, jobId);
      if (!canCancel(actor, job)) throw new DeskError("Bu işi iptal etme yetkiniz yok", "FORBIDDEN");
      job.status = "cancelled";
      job.updatedAt = now();
      return jobView(actor, job);
    },
    updateTariff(actor: Staff, tariff: Tariff) {
      assertPriceEditor(actor);
      state.tariff = assertTariff(tariff);
      state.prices = buildPriceList(state.tariff);
      state.tariffUpdatedBy = actor.id;
      state.tariffUpdatedAt = now();
      return priceListView();
    },
    updatePriceList(actor: Staff, rows: { branchId: string; chargeTl: number; payoutTl: number }[]) {
      assertPriceEditor(actor);
      if (rows.length !== BRANCH_LIMIT) throw new DeskError("Fiyat listesi on şubenin tamamını kapsamalı");
      const next = BRANCHES.map(branch => {
        const row = rows.find(item => item.branchId === branch.id);
        if (!row) throw new DeskError("Fiyat listesi on şubenin tamamını kapsamalı");
        return {
          branchId: branch.id,
          distanceKm: listedPrice(branch.id).distanceKm,
          chargeTl: assertMoney(row.chargeTl, `${branch.name} bedeli`),
          payoutTl: assertMoney(row.payoutTl, `${branch.name} kurye ödemesi`),
        };
      });
      state.prices = next;
      state.tariffUpdatedBy = actor.id;
      state.tariffUpdatedAt = now();
      return priceListView();
    },
    priceList(actor: Staff) {
      if (!canViewTariff(actor.role)) throw new DeskError("Fiyat listesini yalnız merkez müdür ve admin görür", "FORBIDDEN");
      return priceListView();
    },
    openAdminSession() {
      return issueSession(requirePerson("admin"));
    },
    ledger(actor: Staff) {
      const view = ledgerView(actor);
      if (!view) throw new DeskError("Muhasebe bu role kapalı", "FORBIDDEN");
      return view;
    },
    settle(actor: Staff, entryId: string) {
      if (!canSettleLedger(actor.role)) throw new DeskError("Tahsilatı kapatma yetkiniz yok", "FORBIDDEN");
      const visible = filterLedger(actor, state.ledger);
      const entry = visible.find(item => item.id === entryId);
      if (!entry) throw new DeskError("Bu muhasebe kaydını görme yetkiniz yok", "FORBIDDEN");
      entry.settled = true;
      return ledgerView(actor)!;
    },
    messages(actor: Staff, roomId: string) {
      const access = roomAccess(actor, roomId);
      if (!access.read) throw new DeskError("Bu sohbeti görme yetkiniz yok", "FORBIDDEN");
      return {
        roomId,
        title: roomTitle(roomId),
        canPost: access.post,
        messages: state.messages
          .filter(message => message.roomId === roomId)
          .map(message => {
            const sender = person(message.senderId);
            return {
              id: message.id,
              senderId: message.senderId,
              senderName: sender?.name ?? "Personel",
              senderRole: (sender?.role ?? "branch_staff") as InternalRole,
              body: message.body,
              createdAt: message.createdAt,
              mine: message.senderId === actor.id,
            };
          }),
      };
    },
    postMessage(actor: Staff, roomId: string, body: string) {
      const access = roomAccess(actor, roomId);
      if (!access.read) throw new DeskError("Bu sohbeti görme yetkiniz yok", "FORBIDDEN");
      if (!access.post) throw new DeskError("Bu sohbete yazma yetkiniz yok", "FORBIDDEN");
      const text = requiredText(body, 1, 500, "Mesaj");
      const message: ChatMessage = { id: nextId("msg"), roomId, senderId: actor.id, body: text, createdAt: now() };
      state.messages.push(message);
      return this.messages(actor, roomId);
    },
    staffCodes(actor: Staff) {
      if (actor.role !== "central_manager") throw new DeskError("Personel kodlarını yalnız merkez müdür görür", "FORBIDDEN");
      return state.staff.map(item => ({ ...publicPerson(item), pin: state.pins.get(item.id) ?? "" }));
    },
    setPin(actor: Staff, staffId: string, pin: string) {
      if (actor.role !== "central_manager") throw new DeskError("Giriş kodunu yalnız merkez müdür değiştirir", "FORBIDDEN");
      requirePerson(staffId);
      if (!/^\d{4,6}$/.test(pin)) throw new DeskError("Giriş kodu 4 ile 6 rakam olmalı");
      state.pins.set(staffId, pin);
      state.failures.delete(staffId);
      return { success: true as const };
    },
  };
}

function presentQuote(actor: Staff, row: PriceRow, direction: HubDirection) {
  return {
    direction,
    branchId: row.branchId,
    branchName: branchById(row.branchId)?.name ?? row.branchId,
    centralBranchName: CENTRAL_BRANCH.name,
    distanceKm: row.distanceKm,
    branchChargeTl: row.chargeTl,
    courierPayoutTl: canViewTariff(actor.role) ? row.payoutTl : null,
    feeLabel: "liste" as const,
  };
}

function roundListed(entries: { amountTl: number }[]) {
  return roundListedAmount(entries.reduce((sum, entry) => sum + entry.amountTl, 0));
}

function roundListedAmount(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function requiredText(value: string, min: number, max: number, label: string) {
  const text = cleanText(value, max);
  if (text.length < min) throw new DeskError(`${label} en az ${min} karakter olmalı`);
  return text;
}

function whole(value: number, min: number, max: number, label: string) {
  if (!Number.isInteger(value) || value < min || value > max) throw new DeskError(`${label} ${min} ile ${max} arasında tam sayı olmalı`);
  return value;
}

function weight(value: number) {
  if (!Number.isFinite(value) || value < 0.1 || value > 50) throw new DeskError("Ağırlık 0,1 ile 50 kg arasında olmalı");
  return Math.round(value * 10) / 10;
}

export const internalDeskRuntime: { api: InternalDesk } = {
  api: createInternalDesk(),
};

export function resetInternalDeskForTests() {
  internalDeskRuntime.api = createInternalDesk();
}

export function actorFromHeader(header: string | string[] | undefined) {
  const token = Array.isArray(header) ? header[0] : header;
  return internalDeskRuntime.api.actorFromToken(token);
}
