export const selfAssignableMembershipRoles = ["user", "courier", "store"] as const;
export type SelfAssignableMembershipRole = (typeof selfAssignableMembershipRoles)[number];

export const platformFeatureKeys = ["ordersEnabled", "courierPortalEnabled", "storePortalEnabled", "liveTrackingEnabled"] as const;
export type PlatformFeatureKey = (typeof platformFeatureKeys)[number];

export type PlatformFeatureSnapshot = Record<PlatformFeatureKey, boolean>;

export const adminMemberRoles = ["all", "user", "courier", "store", "accountant", "admin"] as const;
export type AdminMemberRoleFilter = (typeof adminMemberRoles)[number];

export const adminMemberSortOptions = ["recently_active", "newest", "name_asc", "name_desc"] as const;
export type AdminMemberSortOption = (typeof adminMemberSortOptions)[number];

export type AdminMemberSummary = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: Exclude<AdminMemberRoleFilter, "all">;
  createdAt: Date;
  lastSignedIn: Date;
};

export function filterAndSortAdminMembers<T extends AdminMemberSummary>(members: T[], options: { query?: string; role?: AdminMemberRoleFilter; sort?: AdminMemberSortOption }): T[] {
  const query = options.query?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const filtered = members.filter(member => {
    const searchable = [member.name, member.email, member.phone, member.role].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
    return (!query || searchable.includes(query)) && (!options.role || options.role === "all" || member.role === options.role);
  });
  return filtered.sort((left, right) => {
    if (options.sort === "newest") return right.createdAt.getTime() - left.createdAt.getTime();
    if (options.sort === "name_asc") return (left.name ?? "").localeCompare(right.name ?? "", "tr");
    if (options.sort === "name_desc") return (right.name ?? "").localeCompare(left.name ?? "", "tr");
    return right.lastSignedIn.getTime() - left.lastSignedIn.getTime();
  });
}

export function isMembershipRoleSelectable(role: SelfAssignableMembershipRole, features: PlatformFeatureSnapshot): boolean {
  if (role === "courier") return features.courierPortalEnabled;
  if (role === "store") return features.storePortalEnabled;
  return true;
}
