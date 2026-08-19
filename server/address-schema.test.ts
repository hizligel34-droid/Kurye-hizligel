import { describe, expect, it } from "vitest";
import { orderCreateInputSchema } from "./routers";

describe("orders.create address schema", () => {
  const valid = {
    pickupAddress: "Kadıköy, İstanbul",
    pickupProvince: "İstanbul",
    pickupDistrict: "Kadıköy",
    pickupNeighborhood: "Caferağa",
    pickupStreet: "Moda Caddesi",
    pickupBuildingNo: "10",
    pickupAddressDetail: "Bina 10, kapı 2",
    deliveryAddress: "Beşiktaş, İstanbul",
    deliveryProvince: "İstanbul",
    deliveryDistrict: "Beşiktaş",
    deliveryNeighborhood: "Vişnezade",
    deliveryStreet: "Dolmabahçe Caddesi",
    deliveryBuildingNo: "20",
    deliveryAddressDetail: "Bina 4",
    productDescription: "Evrak",
    customerPhone: "05321234567",
  };

  it("requires both Istanbul hierarchy selections and street details", () => {
    expect(orderCreateInputSchema.safeParse(valid).success).toBe(true);
    expect(orderCreateInputSchema.safeParse({ ...valid, pickupStreet: "" }).success).toBe(false);
    expect(orderCreateInputSchema.safeParse({ ...valid, deliveryNeighborhood: "" }).success).toBe(false);
  });

  it("accepts an order while a postal code lookup is unavailable", () => {
    const parsed = orderCreateInputSchema.safeParse({
      ...valid,
      pickupPostalCode: "",
      deliveryPostalCode: "",
      paymentMethod: "cash_on_delivery",
    });

    expect(parsed.success).toBe(true);
  });
});
