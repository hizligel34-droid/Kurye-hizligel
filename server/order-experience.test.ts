import { describe, expect, it } from "vitest";
import { getOrderProgressPercent, getOrderProgressSteps } from "../shared/orderExperience";

describe("sipariş deneyimi ilerleme göstergesi", () => {
  it("tamamlanan adımları sıralı olarak sunar", () => {
    const steps = getOrderProgressSteps({ addressesReady: true, routeConfirmed: false, paymentApproved: false });
    expect(steps.map(step => step.id)).toEqual(["addresses", "route", "payment"]);
    expect(steps.map(step => step.complete)).toEqual([true, false, false]);
  });

  it("tamamlanan adımlardan yüzde hesaplar", () => {
    expect(getOrderProgressPercent({ addressesReady: false, routeConfirmed: false, paymentApproved: false })).toBe(0);
    expect(getOrderProgressPercent({ addressesReady: true, routeConfirmed: true, paymentApproved: false })).toBe(67);
    expect(getOrderProgressPercent({ addressesReady: true, routeConfirmed: true, paymentApproved: true })).toBe(100);
  });
});
