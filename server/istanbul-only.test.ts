import { createElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AddressPicker } from "../client/src/pages/Home";
import { getDistricts, getNeighborhoods, getProvinces, resetAddressDirectoryCache } from "../client/src/lib/addressDirectory";
import { OFFLINE_MAP_PACKAGES } from "../client/src/lib/offlinePackages";

describe("Türkiye geneli adres kapsamı", () => {
  beforeEach(() => resetAddressDirectoryCache());

  it("adres seçicide boş il seçimiyle başlar; il alanı etkin kalır", () => {
    const markup = renderToStaticMarkup(createElement(AddressPicker, { label: "Alış adresi", onChange: () => undefined }));
    expect(markup).toContain('aria-label="İl"');
    expect(markup).toContain(">İl seçin</option>");
    expect(markup).toContain(">İlçe seçin</option>");
    expect(markup).toContain(">Mahalle seçin</option>");
    expect(markup).toContain('placeholder="Sokak / cadde"');
    expect(markup).not.toContain('value="34" disabled');
  });

  it("il, ilçe ve mahalleleri seçilen ilin kimliğiyle yükler", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      const data = url.endsWith("/provinces")
        ? [{ id: 6, name: "Ankara", postalCode: "06000" }, { id: 34, name: "İstanbul", postalCode: "34000" }]
        : url.includes("districts?provinceId=6")
          ? [{ id: 101, name: "Çankaya", provinceId: 6, postalCode: "06680" }]
          : [{ id: 1001, name: "Kızılay", provinceId: 6, districtId: 101, postalCode: "06420" }];
      return { ok: true, json: async () => ({ status: "OK", data }) } as Response;
    }) as typeof fetch;

    try {
      expect(await getProvinces()).toEqual([{ id: 6, name: "Ankara", postalCode: "06000" }, { id: 34, name: "İstanbul", postalCode: "34000" }]);
      expect(await getDistricts(6)).toEqual([{ id: 101, name: "Çankaya", provinceId: 6, postalCode: "06680" }]);
      expect(await getNeighborhoods(6, 101)).toEqual([{ id: 1001, name: "Kızılay", provinceId: 6, districtId: 101, postalCode: "06420" }]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("offline harita paketinin kapsamını adres dizininden bağımsız tutar", () => {
    expect(OFFLINE_MAP_PACKAGES).toHaveLength(1);
    expect(OFFLINE_MAP_PACKAGES[0]?.city).toBe("İstanbul");
  });
});
