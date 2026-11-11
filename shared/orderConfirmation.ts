import {
  BUSINESS,
  CONTACT_PHONE_DISPLAY,
  DELIVERY_TARGET_DISCLAIMER,
  SAME_DAY_CITY_DELIVERY,
  breakdownFromOrder,
  formatCustomerDelivery,
  formatDateTimeTr,
  formatKm,
  formatPriceBreakdown,
  formatPriceHint,
  formatPriceInclusive,
  formatTariff,
  isDeliveryTargetsPublic,
  type DeliveryOrder,
} from "./kuryeler";

export type OutboundMail = {
  id: string;
  kind: string;
  toEmail: string;
  subject: string;
  body: string;
  createdAt: string;
};

export function buildOrderConfirmationMail(order: DeliveryOrder, toEmail: string): Omit<OutboundMail, "id" | "createdAt"> {
  const subject = `Sipariş teyidi · ${order.trackingCode}`;
  const price = breakdownFromOrder(order);
  const body = [
    `Hızlıgel / kuryeler.tr sipariş teyidi`,
    ``,
    `Takip kodu: ${order.trackingCode}`,
    `Hizmet: İstanbul içi kurye ile ${order.product || "gönderi"} taşıma`,
    `Teslim: ${formatCustomerDelivery(order.distanceKm)}`,
    ...(isDeliveryTargetsPublic()
      ? [`${SAME_DAY_CITY_DELIVERY}. ${DELIVERY_TARGET_DISCLAIMER}`]
      : []),
    `Alım: ${order.pickupAddress}`,
    `Teslim: ${order.dropoffAddress}`,
    `Sürüş: ${formatKm(order.distanceKm)}`,
    `Ağırlık: ${order.weightKg} kg`,
    `Tarih/saat: ${formatDateTimeTr(order.scheduledAt)}`,
    `Tarife: ${formatTariff()}`,
    `Ücret: ${formatPriceInclusive(price)}`,
    `Kırılım: ${formatPriceHint(price)}`,
    `Fatura ayrıntısı: ${formatPriceBreakdown(price)}`,
    `Ödeme: ${order.paymentMethod}`,
    ``,
    `Hizmet sağlayıcı: ${BUSINESS.legalName} – Hızlıgel / kuryeler.tr`,
    `İşletme sahibi: ${BUSINESS.ownerName}`,
    `Vergi dairesi: ${BUSINESS.taxOffice}`,
    `VKN: ${BUSINESS.taxId}`,
    `KEP: ${BUSINESS.kep}`,
    `Adres: ${BUSINESS.address}`,
    `Telefon: ${CONTACT_PHONE_DISPLAY} · E-posta: ${BUSINESS.email}`,
    ``,
    `Cayma: Bu hizmet seçtiğiniz tarih ve saatte yapılan bir eşya taşımasıdır ve onayınızla hemen başlar; bu nedenle cayma hakkı kullanılamaz (Mesafeli Sözleşmeler Yönetmeliği md.15/1-g, h). Kurye atanmadan önce ücretsiz iptal edebilirsiniz.`,
    ``,
    `Görünen ücret ${formatPriceInclusive(price)} tutarıdır. Fatura satırları KDV hariç + KDV kırılımını içerir.`,
    `Sipariş ve ön bilgi metni hesabınızın Geçmiş sekmesinde saklanır.`,
  ].join("\n");
  return { kind: "order_confirmation", toEmail, subject, body };
}
