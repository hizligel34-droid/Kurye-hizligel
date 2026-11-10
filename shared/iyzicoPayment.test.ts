import { describe, expect, it } from "vitest";
import { DEFAULT_BUSINESS_PROFILE, kunyeDisplayLines, kunyeShowsMersis, maskTaxId, stripSecretsForLog } from "./businessProfile";
import {
  DEFAULT_INVOICE_PROVIDER,
  invoiceAlarmAt,
  invoiceDeadlineAt,
  invoiceNeedsAlarm,
  invoicePastDeadline,
} from "./invoice";
import {
  assertNoCardFields,
  assertTry,
  canReadPayment,
  canWritePayment,
  decideRefund,
  hmacSha256Hex,
  iyzicoAuthorizationHeader,
  iyzicoCommissionKurus,
  iyzicoV2SigningPayload,
  IYZICO_CURRENCY,
  IYZICO_PAYMENT_GROUP_OWN,
  IYZICO_SANDBOX_URL,
  kurusToIyzicoPrice,
  serverPriceKurus,
  verifyIyzicoWebhookSignature,
} from "./iyzicoPayment";

describe("iyzico tutar hesabı (kuruş, TRY)", () => {
  it("3 / 10 / 30 km için 60000 + 5000×km ve %20 KDV üretir", () => {
    expect(serverPriceKurus(3)).toEqual({
      currency: "TRY",
      distanceKm: 3,
      netKurus: 75000,
      vatKurus: 15000,
      grossKurus: 90000,
    });
    expect(serverPriceKurus(10)).toEqual({
      currency: "TRY",
      distanceKm: 10,
      netKurus: 110000,
      vatKurus: 22000,
      grossKurus: 132000,
    });
    expect(serverPriceKurus(30)).toEqual({
      currency: "TRY",
      distanceKm: 30,
      netKurus: 210000,
      vatKurus: 42000,
      grossKurus: 252000,
    });
  });

  it("iyzico tutarını iki ondalıklı TL dizesine çevirir", () => {
    expect(kurusToIyzicoPrice(132000)).toBe("1320.00");
    expect(IYZICO_CURRENCY).toBe("TRY");
    expect(IYZICO_PAYMENT_GROUP_OWN).toBe("LISTING");
    expect(IYZICO_SANDBOX_URL).toBe("https://sandbox-api.iyzipay.com");
  });

  it("TRY dışını reddeder ve kart alanı taşıyan gövdeyi reddeder", () => {
    expect(() => assertTry("USD")).toThrow(/TRY/);
    expect(() => assertNoCardFields({ cardNumber: "4111111111111111" })).toThrow(/Kart verisi/);
    expect(() => assertNoCardFields({ orderId: "abc" })).not.toThrow();
  });
});

describe("iyzico imza", () => {
  it("IYZWSv2 HMAC-SHA256 imzasını üretir", async () => {
    const secret = "sandbox-secret";
    const randomKey = "rand-1";
    const uriPath = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
    const body = "{\"price\":\"1320.00\"}";
    const expected = await hmacSha256Hex(secret, iyzicoV2SigningPayload(randomKey, uriPath, body));
    const header = await iyzicoAuthorizationHeader({
      apiKey: "sandbox-key",
      secretKey: secret,
      randomKey,
      uriPath,
      body,
    });
    expect(header.startsWith("IYZWSv2 ")).toBe(true);
    const decoded = atob(header.slice("IYZWSv2 ".length));
    expect(decoded).toContain("apiKey:sandbox-key");
    expect(decoded).toContain(`signature:${expected}`);
  });

  it("webhook HMAC adaylarından biriyle doğrular", async () => {
    const secret = "whsec";
    const token = "tok-1";
    const eventType = "CHECKOUT_FORM_AUTH";
    const ok = await hmacSha256Hex(secret, secret + eventType + "" + token);
    expect(
      await verifyIyzicoWebhookSignature({
        secretKey: secret,
        provided: ok,
        eventType,
        token,
      }),
    ).toBe(true);
    expect(
      await verifyIyzicoWebhookSignature({
        secretKey: secret,
        provided: "deadbeef",
        eventType,
        token,
      }),
    ).toBe(false);
  });
});

describe("iyzico komisyon ve iade", () => {
  it("komisyonu ayrı kuruş alanda toplar; müşteri tutarına eklemez", () => {
    const commission = iyzicoCommissionKurus({
      iyziCommissionRateAmount: 56.63,
      iyziCommissionFee: 0.25,
    });
    expect(commission.totalKurus).toBe(5688);
    expect(serverPriceKurus(10).grossKurus).toBe(132000);
  });

  it("fatura yoksa cancel/refund, varsa yönetici onayı ve 8 gün bayrağı üretir", () => {
    expect(decideRefund({ hasInvoice: false }).action).toBe("cancel_or_refund");
    const issued = new Date("2026-11-01T00:00:00.000Z");
    expect(
      decideRefund({ hasInvoice: true, invoiceIssuedAt: issued, now: new Date("2026-11-05T00:00:00.000Z") }),
    ).toMatchObject({ action: "admin_invoice_cancel", adminRequired: true, within8Days: true });
    expect(
      decideRefund({ hasInvoice: true, invoiceIssuedAt: issued, now: new Date("2026-11-12T00:00:00.000Z") }),
    ).toMatchObject({
      action: "admin_accounting_correction",
      accountingCorrectionRequired: true,
      within8Days: false,
    });
  });
});

describe("fatura teslim +5 / +7 gün", () => {
  it("alarm ve süre sonunu teslimden hesaplar", () => {
    const delivered = new Date("2026-11-10T12:00:00.000Z");
    expect(invoiceAlarmAt(delivered).toISOString()).toBe("2026-11-15T12:00:00.000Z");
    expect(invoiceDeadlineAt(delivered).toISOString()).toBe("2026-11-17T12:00:00.000Z");
    expect(invoiceNeedsAlarm(delivered, new Date("2026-11-16T12:00:00.000Z"))).toBe(true);
    expect(invoicePastDeadline(delivered, new Date("2026-11-18T12:00:00.000Z"))).toBe(true);
  });

  it("ücretli sağlayıcıyı çağırmaz", async () => {
    await expect(DEFAULT_INVOICE_PROVIDER.issue({
      orderId: "1",
      netKurus: 110000,
      vatKurus: 22000,
      grossKurus: 132000,
      buyerName: "Ayşe",
    })).rejects.toThrow(/ücretli/);
  });
});

describe("ödeme RLS", () => {
  it("müşteri yalnız kendi ödemesini okur; yazma service_role", () => {
    expect(canReadPayment("authenticated_customer", "u1", "u1")).toBe(true);
    expect(canReadPayment("authenticated_customer", "u1", "u2")).toBe(false);
    expect(canReadPayment("authenticated_courier", "c1", "u1")).toBe(false);
    expect(canReadPayment("admin", "a1", "u1")).toBe(true);
    expect(canWritePayment("authenticated_customer")).toBe(false);
    expect(canWritePayment("admin")).toBe(false);
    expect(canWritePayment("service_role")).toBe(true);
  });
});

describe("esnaf künye", () => {
  it("MERSİS satırı göstermez; VKN, vergi dairesi, KEP ve sahibi gösterir", () => {
    expect(DEFAULT_BUSINESS_PROFILE.traderKind).toBe("esnaf");
    expect(DEFAULT_BUSINESS_PROFILE.ownerName).toBe("Canan Tekin");
    expect(DEFAULT_BUSINESS_PROFILE.kep).toBe("?");
    expect(DEFAULT_BUSINESS_PROFILE.email).toBe("serif.tekin@hotmail.com");
    expect(kunyeDisplayLines().find(line => line.label === "E-posta")?.value).toBe(
      "serif.tekin@hotmail.com",
    );
    expect(kunyeShowsMersis()).toBe(false);
    const labels = kunyeDisplayLines().map(line => line.label);
    expect(labels).not.toContain("MERSİS");
    expect(labels).toContain("Vergi dairesi");
    expect(labels).toContain("Vergi kimlik no");
    expect(labels).toContain("KEP adresi");
    expect(labels).toContain("İşletme sahibi");
    const vkn = kunyeDisplayLines().find(line => line.label === "Vergi kimlik no");
    expect(vkn?.value).toBe("?");
    expect(DEFAULT_BUSINESS_PROFILE).not.toHaveProperty("tckn");
    expect(JSON.stringify(DEFAULT_BUSINESS_PROFILE)).not.toMatch(/TCKN|identityNumber/);
  });

  it("VKN'yi logda maskeler ve kart alanını düşürür", () => {
    expect(maskTaxId("1234567890")).toBe("12****90");
    expect(stripSecretsForLog({ taxId: "1234567890", cardNumber: "4111", orderId: "o1" })).toEqual({
      taxId: "[redacted]",
      cardNumber: "[redacted]",
      orderId: "o1",
    });
  });
});
