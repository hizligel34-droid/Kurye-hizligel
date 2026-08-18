export type AddressOption = { id: number; name: string; provinceId?: number; districtId?: number };

type ApiResponse<T> = { status: string; data: T };

const API_BASE = "/api/address";
export const ISTANBUL_PROVINCE_ID = 34;
const cache = new Map<string, AddressOption[]>();
const embeddedNeighborhoods = new Map<number, AddressOption[]>();

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error("Türkiye adres listesi alınamadı");
  const payload = (await response.json()) as ApiResponse<T>;
  if (payload.status !== "OK") throw new Error("Türkiye adres servisi yanıt vermedi");
  return payload.data;
}

export function filterIstanbulProvince(provinces: AddressOption[]) {
  return provinces.filter(province => province.id === ISTANBUL_PROVINCE_ID);
}

export async function getProvinces() {
  const key = "provinces:istanbul-only";
  if (!cache.has(key)) {
    const provinces = await get<AddressOption[]>("/provinces");
    cache.set(key, filterIstanbulProvince(provinces));
  }
  return cache.get(key)!;
}

export async function getDistricts(provinceId: number) {
  const key = `districts:${provinceId}`;
  if (!cache.has(key)) {
    const districts = await get<Array<AddressOption & { provinceId: number; neighborhoods?: Array<AddressOption & { districtId?: number }> }>>(`/districts?provinceId=${provinceId}`);
    cache.set(key, districts.map(({ id, name, provinceId: parentId, neighborhoods }) => {
      if (neighborhoods?.length) embeddedNeighborhoods.set(id, neighborhoods.map(item => ({ id: item.id, name: item.name, districtId: id })));
      return { id, name, provinceId: parentId };
    }));
  }
  return cache.get(key)!;
}

export async function getNeighborhoods(districtId: number) {
  const key = `neighborhoods:${districtId}`;
  if (!cache.has(key)) {
    try {
      const neighborhoods = await get<Array<AddressOption & { districtId: number }>>(`/neighborhoods?districtId=${districtId}`);
      cache.set(key, neighborhoods.map(({ id, name, districtId: parentId }) => ({ id, name, districtId: parentId })));
    } catch (error) {
      const fallback = embeddedNeighborhoods.get(districtId);
      if (!fallback) throw error;
      cache.set(key, fallback);
    }
  }
  return cache.get(key)!;
}

export async function getStreetSuggestions(params: { district: string; neighborhood: string; query?: string }) {
  const query = params.query?.trim() ?? "";
  const key = `streets:${params.district}:${params.neighborhood}:${query.toLocaleLowerCase("tr-TR")}`;
  if (!cache.has(key)) {
    const suggestions = await get<Array<AddressOption & { district: string; neighborhood: string }>>(`/streets?district=${encodeURIComponent(params.district)}&neighborhood=${encodeURIComponent(params.neighborhood)}&q=${encodeURIComponent(query)}`);
    cache.set(key, suggestions.map(item => ({ id: item.id, name: item.name })));
  }
  return cache.get(key)!;
}

export function composeStructuredAddress(parts: { province: string; district: string; neighborhood: string; street: string; detail: string }) {
  return [parts.neighborhood, parts.street, parts.detail, parts.district, parts.province].filter(Boolean).join(", ");
}
