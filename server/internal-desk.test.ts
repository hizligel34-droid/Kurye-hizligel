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

  it("shows and edits the price list only for the central manager and admin", () => {
    const desk = createInternalDesk();
    const manager = actorOf(desk, "merkez-mudur");
    const admin = actorOf(desk, "admin");
    const accountant = actorOf(desk, "muhasebe");
    const branchManager = actorOf(desk, "kadikoy-yetkili");
    const staff = actorOf(desk, "kadikoy-calisan");
    const lead = actorOf(desk, "kurye-yetkili");

    expect(desk.home(manager).priceList?.rows).toHaveLength(10);
    expect(desk.home(admin).priceList?.rows).toHaveLength(10);
    expect(desk.home(accountant).priceList).toBeNull();
    expect(desk.home(branchManager).priceList).toBeNull();
    expect(desk.home(staff).priceList).toBeNull();
    expect(desk.home(lead).priceList).toBeNull();
    expect(() => desk.priceList(staff)).toThrow(/Fiyat listesini yalnız merkez müdür ve admin/);
    expect(() => desk.updateTariff(accountant, DEFAULT_TARIFF)).toThrow(/Fiyat listesini yalnız merkez müdür ve admin/);

    const edited = desk.updatePriceList(admin, BRANCHES.map(branch => ({ branchId: branch.id, chargeTl: branch.id === "kadikoy" ? 880 : 100, payoutTl: 40 })));
    expect(edited.rows.find(row => row.branchId === "kadikoy")?.chargeTl).toBe(880);
    const created = desk.createHubJob(staff, { direction: "to_central", product: "Koli", quantity: 1, weightKg: 1 });
    expect(created.branchChargeTl).toBe(880);
    expect(created.courierPayoutTl).toBeNull();
    const approved = desk.approve(branchManager, created.id);
    expect(approved.branchChargeTl).toBe(880);
    desk.updatePriceList(manager, BRANCHES.map(branch => ({ branchId: branch.id, chargeTl: 10, payoutTl: 5 })));
    expect(desk.home(manager).jobs.find(job => job.id === created.id)?.branchChargeTl).toBe(880);
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
    expect(desk.ledger(courier).entries.every(entry => entry.kind === "courier_payout" && entry.courierId === "kurye-1")).toBe(true);
    expect(desk.ledger(otherCourier).entries).toHaveLength(0);
    expect(desk.ledger(branchManager).entries.every(entry => entry.kind === "branch_charge" && entry.branchId === "kadikoy")).toBe(true);
    expect(desk.ledger(otherManager).entries.some(entry => entry.branchId === "kadikoy")).toBe(false);
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
    const list = await manager.internalDesk.priceList();
    expect(list.rows).toHaveLength(10);
    const codes = await manager.internalDesk.staffCodes();
    const staffPin = codes.find(person => person.id === "kadikoy-calisan")?.pin ?? "";
    const staffSession = await guest.internalDesk.login({ staffId: "kadikoy-calisan", pin: staffPin });
    const staff = caller(staffSession.token);
    await expect(staff.internalDesk.priceList()).rejects.toThrow(/Fiyat listesini yalnız merkez müdür ve admin/);
    await expect(staff.internalDesk.ledger()).rejects.toThrow(/kapalı/);
    const adminPin = codes.find(person => person.id === "admin")?.pin ?? "";
    const adminSession = await guest.internalDesk.login({ staffId: "admin", pin: adminPin });
    const admin = caller(adminSession.token);
    const saved = await admin.internalDesk.updatePriceList({ rows: list.rows.map(row => ({ branchId: row.branchId, chargeTl: 250, payoutTl: 90 })) });
    expect(saved.rows.every(row => row.chargeTl === 250)).toBe(true);
    await expect(admin.internalDesk.ledger()).rejects.toThrow(/kapalı/);
  });
});
