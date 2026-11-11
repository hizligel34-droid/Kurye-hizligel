import { describe, expect, it } from "vitest";
import {
  ALLOW_COURIER_SELF_SIGNUP,
  DEMO_LOCAL_ACCOUNTS,
  DEMO_LOCAL_PASSWORD,
  DEMO_SIGNUP_HINT,
  STATUS_LABELS,
  assertSelfSignupAllowed,
  canSelfSignupRole,
  displayStatus,
  isLocalDemoPreview,
  paymentStatusLabel,
  trackStepReached,
} from "./kuryeler";
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

describe("yerel demo önizleme kaydı", () => {
  it("Supabase yokken veya VITE_DEMO=1 iken yerel demoyu açar", () => {
    expect(isLocalDemoPreview({})).toBe(true);
    expect(
      isLocalDemoPreview({
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_ANON_KEY: "anon-key",
      }),
    ).toBe(false);
    expect(
      isLocalDemoPreview({
        VITE_DEMO: "1",
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_ANON_KEY: "anon-key",
      }),
    ).toBe(true);
  });

  it("canlıda kurye ve yönetici self-kaydı kapalı kalır", () => {
    expect(canSelfSignupRole("customer", false)).toBe(true);
    expect(canSelfSignupRole("courier", false)).toBe(false);
    expect(canSelfSignupRole("admin", false)).toBe(false);
    expect(ALLOW_COURIER_SELF_SIGNUP).toBe(false);
    expect(() => assertSelfSignupAllowed("customer", false)).not.toThrow();
    expect(() => assertSelfSignupAllowed("courier", false)).toThrow(/açılmaz/);
    expect(() => assertSelfSignupAllowed("admin", false)).toThrow(/açılmaz/);
  });

  it("demo kipinde kurye ve yönetici kaydı açılır; şifre UI metninde yok", () => {
    expect(canSelfSignupRole("courier", true)).toBe(true);
    expect(canSelfSignupRole("admin", true)).toBe(true);
    expect(DEMO_SIGNUP_HINT).toBe("Demo kipinde kayıt olabilirsiniz");
    expect(DEMO_SIGNUP_HINT.toLocaleLowerCase("tr-TR")).not.toContain(DEMO_LOCAL_PASSWORD.toLocaleLowerCase("tr-TR"));
    expect(DEMO_LOCAL_ACCOUNTS.customer.email).toBe("musteri@demo.local");
    expect(DEMO_LOCAL_ACCOUNTS.courier.email).toBe("kurye@demo.local");
    expect(DEMO_LOCAL_ACCOUNTS.admin.email).toBe("yonetici@demo.local");
  });
});
