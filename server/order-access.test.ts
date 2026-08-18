import { describe, expect, it } from "vitest";
import { canAccessOrder } from "./routers";

describe("order access roles", () => {
  const order = { customerId: 10, courierId: 20 };

  it("allows the customer to access their own order only", () => {
    expect(canAccessOrder({ id: 10, role: "user" }, order)).toBe(true);
    expect(canAccessOrder({ id: 11, role: "user" }, order)).toBe(false);
  });

  it("allows only the assigned courier", () => {
    expect(canAccessOrder({ id: 20, role: "courier" }, order)).toBe(true);
    expect(canAccessOrder({ id: 21, role: "courier" }, order)).toBe(false);
  });

  it("allows admin access regardless of assignment", () => {
    expect(canAccessOrder({ id: 99, role: "admin" }, order)).toBe(true);
  });
});
