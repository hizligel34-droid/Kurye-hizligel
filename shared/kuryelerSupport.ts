/** Çağrı merkezi botu entegrasyon noktası.
 *  Bot yalnızca `support_messages` tablosuna sender='bot' satırı ekler.
 *  WhatsApp, SMS veya push otomatik gönderim yoktur.
 */

import {
  isActiveOrder,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "./kuryeler";

export const SUPPORT_BOT_TABLE = "support_messages";
export const SUPPORT_BOT_SENDER = "bot" as const;

export const SUPPORT_TICKET_KINDS = [
  "destek",
  "siparis",
  "hasar",
  "kayip",
  "sikayet",
  "iptal",
] as const;
export type SupportTicketKind = (typeof SUPPORT_TICKET_KINDS)[number];

export const SUPPORT_TICKET_STATUSES = ["acik", "cevap_bekliyor", "yanitlandi", "kapali"] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const SUPPORT_SENDERS = ["customer", "admin", "bot"] as const;
export type SupportSender = (typeof SUPPORT_SENDERS)[number];

export const SUPPORT_KIND_LABELS: Record<SupportTicketKind, string> = {
  destek: "Destek",
  siparis: "Sipariş",
  hasar: "Hasar",
  kayip: "Kayıp",
  sikayet: "Şikayet",
  iptal: "İptal",
};

export type SupportTicket = {
  id: string;
  customerId: string;
  orderId: string | null;
  trackingCode: string;
  kind: SupportTicketKind;
  status: SupportTicketStatus;
  subject: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportMessage = {
  id: string;
  ticketId: string;
  sender: SupportSender;
  senderId: string | null;
  body: string;
  photoUrl: string | null;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  orderId: string | null;
  readAt: string | null;
  createdAt: string;
};

export function canCustomerCancel(status: OrderStatus) {
  return isActiveOrder(status);
}

export function cancelCopy(status: OrderStatus): { title: string; body: string } {
  const afterPickup = status === "picked_up" || status === "en_route";
  if (afterPickup) {
    return {
      title: "Siparişi iptal et",
      body: "Kurye paketi aldı veya yola çıktı. İptal kaydı yöneticiye düşer; yoldaki işlerde masraf doğabilir. Bu ekranda iade sözü verilmez.",
    };
  }
  return {
    title: "Siparişi iptal et",
    body: "Kurye henüz paketi almadı. İptal kaydı yöneticiye düşer. Bu ekranda ücret iadesi sözü verilmez.",
  };
}

export function validateSupportBody(body: string): string | null {
  const trimmed = body.trim();
  if (trimmed.length < 4) return "Mesajınızı biraz daha ayrıntılı yazın.";
  if (trimmed.length > 4000) return "Mesaj 4000 karakteri aşamaz.";
  return null;
}

export function validateClaimInput(input: {
  kind: SupportTicketKind;
  trackingCode: string;
  body: string;
  photoUrl?: string | null;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.kind !== "hasar" && input.kind !== "kayip" && input.kind !== "sikayet") {
    errors.kind = "Hasar, kayıp veya şikayet seçin.";
  }
  if (!input.trackingCode.trim()) errors.trackingCode = "İş kodunu yazın.";
  const bodyError = validateSupportBody(input.body);
  if (bodyError) errors.body = bodyError;
  if ((input.kind === "hasar" || input.kind === "kayip") && !input.photoUrl) {
    errors.photo = "Hasar ve kayıp için fotoğraf ekleyin.";
  }
  return errors;
}

export function claimDisclaimer() {
  return "Kayıt yönetici kuyruğuna düşer. Bu form otomatik tazminat veya iade sözü vermez.";
}

export function ticketSubject(kind: SupportTicketKind, trackingCode?: string) {
  const code = trackingCode?.trim();
  if (kind === "siparis" && code) return `Sipariş ${code}`;
  if (code) return `${SUPPORT_KIND_LABELS[kind]} · ${code}`;
  return SUPPORT_KIND_LABELS[kind];
}

export function canBotReply(ticket: Pick<SupportTicket, "status">) {
  return ticket.status !== "kapali";
}

/** Botun bağlanacağı sade bağlam. Ödeme/süre sözü içermez. */
export function botContextPayload(input: {
  ticket: SupportTicket;
  orderStatus?: OrderStatus | null;
  messages: SupportMessage[];
}) {
  return {
    channel: SUPPORT_BOT_TABLE,
    sender: SUPPORT_BOT_SENDER,
    ticketId: input.ticket.id,
    kind: input.ticket.kind,
    trackingCode: input.ticket.trackingCode,
    orderStatus: input.orderStatus ?? null,
    history: input.messages.map(message => ({
      sender: message.sender,
      body: message.body,
      createdAt: message.createdAt,
    })),
  };
}

export function orderStatusNotification(
  status: OrderStatus,
  durationMin?: number | null,
): { title: string; body: string } {
  switch (status) {
    case "assigned":
      return { title: "Kurye atandı", body: "Kurye atandı, alıma gidiyor." };
    case "picked_up":
      return { title: "Paket alındı", body: "Siparişiniz kurye tarafından alındı." };
    case "en_route": {
      const eta =
        durationMin && durationMin > 0
          ? ` Tahmini varış yaklaşık ${Math.round(durationMin)} dk, trafiğe göre değişebilir.`
          : " Tahmini süre trafiğe göre değişebilir.";
      return { title: "Yola çıktı", body: `Siparişiniz yola çıktı.${eta}` };
    }
    case "delivered":
      return { title: "Teslim edildi", body: "Siparişiniz teslim edildi." };
    case "cancelled":
      return { title: "İptal", body: "Siparişiniz iptal edildi." };
    default:
      return { title: "Sipariş güncellendi", body: "Sipariş durumunuz güncellendi." };
  }
}

export function paymentHint(method: PaymentMethod, status: PaymentStatus) {
  if (status === "odendi") return "Ödendi olarak işaretlendi.";
  if (method === "havale") return "Havale bilgisi onayda iletilir.";
  if (method === "kart_kapida") return "Kapıda kart için POS henüz yok; kurye tahsilatı not eder.";
  return "Kapıda nakit ödenecek.";
}
