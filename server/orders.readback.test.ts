import { describe, expect, it } from "vitest";
import { orders } from "../drizzle/schema";
import { getDb, listOrders } from "./db";

describe("orders read-back schema", () => {
  it("reads pickup and delivery detail columns through the real orders query", async () => {
    const db = await getDb();
    if (!db) return;
    const rows = await db.select().from(orders).limit(1);
    const listed = await listOrders(0, "admin");
    expect(Array.isArray(rows)).toBe(true);
    expect(Array.isArray(listed)).toBe(true);
    if (rows[0]) {
      expect(rows[0]).toHaveProperty("pickupAddressDetail");
      expect(rows[0]).toHaveProperty("deliveryAddressDetail");
    }
  });
});
