import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { getOfflinePackageInfo, hasOfflinePackage, OFFLINE_MAP_PACKAGES, storeOfflinePackage } from "../client/src/lib/offlinePackages";

describe("offline paket IndexedDB içe aktarma akışı", () => {
  afterEach(() => {
    indexedDB.deleteDatabase("run-kurye-offline");
  });

  it("ZIP/PMTiles blobunu kaydeder, hazır durumu ve metadata'yı geri okur", async () => {
    const pkg = OFFLINE_MAP_PACKAGES[0]!;
    const data = new Blob([new Uint8Array([80, 75, 3, 4, 1, 2, 3])], { type: "application/zip" });

    await storeOfflinePackage(pkg, data);

    expect(await hasOfflinePackage(pkg.id)).toBe(true);
    await expect(getOfflinePackageInfo(pkg.id)).resolves.toMatchObject({
      city: "İstanbul",
      sizeBytes: data.size,
    });
  });
});
