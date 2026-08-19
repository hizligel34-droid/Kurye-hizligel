import { describe, expect, it } from "vitest";
import { getPostalCodeForAddressOption } from "../client/src/lib/addressDirectory";

describe("kaynaklı otomatik posta kodu", () => {
  it("seçilen mahalle kaydındaki posta kodunu döndürür", () => {
    expect(getPostalCodeForAddressOption({ postalCode: "06420" })).toBe("06420");
  });

  it("posta kodu olmayan veya eksik kayıtta boş değer döndürür", () => {
    expect(getPostalCodeForAddressOption({})).toBe("");
    expect(getPostalCodeForAddressOption()).toBe("");
  });
});
