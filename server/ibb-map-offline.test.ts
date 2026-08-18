import { describe, expect, it } from "vitest";
import { resolveOfflineMapViewState } from "../client/src/lib/offlinePackages";

describe("IBB offline map view state", () => {
  it("online bağlantıda canlı durumu seçer", () => {
    expect(resolveOfflineMapViewState(true, false, false)).toBe("online");
  });

  it("cached paket okunurken loading durumunu seçer", () => {
    expect(resolveOfflineMapViewState(false, false, true)).toBe("loading");
  });

  it("cached PMTiles hazırsa ready durumunu seçer", () => {
    expect(resolveOfflineMapViewState(false, true, false)).toBe("ready");
  });

  it("paket yoksa not-ready durumunu seçer", () => {
    expect(resolveOfflineMapViewState(false, false, false)).toBe("not-ready");
  });

  it("paket açma hatasını error durumuna taşır", () => {
    expect(resolveOfflineMapViewState(false, false, false, "PMTiles açılamadı")).toBe("error");
  });
});
