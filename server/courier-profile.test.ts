import { describe, expect, it } from "vitest";
import { buildCourierChartData, summarizeCourierRows } from "../client/src/lib/courierProfile";

const rows = [
  { status: "delivered", courierEarning: "752", routeDurationMinutes: "30", createdAt: "2026-08-01T10:00:00Z" },
  { status: "delivered", courierEarning: 800, routeDurationMinutes: 40, createdAt: "2026-08-01T12:00:00Z" },
  { status: "on_the_way", courierEarning: "752", routeDurationMinutes: null, createdAt: "2026-08-02T10:00:00Z" },
  { status: "cancelled", courierEarning: "0", routeDurationMinutes: null, createdAt: "2026-08-03T10:00:00Z" },
];

describe("courier profile metrics", () => {
  it("summarizes earnings, completion, active and cancellation metrics", () => {
    expect(summarizeCourierRows(rows)).toMatchObject({
      totalOrders: 4,
      completed: 2,
      active: 1,
      cancelled: 1,
      earnings: 2304,
      successRate: 50,
      averageEarning: 1152,
      averageDuration: 35,
    });
  });

  it("groups chart data by day without inventing missing days", () => {
    expect(buildCourierChartData(rows)).toEqual([
      { date: "2026-08-01", deliveries: 2, earnings: 1552 },
      { date: "2026-08-02", deliveries: 0, earnings: 752 },
      { date: "2026-08-03", deliveries: 0, earnings: 0 },
    ]);
  });
});
