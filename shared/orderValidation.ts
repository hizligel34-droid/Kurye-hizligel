export type OrderFormFields = {
  pickupAddress: string;
  pickupProvince: string;
  pickupDistrict: string;
  pickupNeighborhood: string;
  pickupStreet: string;
  pickupAddressDetail: string;
  deliveryAddress: string;
  deliveryProvince: string;
  deliveryDistrict: string;
  deliveryNeighborhood: string;
  deliveryStreet: string;
  deliveryAddressDetail: string;
  productDescription: string;
  customerPhone: string;
};

export function isOrderFormComplete(form: OrderFormFields) {
  const required = [
    form.pickupAddress,
    form.pickupProvince,
    form.pickupDistrict,
    form.pickupNeighborhood,
    form.pickupStreet,
    form.pickupAddressDetail,
    form.deliveryAddress,
    form.deliveryProvince,
    form.deliveryDistrict,
    form.deliveryNeighborhood,
    form.deliveryStreet,
    form.deliveryAddressDetail,
  ];
  return required.every(value => value.trim().length > 0)
    && form.productDescription.trim().length >= 2
    && form.customerPhone.trim().length >= 7;
}

export const ORDER_FORM_INCOMPLETE_MESSAGE = "Sipariş için iki adresin ilçe, mahalle, cadde/sokak ve açık adres alanlarını; ürün açıklaması ile telefon numarasını doldurun.";
