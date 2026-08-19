import { describe, expect, it } from "vitest";
import { savedAddressInputSchema } from "./routers";

describe("saved address directory", () => {
  const validAddress = {
    label: "Ev",
    province: "İstanbul",
    district: "Kadıköy",
    neighborhood: "Caferağa",
    street: "Moda Caddesi",
    buildingNo: "24",
    apartmentNo: "7",
    floor: "3",
    courierNote: "Girişte güvenliğe teslim edilebilir.",
    addressDetail: "Apartman giriş kapısı, mavi tabela.",
  };

  it("accepts a complete saved address with apartment, floor and courier note", () => {
    expect(savedAddressInputSchema.parse(validAddress)).toMatchObject(validAddress);
  });

  it("keeps the favorite flag separate from address validation", () => {
    expect(savedAddressInputSchema.parse(validAddress)).not.toHaveProperty("isFavorite");
  });

  it("accepts saved addresses from every Turkish province", () => {
    expect(savedAddressInputSchema.parse({ ...validAddress, province: "Ankara", postalCode: "06000" })).toMatchObject({ province: "Ankara", postalCode: "06000" });
  });

  it("rejects saved addresses without a valid building number or detail", () => {
    expect(() => savedAddressInputSchema.parse({ ...validAddress, buildingNo: "" })).toThrow();
    expect(() => savedAddressInputSchema.parse({ ...validAddress, addressDetail: "kısa" })).toThrow();
  });
});
