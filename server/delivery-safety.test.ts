import { describe, expect, it } from "vitest";
import { decodeDeliveryPhoto, hashDeliveryOtp } from "./routers";

describe("secure delivery helpers", () => {
  it("hashes the same OTP deterministically without storing the raw code", () => {
    const first = hashDeliveryOtp("123456");
    expect(first).toHaveLength(64);
    expect(first).toBe(hashDeliveryOtp("123456"));
    expect(first).not.toBe("123456");
    expect(hashDeliveryOtp("654321")).not.toBe(first);
  });

  it("accepts a valid PNG proof image and rejects mismatched content", () => {
    const tinyPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    expect(decodeDeliveryPhoto(tinyPng, "image/png")).toBeInstanceOf(Buffer);
    expect(() => decodeDeliveryPhoto(tinyPng, "image/jpeg")).toThrow("dosya türüyle");
    expect(() => decodeDeliveryPhoto("bm90LWltYWdl", "image/png")).toThrow("dosya türüyle");
  });

  it("only permits supported delivery photo MIME types", () => {
    expect(() => decodeDeliveryPhoto("aGVsbG8=", "application/pdf")).toThrow("JPG, PNG veya WebP");
  });
});
