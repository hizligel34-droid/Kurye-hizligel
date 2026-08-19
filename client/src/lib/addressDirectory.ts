export type AddressOption = {
  id: number;
  name: string;
  provinceId?: number;
  districtId?: number;
  neighborhoodId?: number;
  postalCode?: string;
};

type ApiResponse<T> = { status: string; data: T };

const API_BASE = "/api/address";
const cache = new Map<string, AddressOption[]>();

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error("Türkiye adres listesi alınamadı");
  const payload = (await response.json()) as ApiResponse<T>;
  if (payload.status !== "OK") throw new Error("Türkiye adres servisi yanıt vermedi");
  return payload.data;
}

export function resetAddressDirectoryCache() {
  cache.clear();
}

export function getPostalCodeForAddressOption(option?: Pick<AddressOption, "postalCode"> | null) {
  return option?.postalCode?.trim() ?? "";
}

export async function getProvinces() {
  const key = "provinces:turkiye";
  if (!cache.has(key)) cache.set(key, await get<AddressOption[]>("/provinces"));
  return cache.get(key)!;
}

export async function getDistricts(provinceId: number) {
  const key = `districts:${provinceId}`;
  if (!cache.has(key)) cache.set(key, await get<AddressOption[]>(`/districts?provinceId=${provinceId}`));
  return cache.get(key)!;
}

export async function getNeighborhoods(provinceId: number, districtId: number) {
  const key = `neighborhoods:${provinceId}:${districtId}`;
  if (!cache.has(key)) cache.set(key, await get<AddressOption[]>(`/neighborhoods?provinceId=${provinceId}&districtId=${districtId}`));
  return cache.get(key)!;
}

export async function getStreetSuggestions(params: { provinceId: number; districtId: number; neighborhoodId: number; query?: string }) {
  const query = params.query?.trim() ?? "";
  const key = `streets:${params.provinceId}:${params.districtId}:${params.neighborhoodId}:${query.toLocaleLowerCase("tr-TR")}`;
  if (!cache.has(key)) {
    const suggestions = await get<AddressOption[]>(`/streets?provinceId=${params.provinceId}&districtId=${params.districtId}&neighborhoodId=${params.neighborhoodId}&q=${encodeURIComponent(query)}`);
    const unique = new Map<string, AddressOption>();
    for (const item of suggestions) {
      const name = item.name.trim();
      const normalized = name.toLocaleLowerCase("tr-TR");
      if (name && !unique.has(normalized)) unique.set(normalized, { ...item, name });
    }
    cache.set(key, Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name, "tr-TR")));
  }
  return cache.get(key)!;
}

export function composeStructuredAddress(parts: { province: string; district: string; neighborhood: string; street: string; detail: string }) {
  return [parts.neighborhood, parts.street, parts.detail, parts.district, parts.province].filter(Boolean).join(", ");
}
