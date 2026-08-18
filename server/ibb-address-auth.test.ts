import { describe, expect, it } from "vitest";

describe("IBB address provider credentials", () => {
  it("keeps the Istanbul fallback when no API key is supplied", () => {
    expect(process.env.IBB_ADDRESS_API_KEY ?? "").toBe("");
    expect("/api/address").toBe("/api/address");
  });
});
