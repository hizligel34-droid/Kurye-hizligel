import type { Express, Request, Response } from "express";
import istanbulFallback from "./istanbulAddressFallback.json";

const TURKIYE_API_BASE = "https://turkiyeapi.dev/api/v1";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";

type ApiResponse<T> = { status: string; data: T };

async function proxyJson(path: string, res: Response) {
  const fallbackMatch = path.match(/^\/districts\?provinceId=(\d+)$/);
  if (fallbackMatch?.[1] === "34") return res.json({ status: "OK", data: istanbulFallback.districts });
  const neighborhoodMatch = path.match(/^\/neighborhoods\?districtId=(\d+)$/);
  if (neighborhoodMatch) {
    const district = istanbulFallback.districts.find(item => item.id === Number(neighborhoodMatch[1]));
    if (district) return res.json({ status: "OK", data: district.neighborhoods });
  }
  try {
    const upstream = await fetch(`${TURKIYE_API_BASE}${path}`, { headers: { accept: "application/json" } });
    if (!upstream.ok) return res.status(502).json({ error: "Türkiye adres servisi erişilemiyor" });
    const payload = (await upstream.json()) as ApiResponse<unknown>;
    if (payload.status !== "OK") return res.status(502).json({ error: "Türkiye adres servisi geçersiz yanıt verdi" });
    return res.json(payload);
  } catch {
    return res.status(502).json({ error: "Türkiye adres servisine ulaşılamadı" });
  }
}

function positiveInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function registerAddressProxy(app: Express) {
  app.get("/api/address/streets", async (req: Request, res: Response) => {
    const district = String(req.query.district ?? "").trim();
    const neighborhood = String(req.query.neighborhood ?? "").trim();
    const query = String(req.query.q ?? "").trim();
    if (!district || !neighborhood) return res.status(400).json({ error: "İlçe ve mahalle bağlamı gerekli" });
    if (query.length > 80) return res.status(400).json({ error: "Cadde araması çok uzun" });
    try {
      const search = new URL(NOMINATIM_BASE);
      search.searchParams.set("format", "jsonv2");
      search.searchParams.set("q", [query, neighborhood, district, "İstanbul", "Türkiye"].filter(Boolean).join(", "));
      search.searchParams.set("featuretype", "street");
      search.searchParams.set("addressdetails", "1");
      search.searchParams.set("limit", "20");
      search.searchParams.set("countrycodes", "tr");
      const upstream = await fetch(search, { headers: { accept: "application/json", "user-agent": "RunKurye/1.0 address search" } });
      if (!upstream.ok) return res.json({ status: "OK", data: [] });
      const payload = (await upstream.json()) as Array<{ osm_id?: number; display_name?: string; name?: string; type?: string; address?: Record<string, string> }>;
      const allowedTypes = new Set(["residential", "road", "street", "pedestrian", "tertiary", "secondary", "primary", "unclassified", "living_street", "service"]);
      const seen = new Set<string>();
      const data = payload
        .map((item, index) => ({ id: item.osm_id ?? index + 1, name: (item.name ?? item.display_name?.split(",")[0] ?? "").trim(), type: item.type ?? "", district, neighborhood }))
        .filter(item => item.name && (allowedTypes.has(item.type) || /(cadde|caddesi|sokak|sokağı|bulvar|bulvarı|yolu)$/i.test(item.name)))
        .filter(item => {
          const key = item.name.toLocaleLowerCase("tr-TR");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 15)
        .map(({ id, name, district: itemDistrict, neighborhood: itemNeighborhood }) => ({ id, name, district: itemDistrict, neighborhood: itemNeighborhood }));
      return res.json({ status: "OK", data });
    } catch {
      return res.json({ status: "OK", data: [] });
    }
  });
  app.get("/api/address/provinces", (_req: Request, res: Response) => proxyJson("/provinces", res));
  app.get("/api/address/districts", (req: Request, res: Response) => {
    const provinceId = positiveInteger(req.query.provinceId);
    if (!provinceId) return res.status(400).json({ error: "Geçerli bir provinceId gerekli" });
    return proxyJson(`/districts?provinceId=${provinceId}`, res);
  });
  app.get("/api/address/neighborhoods", (req: Request, res: Response) => {
    const districtId = positiveInteger(req.query.districtId);
    if (!districtId) return res.status(400).json({ error: "Geçerli bir districtId gerekli" });
    return proxyJson(`/neighborhoods?districtId=${districtId}`, res);
  });
}
