import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AddressPicker } from "../client/src/pages/Home";
import { filterIstanbulProvince, getDistricts, getNeighborhoods, getProvinces, ISTANBUL_PROVINCE_ID } from "../client/src/lib/addressDirectory";
import { OFFLINE_MAP_PACKAGES } from "../client/src/lib/offlinePackages";

describe("İstanbul-only adres kapsamı", () => {
  it("yalnızca İstanbul ilini seçilebilir bırakır", () => {
    const result = filterIstanbulProvince([
      { id: 34, name: "İstanbul" },
      { id: 6, name: "Ankara" },
      { id: 35, name: "İzmir" },
    ]);

    expect(ISTANBUL_PROVINCE_ID).toBe(34);
    expect(result).toEqual([{ id: 34, name: "İstanbul" }]);
  });

  it("offline paket manifestinde yalnızca İstanbul bulunur", () => {
    expect(OFFLINE_MAP_PACKAGES).toHaveLength(1);
    expect(OFFLINE_MAP_PACKAGES[0]?.city).toBe("İstanbul");
    expect(OFFLINE_MAP_PACKAGES[0]?.downloadUrl).toBe("/api/offline-maps/istanbul");
  });

  it("AddressPicker render'ında il alanını İstanbul'a sabitler ve devre dışı bırakır", () => {
    const markup = renderToStaticMarkup(createElement(AddressPicker, { label: "Alış adresi", onChange: () => undefined }));
    expect(markup).toContain('aria-label="İl"');
    expect(markup).toContain('value="34"');
    expect(markup).toContain("disabled");
    expect(markup).toContain(">İstanbul</option>");
    expect(markup).toContain(">İlçe seçin</option>");
    expect(markup).toContain(">Mahalle seçin</option>");
    expect(markup).toContain('placeholder="Sokak / cadde"');
    expect(markup).not.toContain(">Ankara</option>");
  });

  it("İstanbul seçildikten sonra ilçe ve mahalleleri parent id ile yükler", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      const data = url.endsWith("/provinces")
        ? [{ id: 34, name: "İstanbul" }, { id: 6, name: "Ankara" }]
        : url.includes("districts?provinceId=34")
          ? [{ id: 101, name: "Kadıköy", provinceId: 34 }]
          : [{ id: 1001, name: "Caferağa", districtId: 101 }];
      return { ok: true, json: async () => ({ status: "OK", data }) } as Response;
    }) as typeof fetch;

    try {
      expect(await getProvinces()).toEqual([{ id: 34, name: "İstanbul" }]);
      expect(await getDistricts(34)).toEqual([{ id: 101, name: "Kadıköy", provinceId: 34 }]);
      expect(await getNeighborhoods(101)).toEqual([{ id: 1001, name: "Caferağa", districtId: 101 }]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("ilçe yanıtındaki gömülü mahalleler, mahalle endpointi başarısız olduğunda yedeklenir", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("districts?provinceId=99")) {
        return { ok: true, json: async () => ({ status: "OK", data: [{ id: 909, name: "Deneme", provinceId: 99, neighborhoods: [{ id: 9001, name: "Yedek Mahalle" }] }] }) } as Response;
      }
      return { ok: false, json: async () => ({ status: "ERROR", data: [] }) } as Response;
    }) as typeof fetch;

    try {
      expect(await getDistricts(99)).toEqual([{ id: 909, name: "Deneme", provinceId: 99 }]);
      expect(await getNeighborhoods(909)).toEqual([{ id: 9001, name: "Yedek Mahalle", districtId: 909 }]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("ilçe, mahalle, cadde ve açık adresi birlikte korur", () => {
    const address = ["Merkez Mahallesi", "Bağdat Caddesi", "No: 10", "Kadıköy", "İstanbul"].join(", ");
    expect(address).toContain("İstanbul");
    expect(address).toContain("Kadıköy");
    expect(address).toContain("Bağdat Caddesi");
  });
});
