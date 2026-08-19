import { describe, expect, it } from "vitest";
import { composeStructuredAddress } from "../client/src/lib/addressDirectory";
import { buildOrderAddressDetails, calculateOrderFinancials } from "./db";
import { getOfflineRouteCapability, isOfflinePackageSizeAllowed, MAX_OFFLINE_PACKAGE_BYTES, readOfflineDownloadResponse } from "../client/src/lib/offlinePackages";
import { canConfirmOrder } from "../shared/routing";

describe("Run Kurye address and offline routing", () => {
  it("composes province, district, neighborhood, street and detail in order", () => {
    expect(composeStructuredAddress({
      province: "İstanbul",
      district: "Kadıköy",
      neighborhood: "Caferağa",
      street: "Moda Caddesi",
      detail: "No: 10 D: 4",
    })).toBe("Caferağa, Moda Caddesi, No: 10 D: 4, Kadıköy, İstanbul");
  });

  it("keeps pickup and delivery detail fields in the order persistence payload", () => {
    expect(buildOrderAddressDetails({ pickupAddressDetail: "No: 10", deliveryAddressDetail: "D: 4", pickupBuildingNo: "10", deliveryBuildingNo: "4", pickupApartmentNo: "2", deliveryFloor: "5", deliveryCourierNote: "Güvenliğe bırakmayın" })).toEqual({ pickupAddressDetail: "No: 10", pickupPostalCode: "", deliveryPostalCode: "", deliveryAddressDetail: "D: 4", pickupBuildingNo: "10", deliveryBuildingNo: "4", pickupApartmentNo: "2", deliveryApartmentNo: "", pickupFloor: "", deliveryFloor: "5", pickupCourierNote: "", deliveryCourierNote: "Güvenliğe bırakmayın" });
    expect(buildOrderAddressDetails({})).toEqual({ pickupAddressDetail: "Belirtilmedi", pickupPostalCode: "", deliveryPostalCode: "", deliveryAddressDetail: "Belirtilmedi", pickupBuildingNo: "", deliveryBuildingNo: "", pickupApartmentNo: "", deliveryApartmentNo: "", pickupFloor: "", deliveryFloor: "", pickupCourierNote: "", deliveryCourierNote: "" });
  });

  it("combines verified road distance pricing with the fixed 20 percent commission", () => {
    const financials = calculateOrderFinancials(8.4);
    expect(financials.total).toBe(940);
    expect(financials.commission).toBe(188);
    expect(financials.courierEarning + financials.companyRevenue).toBe(financials.total);
  });

  it("does not claim that the free map package contains an offline routing engine", () => {
    expect(getOfflineRouteCapability()).toEqual({ status: "unavailable", reason: "map-package-only" });
  });

  it("blocks confirmation until the road route is verified", () => {
    expect(canConfirmOrder("unavailable")).toBe(false);
    expect(canConfirmOrder(undefined)).toBe(false);
    expect(canConfirmOrder("verified")).toBe(true);
  });

  it("enforces the mobile offline package size guard", () => {
    expect(isOfflinePackageSizeAllowed(22 * 1024 * 1024)).toBe(true);
    expect(isOfflinePackageSizeAllowed(MAX_OFFLINE_PACKAGE_BYTES + 1)).toBe(false);
    expect(isOfflinePackageSizeAllowed(-1)).toBe(false);
  });

  it("reports download progress and rejects HTTP or oversized responses", async () => {
    const progress: number[] = [];
    const ok = new Response(new Uint8Array([1, 2, 3, 4]), { status: 200, headers: { "content-length": "4" } });
    const blob = await readOfflineDownloadResponse(ok, value => progress.push(value));
    expect(blob.size).toBe(4);
    expect(progress.at(-1)).toBe(100);
    await expect(readOfflineDownloadResponse(new Response(null, { status: 503 }))).rejects.toThrow("indirilemedi");
    await expect(readOfflineDownloadResponse(new Response(new Uint8Array([1]), { status: 200, headers: { "content-length": String(MAX_OFFLINE_PACKAGE_BYTES + 1) } }))).rejects.toThrow("çok büyük");
  });
});
