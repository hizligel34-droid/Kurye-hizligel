import type { Express, Request, Response } from "express";

const SOURCE_BASE = "https://raw.githubusercontent.com/onurusluca/turkey-geo-api/main/data/jsonl";
const CACHE_TTL_MS = 15 * 60 * 1000;
const STREET_CACHE_MAX = 2;
const DIRECTORY_CACHE_MAX = 8;

type SourceProvince = { id: number; name: string; postal_code?: string };
type SourceDistrict = { id: number; name: string; province_id: number; postal_code?: string };
type SourceNeighborhood = { id: number; name: string; province_id: number; district_id: number; postal_code?: string };
type SourceStreet = { id: number; name: string; province_id: number; district_id: number; neighborhood_id: number };
type CacheEntry<T> = { value: T; expiresAt: number };

const directoryCache = new Map<string, CacheEntry<unknown>>();
const streetCache = new Map<string, CacheEntry<SourceStreet[]>>();
let addressSourceLastSuccessAt: Date | null = null;
let addressSourceLastError = "";

function positiveInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readCache<T>(cache: Map<string, CacheEntry<unknown> | CacheEntry<SourceStreet[]>>, key: string) {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, entry as CacheEntry<unknown> & CacheEntry<SourceStreet[]>);
  return entry.value;
}

function writeCache<T>(cache: Map<string, CacheEntry<unknown> | CacheEntry<SourceStreet[]>>, key: string, value: T, max: number) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS } as CacheEntry<unknown> & CacheEntry<SourceStreet[]>);
  while (cache.size > max) cache.delete(cache.keys().next().value as string);
}

async function fetchJsonLines<T>(path: string, cache: Map<string, CacheEntry<unknown> | CacheEntry<SourceStreet[]>>, max: number) {
  const cached = readCache<T[]>(cache, path);
  if (cached) return cached;

  const upstream = await fetch(`${SOURCE_BASE}/${path}`, { headers: { accept: "text/plain" } });
  if (!upstream.ok) throw new Error(`Adres kaynağı ${upstream.status} döndürdü`);
  const body = await upstream.text();
  const rows = body.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line) as T);
  writeCache(cache, path, rows, max);
  addressSourceLastSuccessAt = new Date();
  addressSourceLastError = "";
  return rows;
}

export function clearAddressSourceCache() {
  directoryCache.clear();
  streetCache.clear();
}

export async function getAddressSourceHealth(forceRefresh = false) {
  if (forceRefresh) clearAddressSourceCache();
  const checkedAt = new Date();
  try {
    const provinces = await getProvinces();
    return {
      status: "healthy" as const,
      sourceUrl: SOURCE_BASE,
      checkedAt,
      lastSuccessAt: addressSourceLastSuccessAt ?? checkedAt,
      provinceCount: provinces.length,
      directoryCacheEntries: directoryCache.size,
      streetCacheEntries: streetCache.size,
      message: forceRefresh ? "Adres verisi önbelleği temizlendi ve kaynak yeniden doğrulandı." : "Adres kaynağı erişilebilir durumda.",
    };
  } catch (error) {
    addressSourceLastError = error instanceof Error ? error.message : "Adres kaynağına ulaşılamadı";
    return {
      status: "unhealthy" as const,
      sourceUrl: SOURCE_BASE,
      checkedAt,
      lastSuccessAt: addressSourceLastSuccessAt,
      provinceCount: null,
      directoryCacheEntries: directoryCache.size,
      streetCacheEntries: streetCache.size,
      message: addressSourceLastError,
    };
  }
}

async function getProvinces() {
  return fetchJsonLines<SourceProvince>("provinces.jsonl", directoryCache, DIRECTORY_CACHE_MAX);
}

async function getDistricts(provinceId: number) {
  return fetchJsonLines<SourceDistrict>(`province-${provinceId}/districts.jsonl`, directoryCache, DIRECTORY_CACHE_MAX);
}

async function getNeighborhoods(provinceId: number) {
  return fetchJsonLines<SourceNeighborhood>(`province-${provinceId}/neighborhoods.jsonl`, directoryCache, DIRECTORY_CACHE_MAX);
}

async function getStreets(provinceId: number) {
  return fetchJsonLines<SourceStreet>(`province-${provinceId}/streets.jsonl`, streetCache, STREET_CACHE_MAX);
}

function errorResponse(res: Response) {
  return res.status(502).json({ error: "Türkiye geneli adres kaynağına şu an ulaşılamıyor. Lütfen tekrar deneyin." });
}

export function registerAddressProxy(app: Express) {
  app.get("/api/address/provinces", async (_req: Request, res: Response) => {
    try {
      const data = (await getProvinces()).map(item => ({ id: item.id, name: item.name, postalCode: item.postal_code ?? "" }));
      return res.json({ status: "OK", data });
    } catch {
      return errorResponse(res);
    }
  });

  app.get("/api/address/districts", async (req: Request, res: Response) => {
    const provinceId = positiveInteger(req.query.provinceId);
    if (!provinceId) return res.status(400).json({ error: "Geçerli bir il gerekli" });
    try {
      const data = (await getDistricts(provinceId)).map(item => ({ id: item.id, name: item.name, provinceId: item.province_id, postalCode: item.postal_code ?? "" }));
      return res.json({ status: "OK", data });
    } catch {
      return errorResponse(res);
    }
  });

  app.get("/api/address/neighborhoods", async (req: Request, res: Response) => {
    const provinceId = positiveInteger(req.query.provinceId);
    const districtId = positiveInteger(req.query.districtId);
    if (!provinceId || !districtId) return res.status(400).json({ error: "Geçerli il ve ilçe gerekli" });
    try {
      const districts = await getDistricts(provinceId);
      const districtPostalCode = districts.find(item => item.id === districtId)?.postal_code ?? "";
      const data = (await getNeighborhoods(provinceId))
        .filter(item => item.district_id === districtId)
        .map(item => ({ id: item.id, name: item.name, districtId: item.district_id, provinceId: item.province_id, postalCode: item.postal_code ?? districtPostalCode }));
      return res.json({ status: "OK", data });
    } catch {
      return errorResponse(res);
    }
  });

  app.get("/api/address/streets", async (req: Request, res: Response) => {
    const provinceId = positiveInteger(req.query.provinceId);
    const districtId = positiveInteger(req.query.districtId);
    const neighborhoodId = positiveInteger(req.query.neighborhoodId);
    const query = String(req.query.q ?? "").trim();
    if (!provinceId || !districtId || !neighborhoodId) return res.status(400).json({ error: "İl, ilçe ve mahalle seçimi gerekli" });
    if (query.length < 2 || query.length > 80) return res.json({ status: "OK", data: [] });
    try {
      const normalized = query.toLocaleLowerCase("tr-TR");
      const data = (await getStreets(provinceId))
        .filter(item => item.district_id === districtId && item.neighborhood_id === neighborhoodId)
        .filter(item => item.name.toLocaleLowerCase("tr-TR").includes(normalized))
        .slice(0, 15)
        .map(item => ({ id: item.id, name: item.name, provinceId: item.province_id, districtId: item.district_id, neighborhoodId: item.neighborhood_id }));
      return res.json({ status: "OK", data });
    } catch {
      return res.json({ status: "OK", data: [] });
    }
  });
}
