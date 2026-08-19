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

export type AdminMemberFilterOptions = {
  query?: string;
  role?: AdminMemberRoleFilter;
  sort?: AdminMemberSortOption;
  createdFrom?: Date | string;
  createdTo?: Date | string;
};

function toDayBoundary(value: Date | string | undefined, endOfDay = false) {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function filterAndSortAdminMembers<T extends AdminMemberSummary>(members: T[], options: AdminMemberFilterOptions): T[] {
  const query = options.query?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const createdFrom = toDayBoundary(options.createdFrom);
  const createdTo = toDayBoundary(options.createdTo, true);
  const filtered = members.filter(member => {
    const searchable = [member.name, member.email, member.phone, member.role].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
    const createdAt = member.createdAt.getTime();
    return (!query || searchable.includes(query))
      && (!options.role || options.role === "all" || member.role === options.role)
      && (!createdFrom || createdAt >= createdFrom.getTime())
      && (!createdTo || createdAt <= createdTo.getTime());
  });
  return filtered.sort((left, right) => {
    if (options.sort === "newest") return right.createdAt.getTime() - left.createdAt.getTime();
    if (options.sort === "name_asc") return (left.name ?? "").localeCompare(right.name ?? "", "tr");
    if (options.sort === "name_desc") return (right.name ?? "").localeCompare(left.name ?? "", "tr");
    return right.lastSignedIn.getTime() - left.lastSignedIn.getTime();
  });
}

function escapeCsv(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function adminMembersToCsv(members: AdminMemberSummary[]): string {
  const headers = ["Ad Soyad", "E-posta", "Telefon", "Rol", "Üyelik Tarihi", "Son Giriş"];
  const rows = members.map(member => [
    member.name,
    member.email,
    member.phone,
    member.role,
    member.createdAt.toISOString(),
    member.lastSignedIn.toISOString(),
  ].map(escapeCsv).join(","));
  return `\uFEFF${headers.map(escapeCsv).join(",")}\n${rows.join("\n")}`;
}

export function isMembershipRoleSelectable(role: SelfAssignableMembershipRole, features: PlatformFeatureSnapshot): boolean {
  if (role === "courier") return features.courierPortalEnabled;
  if (role === "store") return features.storePortalEnabled;
  return true;
}
