export type OrderFormFields = {
  pickupAddress: string;
  pickupProvince: string;
  pickupDistrict: string;
  pickupNeighborhood: string;
  pickupStreet: string;
  pickupBuildingNo: string;
  pickupApartmentNo: string;
  pickupFloor: string;
  pickupCourierNote: string;
  pickupAddressDetail: string;
  deliveryAddress: string;
  deliveryProvince: string;
  deliveryDistrict: string;
  deliveryNeighborhood: string;
  deliveryStreet: string;
  deliveryBuildingNo: string;
  deliveryApartmentNo: string;
  deliveryFloor: string;
  deliveryCourierNote: string;
  deliveryAddressDetail: string;
  productDescription: string;
  customerPhone: string;
};

export const ORDER_PRODUCT_DESCRIPTION_MAX = 500;
export const ORDER_ADDRESS_DETAIL_MAX = 240;
export const ORDER_BUILDING_NO_MAX = 30;
export const ORDER_APARTMENT_NO_MAX = 30;
export const ORDER_FLOOR_MAX = 20;
export const ORDER_COURIER_NOTE_MAX = 500;

export function normalizeTurkishMobilePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("90") && digits.length === 12
    ? `0${digits.slice(2)}`
    : digits.length === 10 && digits.startsWith("5")
      ? `0${digits}`
      : digits;
  return /^05\d{9}$/.test(local) ? local : "";
}

export function isValidTurkishMobilePhone(value: string) {
  return normalizeTurkishMobilePhone(value).length === 11;
}

export function isValidBuildingNo(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= ORDER_BUILDING_NO_MAX && /[0-9A-Za-zÇĞİÖŞÜçğıöşü]/.test(trimmed);
}

function normalizedAddressKey(parts: string[]) {
  return parts.map(value => value.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ")).join("|");
}

export function arePickupAndDeliveryDifferent(form: Pick<OrderFormFields,
  "pickupProvince" | "pickupDistrict" | "pickupNeighborhood" | "pickupStreet" | "pickupBuildingNo" |
  "deliveryProvince" | "deliveryDistrict" | "deliveryNeighborhood" | "deliveryStreet" | "deliveryBuildingNo"
>) {
  return normalizedAddressKey([
    form.pickupProvince, form.pickupDistrict, form.pickupNeighborhood, form.pickupStreet, form.pickupBuildingNo,
  ]) !== normalizedAddressKey([
    form.deliveryProvince, form.deliveryDistrict, form.deliveryNeighborhood, form.deliveryStreet, form.deliveryBuildingNo,
  ]);
}

export function isOrderFormComplete(form: OrderFormFields) {
  const required = [
    form.pickupAddress, form.pickupProvince, form.pickupDistrict, form.pickupNeighborhood, form.pickupStreet,
    form.deliveryAddress, form.deliveryProvince, form.deliveryDistrict, form.deliveryNeighborhood, form.deliveryStreet,
  ];
  return required.every(value => value.trim().length > 0)
    && isValidBuildingNo(form.pickupBuildingNo)
    && isValidBuildingNo(form.deliveryBuildingNo)
    && (form.pickupApartmentNo ?? "").length <= ORDER_APARTMENT_NO_MAX
    && (form.deliveryApartmentNo ?? "").length <= ORDER_APARTMENT_NO_MAX
    && (form.pickupFloor ?? "").length <= ORDER_FLOOR_MAX
    && (form.deliveryFloor ?? "").length <= ORDER_FLOOR_MAX
    && (form.pickupCourierNote ?? "").length <= ORDER_COURIER_NOTE_MAX
    && (form.deliveryCourierNote ?? "").length <= ORDER_COURIER_NOTE_MAX
    && form.pickupAddressDetail.length <= ORDER_ADDRESS_DETAIL_MAX
    && form.deliveryAddressDetail.length <= ORDER_ADDRESS_DETAIL_MAX
    && form.productDescription.trim().length >= 2
    && form.productDescription.trim().length <= ORDER_PRODUCT_DESCRIPTION_MAX
    && isValidTurkishMobilePhone(form.customerPhone)
    && arePickupAndDeliveryDifferent(form);
}

export const ORDER_FORM_INCOMPLETE_MESSAGE = "İki adresin ilçe, mahalle, cadde/sokak ve bina/kapı numarasını; en az 2 karakter ürün açıklamasını ve geçerli Türkiye cep telefonu numarasını doldurun. Alış ve teslim adresleri aynı olamaz.";

export function isRouteAddressComplete(form: Pick<OrderFormFields,
  "pickupProvince" | "pickupDistrict" | "pickupNeighborhood" | "pickupStreet" | "pickupBuildingNo" |
  "deliveryProvince" | "deliveryDistrict" | "deliveryNeighborhood" | "deliveryStreet" | "deliveryBuildingNo"
>) {
  return [
    form.pickupProvince, form.pickupDistrict, form.pickupNeighborhood, form.pickupStreet,
    form.deliveryProvince, form.deliveryDistrict, form.deliveryNeighborhood, form.deliveryStreet,
  ].every(value => value.trim().length > 0)
    && isValidBuildingNo(form.pickupBuildingNo)
    && isValidBuildingNo(form.deliveryBuildingNo)
    && arePickupAndDeliveryDifferent(form);
}
