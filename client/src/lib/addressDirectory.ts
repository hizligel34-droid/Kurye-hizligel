export type AddressOption = { id: number; name: string; provinceId?: number; districtId?: number };

type ApiResponse<T> = { status: string; data: T };

const API_BASE = "https://turkiyeapi.dev/api/v1";
const cache = new Map<string, AddressOption[]>();

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error("Türkiye adres listesi alınamadı");
  const payload = (await response.json()) as ApiResponse<T>;
  if (payload.status !== "OK") throw new Error("Türkiye adres servisi yanıt vermedi");
  return payload.data;
}

export async function getProvinces() {
  const key = "provinces";
  if (!cache.has(key)) cache.set(key, await get<AddressOption[]>("/provinces"));
  return cache.get(key)!;
}

export async function getDistricts(provinceId: number) {
  const key = `districts:${provinceId}`;
  if (!cache.has(key)) {
    const districts = await get<Array<AddressOption & { provinceId: number }>>(`/districts?provinceId=${provinceId}`);
    cache.set(key, districts.map(({ id, name, provinceId: parentId }) => ({ id, name, provinceId: parentId })));
  }
  return cache.get(key)!;
}

export async function getNeighborhoods(districtId: number) {
  const key = `neighborhoods:${districtId}`;
  if (!cache.has(key)) {
    const neighborhoods = await get<Array<AddressOption & { districtId: number }>>(`/neighborhoods?districtId=${districtId}`);
    cache.set(key, neighborhoods.map(({ id, name, districtId: parentId }) => ({ id, name, districtId: parentId })));
  }
  return cache.get(key)!;
}

export function composeStructuredAddress(parts: { province: string; district: string; neighborhood: string; street: string; detail: string }) {
  return [parts.neighborhood, parts.street, parts.detail, parts.district, parts.province].filter(Boolean).join(", ");
}
