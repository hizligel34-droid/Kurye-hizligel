import { describe, expect, it } from "vitest";
import { filterAndSortAdminMembers, isMembershipRoleSelectable, platformFeatureKeys, selfAssignableMembershipRoles, type PlatformFeatureSnapshot } from "@shared/membership";

const allEnabled: PlatformFeatureSnapshot = { ordersEnabled: true, courierPortalEnabled: true, storePortalEnabled: true, liveTrackingEnabled: true };

describe("membership and admin module contract", () => {
  it("exposes only customer, courier and store as self-selectable roles", () => {
    expect(selfAssignableMembershipRoles).toEqual(["user", "courier", "store"]);
    expect(selfAssignableMembershipRoles).not.toContain("admin");
    expect(selfAssignableMembershipRoles).not.toContain("accountant");
  });

  it("keeps admin feature controls limited to expected platform modules", () => {
    expect(platformFeatureKeys).toEqual(["ordersEnabled", "courierPortalEnabled", "storePortalEnabled", "liveTrackingEnabled"]);
  });

  it("prevents selecting disabled courier or store membership while preserving customer access", () => {
    const limited = { ...allEnabled, courierPortalEnabled: false, storePortalEnabled: false };
    expect(isMembershipRoleSelectable("user", limited)).toBe(true);
    expect(isMembershipRoleSelectable("courier", limited)).toBe(false);
    expect(isMembershipRoleSelectable("store", limited)).toBe(false);
  });

  it("filters members by role or identity data and applies the selected order", () => {
    const members = [
      { id: 1, name: "Zeynep", email: "zeynep@example.com", phone: null, role: "courier" as const, createdAt: new Date("2026-08-02"), lastSignedIn: new Date("2026-08-10") },
      { id: 2, name: "Ahmet", email: "ahmet@example.com", phone: "05555555555", role: "store" as const, createdAt: new Date("2026-08-04"), lastSignedIn: new Date("2026-08-09") },
      { id: 3, name: "Müşteri", email: "customer@example.com", phone: null, role: "user" as const, createdAt: new Date("2026-08-03"), lastSignedIn: new Date("2026-08-11") },
    ];
    expect(filterAndSortAdminMembers(members, { role: "courier", sort: "recently_active" }).map(member => member.id)).toEqual([1]);
    expect(filterAndSortAdminMembers(members, { query: "05555", sort: "recently_active" }).map(member => member.id)).toEqual([2]);
    expect(filterAndSortAdminMembers(members, { sort: "name_asc" }).map(member => member.id)).toEqual([2, 3, 1]);
  });
});
