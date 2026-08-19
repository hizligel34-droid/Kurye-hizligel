export const selfAssignableMembershipRoles = ["user", "courier", "store"] as const;
export type SelfAssignableMembershipRole = (typeof selfAssignableMembershipRoles)[number];

export const platformFeatureKeys = ["ordersEnabled", "courierPortalEnabled", "storePortalEnabled", "liveTrackingEnabled"] as const;
export type PlatformFeatureKey = (typeof platformFeatureKeys)[number];

export type PlatformFeatureSnapshot = Record<PlatformFeatureKey, boolean>;

export function isMembershipRoleSelectable(role: SelfAssignableMembershipRole, features: PlatformFeatureSnapshot): boolean {
  if (role === "courier") return features.courierPortalEnabled;
  if (role === "store") return features.storePortalEnabled;
  return true;
}
