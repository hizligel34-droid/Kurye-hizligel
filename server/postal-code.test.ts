import { describe, expect, it } from "vitest";
import { getPostalCodeForNeighborhood, getPostalCodesForNeighborhood } from "../client/src/lib/addressDirectory";

describe("İstanbul otomatik posta kodu eşleştirmesi", () => {
  it("ilçe ve mahalle seçimiyle veri setindeki posta kodunu döndürür", () => {
    expect(getPostalCodeForNeighborhood("Adalar", "Burgazada Mahallesi")).toBe("34975");
    expect(getPostalCodeForNeighborhood("adalar", "burgazada mahallesi")).toBe("34975");
  });

  it("eşleşmeyen veya eksik seçimde boş fallback döndürür", () => {
    expect(getPostalCodesForNeighborhood("", "")).toEqual([]);
    expect(getPostalCodeForNeighborhood("Bilinmeyen İlçe", "Bilinmeyen Mahalle")).toBe("");
  });
});
