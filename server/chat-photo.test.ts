import { describe, expect, it } from "vitest";
import { decodeChatPhoto, safeDocumentName } from "./routers";

describe("chat photo validation", () => {
  it("accepts a valid PNG data URL and preserves bytes", () => {
    const result = decodeChatPhoto("data:image/png;base64,iVBORw0KGgo=", "image/png");
    expect(result.bytes.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  });

  it("rejects unsupported types and mismatched content", () => {
    expect(() => decodeChatPhoto("data:text/plain;base64,SGVsbG8=", "text/plain")).toThrow("JPG, PNG veya WebP");
    expect(() => decodeChatPhoto("data:image/png;base64,SGVsbG8=", "image/png")).toThrow("eşleşmiyor");
  });

  it("sanitizes uploaded file names", () => {
    expect(safeDocumentName("../../bina girişi?.png")).toBe("bina_giri_i_.png");
  });
});
