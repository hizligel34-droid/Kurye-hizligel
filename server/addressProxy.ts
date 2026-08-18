import type { Express, Request, Response } from "express";
import istanbulFallback from "./istanbulAddressFallback.json";

const TURKIYE_API_BASE = "https://turkiyeapi.dev/api/v1";

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
