import { describe, expect, it } from "vitest";
import { isOrderFormComplete, isRouteAddressComplete, type OrderFormFields } from "@shared/orderValidation";

const completeForm: OrderFormFields = {
  pickupAddress: "İstanbul Kadıköy Acıbadem Caddesi 10",
  pickupProvince: "İstanbul",
  pickupDistrict: "Kadıköy",
  pickupNeighborhood: "Acıbadem",
  pickupStreet: "Acıbadem Caddesi",
  pickupBuildingNo: "10",
  pickupAddressDetail: "Bina 10, kapı 2",
  deliveryAddress: "İstanbul Beşiktaş Nisbetiye Caddesi 20",
  deliveryProvince: "İstanbul",
  deliveryDistrict: "Beşiktaş",
  deliveryNeighborhood: "Levent",
  deliveryStreet: "Nisbetiye Caddesi",
  deliveryBuildingNo: "20",
  deliveryAddressDetail: "Bina 20, kapı 3",
  productDescription: "Evrak paketi",
  customerPhone: "05321234567",
};

describe("order form validation", () => {
  it("accepts a complete Istanbul order form", () => {
    expect(isOrderFormComplete(completeForm)).toBe(true);
  });

  it("rejects the payload shown by the mobile error: empty product and phone", () => {
    expect(isOrderFormComplete({ ...completeForm, productDescription: "", customerPhone: "" })).toBe(false);
  });

  it("rejects an address that only has free text without hierarchy", () => {
    expect(isOrderFormComplete({ ...completeForm, pickupDistrict: "", pickupNeighborhood: "", pickupStreet: "" })).toBe(false);
  });

  it("does not allow route pricing before both address hierarchies are complete", () => {
    expect(isRouteAddressComplete({ ...completeForm, deliveryDistrict: "", deliveryNeighborhood: "", deliveryStreet: "", deliveryAddressDetail: "" })).toBe(false);
    expect(isRouteAddressComplete(completeForm)).toBe(true);
  });
});
