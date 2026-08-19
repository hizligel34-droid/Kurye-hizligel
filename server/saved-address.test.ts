import { describe, expect, it } from "vitest";
import { savedAddressInputSchema } from "./routers";

describe("saved address directory", () => {
  const validAddress = {
    label: "Ev",
    province: "İstanbul" as const,
    district: "Kadıköy",
    neighborhood: "Caferağa",
    street: "Moda Caddesi",
    buildingNo: "24",
    apartmentNo: "7",
    floor: "3",
    courierNote: "Girişte güvenliğe teslim edilebilir.",
    addressDetail: "Apartman giriş kapısı, mavi tabela.",
  };

  it("accepts a complete Istanbul address with apartment, floor and courier note", () => {
    expect(savedAddressInputSchema.parse(validAddress)).toMatchObject(validAddress);
  });

  it("rejects non-Istanbul saved addresses", () => {
    expect(() => savedAddressInputSchema.parse({ ...validAddress, province: "Ankara" })).toThrow();
  });

  it("rejects saved addresses without a valid building number or detail", () => {
    expect(() => savedAddressInputSchema.parse({ ...validAddress, buildingNo: "" })).toThrow();
    expect(() => savedAddressInputSchema.parse({ ...validAddress, addressDetail: "kısa" })).toThrow();
  });
});
