import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { orders } from "../drizzle/schema";
import { getDb } from "./db";

const rollback = Symbol("rollback");

describe("orders persisted address details", () => {
  it("reads both detail columns back from a rolled-back real transaction", async () => {
    const db = await getDb();
    if (!db) return;
    const trackingCode = `T-${Date.now()}`;
    await expect(db.transaction(async tx => {
      await tx.insert(orders).values({
        trackingCode,
        customerId: 1,
        pickupAddress: "Kadıköy İstanbul",
        pickupProvince: "İstanbul",
        pickupDistrict: "Kadıköy",
        pickupNeighborhood: "Caferağa",
        pickupStreet: "Moda Caddesi",
        pickupAddressDetail: "No: 10",
        deliveryAddress: "Beşiktaş İstanbul",
        deliveryProvince: "İstanbul",
        deliveryDistrict: "Beşiktaş",
        deliveryNeighborhood: "Vişnezade",
        deliveryStreet: "Dolmabahçe Caddesi",
        deliveryAddressDetail: "D: 4",
        productDescription: "Test transaction",
        customerPhone: "05550000000",
        distanceKm: "8.40",
        routeDurationMinutes: "25.0",
        routeStatus: "verified",
        routeProvider: "test",
        pickupLatitude: "41.0100000",
        pickupLongitude: "28.9700000",
        deliveryLatitude: "41.0400000",
        deliveryLongitude: "29.0000000",
        totalPrice: "940.00",
        commission: "188.00",
        courierEarning: "752.00",
        companyRevenue: "188.00",
        status: "received",
      });
      const rows = await tx.select().from(orders).where(eq(orders.trackingCode, trackingCode)).limit(1);
      expect(rows[0]).toMatchObject({ pickupAddressDetail: "No: 10", deliveryAddressDetail: "D: 4" });
      throw rollback;
    })).rejects.toBe(rollback);
  });
});
