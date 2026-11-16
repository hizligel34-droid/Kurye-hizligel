import { beforeEach, describe, expect, it } from "vitest";
import { BRANCHES, CENTRAL_BRANCH, DEFAULT_TARIFF, hubRoomId } from "../shared/internalDesk";
import { appRouter } from "./routers";
import { createInternalDesk, resetInternalDeskForTests } from "./internalDeskStore";
import type { TrpcContext } from "./_core/context";

function actorOf(desk: ReturnType<typeof createInternalDesk>, staffId: string, pin?: string) {
  const manager = desk.login("merkez-mudur", "4812");
  const managerActor = desk.actorFromToken(manager.token)!;
  const code = pin ?? desk.staffCodes(managerActor).find(person => person.id === staffId)?.pin;
  if (!code) throw new Error(`Kod yok: ${staffId}`);
  const session = staffId === "merkez-mudur" ? manager : desk.login(staffId, code);
  const actor = desk.actorFromToken(session.token);
  if (!actor) throw new Error(`Oturum yok: ${staffId}`);
  return actor;
}

describe("internal branch and central courier desk", () => {
  it("keeps ten store branches and one central branch", () => {
    const desk = createInternalDesk();
    expect(desk.directory().branchCount).toBe(10);
    expect(desk.directory().branches).toHaveLength(10);
    expect(desk.directory().centralBranch.name).toBe(CENTRAL_BRANCH.name);
    expect(desk.directory().staff.every(person => !("pin" in person))).toBe(true);
  });

  it("keeps the price list with the admin, including open and close", () => {
    const desk = createInternalDesk();
    const manager = actorOf(desk, "merkez-mudur");
    const admin = actorOf(desk, "admin");
    const accountant = actorOf(desk, "muhasebe");
    const branchManager = actorOf(desk, "kadikoy-yetkili");
    const staff = actorOf(desk, "kadikoy-calisan");
    const lead = actorOf(desk, "kurye-yetkili");

    expect(desk.home(admin).priceList?.rows).toHaveLength(10);
    expect(desk.home(admin).priceList?.open).toBe(true);
    expect(desk.home(manager).priceList).toBeNull();
    expect(desk.home(accountant).priceList).toBeNull();
    expect(desk.home(branchManager).priceList).toBeNull();
    expect(desk.home(staff).priceList).toBeNull();
    expect(desk.home(lead).priceList).toBeNull();
    expect(() => desk.priceList(manager)).toThrow(/Fiyat listesini yalnız admin/);
    expect(() => desk.priceList(staff)).toThrow(/Fiyat listesini yalnız admin/);
    expect(() => desk.setPriceListOpen(manager, false)).toThrow(/yalnız admin açar ve kapatır/);
    expect(() => desk.updateTariff(accountant, DEFAULT_TARIFF)).toThrow(/Fiyat listesini yalnız admin/);

    const edited = desk.updatePriceList(admin, BRANCHES.map(branch => ({ branchId: branch.id, chargeTl: branch.id === "kadikoy" ? 880 : 100, payoutTl: 40 })));
    expect(edited.rows.find(row => row.branchId === "kadikoy")?.chargeTl).toBe(880);
    const created = desk.createHubJob(staff, { direction: "to_central", product: "Koli", quantity: 1, weightKg: 1 });
    expect(created.branchChargeTl).toBeNull();
    expect(created.courierPayoutTl).toBeNull();
    expect(desk.quote(staff, { direction: "to_central" }).branchChargeTl).toBeNull();
    const approved = desk.approve(branchManager, created.id);
    expect(approved.branchChargeTl).toBeNull();
    expect(desk.home(branchManager).jobs.find(job => job.id === created.id)?.branchChargeTl).toBeNull();
    expect(() => desk.updatePriceList(manager, BRANCHES.map(branch => ({ branchId: branch.id, chargeTl: 10, payoutTl: 5 })))).toThrow(/yalnız admin/);
    desk.updatePriceList(admin, BRANCHES.map(branch => ({ branchId: branch.id, chargeTl: 10, payoutTl: 5 })));
    expect(desk.home(manager).jobs.find(job => job.id === created.id)?.branchChargeTl).toBe(880);

    expect(desk.setPriceListOpen(admin, false).open).toBe(false);
    expect(desk.home(staff).priceListOpen).toBe(false);
    expect(() => desk.createHubJob(staff, { direction: "to_central", product: "Kapalı liste", quantity: 1, weightKg: 1 })).toThrow(/Fiyat listesi kapalı/);
    expect(desk.home(manager).jobs.find(job => job.id === created.id)?.branchChargeTl).toBe(880);
    expect(desk.setPriceListOpen(admin, true).open).toBe(true);
  });

  it("moves goods only between a store branch and the central branch", () => {
    const desk = createInternalDesk();
    const manager = actorOf(desk, "merkez-mudur");
    const inbound = desk.createHubJob(manager, { branchId: "pendik", direction: "from_central", product: "Reyon malı", quantity: 3, weightKg: 2 });
    expect(inbound.fromBranchName).toBe("Merkez şube");
    expect(inbound.toBranchName).toBe("Pendik");
    expect(inbound.distanceKm).toBeGreaterThan(1);
    const staff = actorOf(desk, "kadikoy-calisan");
    expect(desk.home(staff).jobs.map(job => job.code)).toEqual(["MK-2401"]);
    expect(() => desk.createHubJob(staff, { branchId: "pendik", direction: "to_central", product: "Yanlış şube", quantity: 1, weightKg: 1 })).toThrow(/yetkiniz yok/);
  });

  it("hides accounting from staff, courier leads, admin, and other branches", () => {
    const desk = createInternalDesk();
    const staff = actorOf(desk, "kadikoy-calisan");
    const admin = actorOf(desk, "admin");
    const lead = actorOf(desk, "kurye-yetkili");
    const courier = actorOf(desk, "kurye-1");
    const otherCourier = actorOf(desk, "kurye-2");
    const branchManager = actorOf(desk, "kadikoy-yetkili");
    const otherManager = actorOf(desk, "besiktas-yetkili");

    expect(desk.home(staff).ledger).toBeNull();
    expect(() => desk.ledger(staff)).toThrow(/Muhasebe bu role kapalı/);
    expect(() => desk.ledger(admin)).toThrow(/Muhasebe bu role kapalı/);
    expect(desk.home(lead).ledger).toBeNull();
    expect(() => desk.ledger(courier)).toThrow(/Muhasebe bu role kapalı/);
    expect(() => desk.ledger(otherCourier)).toThrow(/Muhasebe bu role kapalı/);
    expect(() => desk.ledger(branchManager)).toThrow(/Muhasebe bu role kapalı/);
    expect(() => desk.ledger(otherManager)).toThrow(/Muhasebe bu role kapalı/);
    expect(desk.home(courier).jobs.every(job => job.branchChargeTl == null && job.courierPayoutTl == null)).toBe(true);
    expect(desk.home(branchManager).jobs.every(job => job.branchChargeTl == null && job.courierPayoutTl == null)).toBe(true);
    expect(desk.home(lead).jobs.every(job => job.branchChargeTl == null && job.courierPayoutTl == null)).toBe(true);
    expect(() => desk.settle(branchManager, "ldg-1")).toThrow(/Tahsilatı kapatma/);
  });

  it("lets a branch talk with the central branch and blocks unrelated readers", () => {
    const desk = createInternalDesk();
    const staff = actorOf(desk, "kadikoy-calisan");
    const outsider = actorOf(desk, "maltepe-calisan");
    const accountant = actorOf(desk, "muhasebe");
    const courier = actorOf(desk, "kurye-1");
    const room = hubRoomId("kadikoy");
    expect(desk.postMessage(staff, room, "Merkez sayım için hazır").messages.at(-1)?.body).toContain("hazır");
    expect(desk.messages(accountant, room).canPost).toBe(false);
    expect(() => desk.postMessage(accountant, room, "not")).toThrow(/yazma/);
    expect(() => desk.messages(outsider, room)).toThrow(/görme/);
    expect(() => desk.messages(courier, room)).toThrow(/görme/);
  });

  it("lets a branch call a courier inside its own Istanbul region", () => {
    const desk = createInternalDesk();
    const staff = actorOf(desk, "kadikoy-calisan");
    const other = actorOf(desk, "besiktas-calisan");
    const admin = actorOf(desk, "admin");
    const manager = actorOf(desk, "merkez-mudur");
    const address = { neighborhood: "Mimar Sinan", street: "Uncular Caddesi", buildingNo: "9", addressDetail: "Zemin kat", product: "Poşet", quantity: 1, weightKg: 1 };

    expect(() => desk.createLocalJob(staff, { ...address, district: "Pendik" })).toThrow(/bölgesinde değil/);
    expect(() => desk.createLocalJob(other, { ...address, district: "Kadıköy" })).toThrow(/bölgesinde değil/);
    const created = desk.createLocalJob(staff, { ...address, district: "Üsküdar", courierId: "kurye-1" });
    expect(created.code).toMatch(/^IS-/);
    expect(created.status).toBe("assigned");
    expect(created.addressLine).toContain("Üsküdar");
    expect(created.branchChargeTl).toBeNull();
    expect(created.courierPayoutTl).toBeNull();
    expect(desk.home(actorOf(desk, "kurye-1")).jobs.find(job => job.id === created.id)?.courierPayoutTl).toBeNull();
    expect(desk.home(staff).jobs.map(job => job.code)).toEqual([created.code, "MK-2401"]);
    expect(desk.home(other).jobs.some(job => job.code === created.code)).toBe(false);

    const locked = desk.home(manager).jobs.find(job => job.id === created.id)?.branchChargeTl;
    expect(locked).toBeGreaterThan(120);
    const rows = desk.priceList(admin).rows;
    desk.updateLocalTariffs(admin, rows.map(row => ({
      branchId: row.branchId,
      localOpeningFeeTl: row.branchId === "kadikoy" ? 400 : row.localOpeningFeeTl,
      localPerKmTl: row.localPerKmTl,
      localPayoutOpeningTl: row.localPayoutOpeningTl,
      localPayoutPerKmTl: row.localPayoutPerKmTl,
    })));
    expect(desk.home(manager).jobs.find(job => job.id === created.id)?.branchChargeTl).toBe(locked);
    expect(desk.quoteLocal(staff, { district: "Kadıköy" }).branchChargeTl).toBeNull();
    expect(desk.quoteLocal(manager, { branchId: "kadikoy", district: "Kadıköy" }).branchChargeTl).toBeGreaterThan(locked!);
    expect(() => desk.updateLocalTariffs(staff, rows.map(row => ({ branchId: row.branchId, localOpeningFeeTl: 1, localPerKmTl: 1, localPayoutOpeningTl: 1, localPayoutPerKmTl: 1 })))).toThrow(/yalnız admin/);
    expect(() => desk.priceList(actorOf(desk, "muhasebe"))).toThrow(/Fiyat listesini yalnız admin/);

    desk.updateTariff(admin, DEFAULT_TARIFF);
    desk.updatePriceList(admin, BRANCHES.map(branch => ({ branchId: branch.id, chargeTl: 10, payoutTl: 5 })));
    const kadikoy = desk.priceList(admin).rows.find(row => row.branchId === "kadikoy");
    expect(kadikoy?.localOpeningFeeTl).toBe(400);
    expect(kadikoy?.chargeTl).toBe(10);
    expect(kadikoy?.coverage).toContain("Kadıköy");
  });
});

describe("internal desk router", () => {
  beforeEach(() => resetInternalDeskForTests());

  function caller(token?: string): ReturnType<typeof appRouter.createCaller> {
    const ctx: TrpcContext = {
      user: null,
      internalActor: null,
      req: { headers: token ? { "x-internal-desk": token } : {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    return appRouter.createCaller(ctx);
  }

  it("rejects a closed price list and accepts the manager session", async () => {
    const guest = caller();
    await expect(guest.internalDesk.login({ staffId: "merkez-mudur", pin: "0000" })).rejects.toThrow(/hatalı/);
    const session = await guest.internalDesk.login({ staffId: "merkez-mudur", pin: "4812" });
    const manager = caller(session.token);
    await expect(manager.internalDesk.priceList()).rejects.toThrow(/Fiyat listesini yalnız admin/);
    await expect(manager.internalDesk.setPriceListOpen({ open: false })).rejects.toThrow(/yalnız admin açar ve kapatır/);
    const codes = await manager.internalDesk.staffCodes();
    const staffPin = codes.find(person => person.id === "kadikoy-calisan")?.pin ?? "";
    const staffSession = await guest.internalDesk.login({ staffId: "kadikoy-calisan", pin: staffPin });
    const staff = caller(staffSession.token);
    await expect(staff.internalDesk.priceList()).rejects.toThrow(/Fiyat listesini yalnız admin/);
    await expect(staff.internalDesk.ledger()).rejects.toThrow(/Muhasebe bu role kapalı/);
    const adminPin = codes.find(person => person.id === "admin")?.pin ?? "";
    const adminSession = await guest.internalDesk.login({ staffId: "admin", pin: adminPin });
    const admin = caller(adminSession.token);
    const list = await admin.internalDesk.priceList();
    expect(list.rows).toHaveLength(10);
    expect(list.open).toBe(true);
    const saved = await admin.internalDesk.updatePriceList({ rows: list.rows.map(row => ({ branchId: row.branchId, chargeTl: 250, payoutTl: 90 })) });
    expect(saved.rows.every(row => row.chargeTl === 250)).toBe(true);
    expect((await admin.internalDesk.setPriceListOpen({ open: false })).open).toBe(false);
    await expect(staff.internalDesk.createLocalJob({ district: "Kadıköy", neighborhood: "Caferağa", street: "Moda Caddesi", buildingNo: "14", addressDetail: "Zemin kat", product: "Poşet", quantity: 1, weightKg: 1 })).rejects.toThrow(/Fiyat listesi kapalı/);
    expect((await admin.internalDesk.setPriceListOpen({ open: true })).open).toBe(true);
    await expect(admin.internalDesk.ledger()).rejects.toThrow(/Muhasebe bu role kapalı/);
  });
});
