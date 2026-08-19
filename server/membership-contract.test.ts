import { describe, expect, it } from "vitest";
import { isMembershipRoleSelectable, platformFeatureKeys, selfAssignableMembershipRoles, type PlatformFeatureSnapshot } from "@shared/membership";

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
});
