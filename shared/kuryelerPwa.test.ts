import { describe, expect, it } from "vitest";
import { NATIVE_APPS, PWA_APPS, PWA_PANELS, panelFromPath } from "./kuryelerPwa";

describe("üç ayrı Hızlıgel uygulaması", () => {
  it("her panelin adı, kapsamı ve paket kimliği ayrıdır", () => {
    expect(PWA_APPS.musteri.name).toBe("Hızlıgel Müşteri");
    expect(PWA_APPS.kurye.name).toBe("Hızlıgel Kurye");
    expect(PWA_APPS.yonetici.name).toBe("Hızlıgel Yönetici");

    const scopes = PWA_PANELS.map(panel => PWA_APPS[panel].scope);
    expect(new Set(scopes).size).toBe(3);
    expect(PWA_APPS.musteri.scope).toBe("/musteri/");
    expect(PWA_APPS.kurye.scope).toBe("/kurye/");
    expect(PWA_APPS.yonetici.scope).toBe("/yonetici/");

    const ids = PWA_PANELS.map(panel => PWA_APPS[panel].id);
    expect(new Set(ids).size).toBe(3);

    const bundles = PWA_PANELS.map(panel => NATIVE_APPS[panel].appId);
    expect(bundles).toEqual(["tr.hizligel.musteri", "tr.hizligel.kurye", "tr.hizligel.yonetici"]);
  });

  it("kapsamlar birbirinin altına girmez", () => {
    expect(PWA_APPS.musteri.startUrl.startsWith(PWA_APPS.musteri.scope)).toBe(true);
    expect(PWA_APPS.kurye.startUrl.startsWith(PWA_APPS.kurye.scope)).toBe(true);
    expect(PWA_APPS.yonetici.startUrl.startsWith(PWA_APPS.yonetici.scope)).toBe(true);
    expect(PWA_APPS.musteri.scope.startsWith(PWA_APPS.kurye.scope)).toBe(false);
  });

  it("yolları doğru panele ayırır", () => {
    expect(panelFromPath("/musteri/")).toBe("musteri");
    expect(panelFromPath("/musteri/giris")).toBe("musteri");
    expect(panelFromPath("/kurye/")).toBe("kurye");
    expect(panelFromPath("/yonetici/giris")).toBe("yonetici");
    expect(panelFromPath("/")).toBe("site");
  });
});
