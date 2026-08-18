import { describe, expect, it } from "vitest";
import { canAdvanceDemo, demoPaymentLabel, demoRoute, demoSteps, nextDemoStatus } from "./demoFlow";

describe("safe demo flow", () => {
  it("advances courier delivery steps in order", () => {
    expect(nextDemoStatus("draft")).toBe("received");
    expect(nextDemoStatus("received")).toBe("accepted");
    expect(nextDemoStatus("accepted")).toBe("picked_up");
    expect(nextDemoStatus("picked_up")).toBe("on_the_way");
    expect(nextDemoStatus("on_the_way")).toBe("delivered");
    expect(nextDemoStatus("delivered")).toBeNull();
  });

  it("uses a clearly non-payment demo cash status", () => {
    expect(demoPaymentLabel()).toContain("Kapıda nakit");
    expect(demoRoute.totalTl).toBe(2114);
    expect(demoSteps).toHaveLength(6);
    expect(canAdvanceDemo("on_the_way")).toBe(true);
    expect(canAdvanceDemo("delivered")).toBe(false);
  });
});
