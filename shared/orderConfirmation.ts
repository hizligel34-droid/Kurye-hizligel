import {
  BUSINESS,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  breakdownFromOrder,
  formatDateTimeTr,
  formatKm,
  formatPriceBreakdown,
  formatTariff,
  VAT_EXCL_LABEL,
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
    `Alım: ${order.pickupAddress}`,
    `Teslim: ${order.dropoffAddress}`,
    `Sürüş: ${formatKm(order.distanceKm)}`,
    `Ağırlık: ${order.weightKg} kg`,
    `Tarih/saat: ${formatDateTimeTr(order.scheduledAt)}`,
    `Tarife: ${formatTariff()}`,
    `Ücret: ${formatPriceBreakdown(price)}`,
    `Ödeme: ${order.paymentMethod}`,
    ``,
    `Hizmet sağlayıcı: ${BUSINESS.legalName} – Hızlıgel / kuryeler.tr`,
    `VKN: ${BUSINESS.taxOffice} / ${BUSINESS.taxId}`,
    `Adres: ${BUSINESS.address}`,
    `Telefon: ${CONTACT_PHONE_DISPLAY} · ${CONTACT_EMAIL}`,
    ``,
    `Cayma: Bu hizmet seçtiğiniz tarih ve saatte yapılan bir eşya taşımasıdır ve onayınızla hemen başlar; bu nedenle cayma hakkı kullanılamaz (Mesafeli Sözleşmeler Yönetmeliği md.15/1-g, h). Kurye atanmadan önce ücretsiz iptal edebilirsiniz.`,
    ``,
    `Fiyatlar sabit Türk lirasıdır; tarife ${VAT_EXCL_LABEL}tır, üzerine KDV eklenir.`,
    `Sipariş ve ön bilgi metni hesabınızın Geçmiş sekmesinde saklanır.`,
  ].join("\n");
  return { kind: "order_confirmation", toEmail, subject, body };
}
