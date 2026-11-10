import { describe, expect, it } from "vitest";
import { ALLOW_COURIER_SELF_SIGNUP, STATUS_LABELS, displayStatus, paymentStatusLabel, trackStepReached } from "./kuryeler";
import {
  botContextPayload,
  canBotReply,
  canCustomerCancel,
  cancelCopy,
  claimDisclaimer,
  orderStatusNotification,
  paymentHint,
  validateClaimInput,
  validateSupportBody,
} from "./kuryelerSupport";

describe("müşteri iptal ve destek metinleri", () => {
  it("teslim edilmemiş siparişte iptale izin verir", () => {
    expect(canCustomerCancel("pending")).toBe(true);
    expect(canCustomerCancel("assigned")).toBe(true);
    expect(canCustomerCancel("en_route")).toBe(true);
    expect(canCustomerCancel("delivered")).toBe(false);
    expect(canCustomerCancel("cancelled")).toBe(false);
  });

  it("iptal metninde iade sözü vermez", () => {
    const before = cancelCopy("pending");
    const after = cancelCopy("en_route");
    expect(before.body).toMatch(/iadesi sözü verilmez/i);
    expect(after.body).toMatch(/iade sözü verilmez/i);
    expect(after.body).toMatch(/masraf/);
    expect(`${before.body} ${after.body}`).not.toMatch(/iade edilecek|garanti/i);
  });

  it("hasar formunda tazminat sözü yoktur", () => {
    expect(claimDisclaimer()).toMatch(/sözü vermez/);
    expect(
      validateClaimInput({
        kind: "hasar",
        trackingCode: "KY-ABC",
        body: "Paket ezilmiş görünüyor.",
        photoUrl: null,
      }).photo,
    ).toMatch(/fotoğraf/);
  });

  it("kısa destek mesajını reddeder", () => {
    expect(validateSupportBody("ok")).toMatch(/ayrıntılı/);
    expect(validateSupportBody("Kapıda kimse yoktu, fotoğraf ekledim.")).toBeNull();
  });
});

describe("durum etiketleri ve uygulama içi bildirim", () => {
  it("assigned için ayrı etiket gösterir", () => {
    expect(STATUS_LABELS.assigned).toBe("Kurye atandı, alıma gidiyor");
    expect(displayStatus("assigned")).toBe("assigned");
  });

  it("iptalde tüm basamakları sönük bırakır", () => {
    expect(trackStepReached("cancelled", "pending")).toBe(false);
    expect(trackStepReached("cancelled", "delivered")).toBe(false);
    expect(trackStepReached("assigned", "pending")).toBe(true);
    expect(trackStepReached("assigned", "picked_up")).toBe(false);
    expect(trackStepReached("en_route", "assigned")).toBe(true);
  });

  it("bildirimde süre veya ödeme sözü vermez", () => {
    const enRoute = orderStatusNotification("en_route", 22);
    expect(enRoute.body).toMatch(/değişebilir/);
    expect(enRoute.body).not.toMatch(/garanti|iade|ödeme alındı/i);
  });

  it("ödeme etiketini yönteme göre ayırır", () => {
    expect(paymentStatusLabel("nakit", "bekliyor")).toBe("Kapıda ödenecek");
    expect(paymentStatusLabel("iyzico", "bekliyor")).toBe("Kart ödemesi bekleniyor");
    expect(paymentHint("iyzico", "bekliyor")).toMatch(/iyzico/);
  });
});

describe("çağrı merkezi botu entegrasyon noktası", () => {
  it("kapalı bilete cevap yazmaz", () => {
    expect(canBotReply({ status: "kapali" })).toBe(false);
    expect(canBotReply({ status: "acik" })).toBe(true);
  });

  it("bota sipariş ve yazışma bağlamı verir", () => {
    const payload = botContextPayload({
      ticket: {
        id: "t1",
        customerId: "c1",
        orderId: "o1",
        trackingCode: "KY-TEST",
        kind: "siparis",
        status: "acik",
        subject: "Sipariş KY-TEST",
        createdAt: "2026-11-10T00:00:00.000Z",
        updatedAt: "2026-11-10T00:00:00.000Z",
      },
      orderStatus: "assigned",
      messages: [
        {
          id: "m1",
          ticketId: "t1",
          sender: "customer",
          senderId: "c1",
          body: "Kurye nerede?",
          photoUrl: null,
          createdAt: "2026-11-10T00:00:00.000Z",
        },
      ],
    });
    expect(payload.channel).toBe("support_messages");
    expect(payload.sender).toBe("bot");
    expect(payload.trackingCode).toBe("KY-TEST");
    expect(payload.history[0]?.body).toMatch(/Kurye/);
  });
});

describe("kurye kendi kaydı", () => {
  it("varsayılan olarak kapalıdır", () => {
    expect(ALLOW_COURIER_SELF_SIGNUP).toBe(false);
  });
});
