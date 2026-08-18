import { describe, expect, it } from "vitest";
import { evaluateSandboxPayment, filterAndSortCourierReport } from "./db";

describe("sandbox payment", () => {
  it("approves a valid test card without real collection", () => {
    expect(evaluateSandboxPayment({ cardNumber: "4242 4242 4242 4242", amount: 1100 })).toEqual({ status: "approved", message: "Sandbox ödeme başarılı. Gerçek tahsilat yapılmadı.", amount: 1100 });
  });
  it("declines the documented decline card", () => {
    expect(evaluateSandboxPayment({ cardNumber: "4000000000000002", amount: 600 }).status).toBe("declined");
  });
});

describe("courier report filters", () => {
  const rows = [
    { id: 1, trackingCode: "RUN-1", status: "delivered", totalPrice: "1000", courierEarning: "800", createdAt: new Date("2026-08-01T10:00:00Z") },
    { id: 2, trackingCode: "RUN-2", status: "on_the_way", totalPrice: "600", courierEarning: "480", createdAt: new Date("2026-08-03T10:00:00Z") },
  ];
  it("filters by status and sorts by earnings", () => {
    const result = filterAndSortCourierReport(rows, { status: "delivered", sortBy: "earning", direction: "desc" });
    expect(result.map(row => row.trackingCode)).toEqual(["RUN-1"]);
  });
  it("applies date boundaries", () => {
    const result = filterAndSortCourierReport(rows, { from: "2026-08-02", to: "2026-08-03", sortBy: "date", direction: "desc" });
    expect(result.map(row => row.trackingCode)).toEqual(["RUN-2"]);
  });
});
