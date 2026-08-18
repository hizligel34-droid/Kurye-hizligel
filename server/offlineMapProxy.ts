import type { Express } from "express";

const ISTANBUL_PACKAGE_URL = "https://download.bbbike.org/osm/bbbike/Istanbul/Istanbul.osm.pmtiles-shortbread.zip";

export function registerOfflineMapProxy(app: Express) {
  app.get("/api/offline-maps/istanbul", async (_req, res) => {
    try {
      const upstream = await fetch(ISTANBUL_PACKAGE_URL, { redirect: "follow" });
      if (!upstream.ok) {
        res.status(502).json({ error: `İstanbul offline paket kaynağı ${upstream.status} döndürdü` });
        return;
      }
      const body = Buffer.from(await upstream.arrayBuffer());
      res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/zip");
      res.setHeader("Content-Length", String(body.byteLength));
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(body);
    } catch (error) {
      console.error("[OfflineMapProxy] İstanbul paket alınamadı", error);
      res.status(502).json({ error: "İstanbul offline paketine erişilemedi" });
    }
  });
}
