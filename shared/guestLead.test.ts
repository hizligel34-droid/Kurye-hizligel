import { describe, expect, it } from "vitest";
import { ORDER_CHECKBOX_LABELS } from "./legalTexts";
import {
  buildGuestWhatsappText,
  formatConsumerGross,
  formatConsumerVatLine,
  isHoneypotFilled,
  quoteGuestLead,
  validateGuestLead,
} from "./guestLead";
import {
  BRAND_GOLD,
  HERO_HEADLINE,
  PRIMARY_CTA,
  SECONDARY_CTA,
  SERVICE_CARDS,
  TRUST_PLACEHOLDER,
} from "./landingCopy";
import { calculateDeliveryPrice, formatTariffInclusive } from "./kuryeler";

const valid = {
  fullName: "Ayşe Demir",
  phone: "05324746745",
  pickupAddress: "Moda Cad. No 12, Kadıköy",
  dropoffAddress: "Büyükdere Cad. No 120, Levent",
  distanceKm: 10,
  product: "Evrak",
  website: "",
  preInfoOk: true,
  withdrawOk: true,
};

describe("üyeliksiz kısa talep", () => {
  it("mevcut fiyat motorunu kullanır (600 + 50×km net, müşteriye KDV dahil)", () => {
    const engine = calculateDeliveryPrice({ distanceKm: 10 });
    const quote = quoteGuestLead(10);
    expect(quote).toEqual(engine);
    expect(quote.netTl).toBe(1100);
    expect(quote.grossTl).toBe(1320);
    expect(formatConsumerGross(quote)).toBe("1.320 TL KDV dahil");
    expect(formatConsumerVatLine(quote)).toMatch(/1\.100 TL net \+ %20 KDV \(220 TL\)/);
    expect(formatTariffInclusive()).toBe("Açılış 720 TL + km başı 60 TL (KDV dahil)");
  });

  it("eksik alan ve işaretsiz yasal kutuları reddeder", () => {
    expect(validateGuestLead({ ...valid, fullName: "A", preInfoOk: false, withdrawOk: false })).toMatchObject({
      fullName: expect.stringMatching(/ad soyad/i),
      preInfoOk: expect.stringMatching(/ön bilgilendirme/i),
      withdrawOk: expect.stringMatching(/cayma/i),
    });
    expect(ORDER_CHECKBOX_LABELS.preInfo.length).toBeGreaterThan(20);
  });

  it("honeypot doluysa bot olarak işaretler", () => {
    expect(isHoneypotFilled("https://spam.example")).toBe(true);
    expect(isHoneypotFilled("")).toBe(false);
  });

  it("WhatsApp metnini yalnızca kullanıcı tıklaması için üretir; otomatik gönderim yok", () => {
    const text = buildGuestWhatsappText(valid, quoteGuestLead(10));
    expect(text).toMatch(/Hızlıgel kurye talebi/);
    expect(text).toMatch(/1\.320 TL KDV dahil/);
    expect(text).not.toMatch(/usd|dolar|döviz|\bUSD\b/i);
    expect(text).not.toMatch(/TCKN|T\.C\. kimlik/i);
  });
});

describe("ana sayfa vaadi", () => {
  it("H1 İstanbul moto kurye vaadi ve CTA metinlerini tutar", () => {
    expect(HERO_HEADLINE).toMatch(/İstanbul moto kurye/);
    expect(HERO_HEADLINE).toMatch(/evrak/i);
    expect(HERO_HEADLINE).toMatch(/paket/i);
    expect(HERO_HEADLINE).toMatch(/acil/i);
    expect(PRIMARY_CTA).toBe("Hemen Kurye Çağır");
    expect(SECONDARY_CTA).toBe("Ara");
    expect(SERVICE_CARDS.map(card => card.title)).toEqual(["Evrak", "Paket", "Acil teslimat"]);
    expect(TRUST_PLACEHOLDER).toMatch(/yer tutucu/i);
    expect(TRUST_PLACEHOLDER).not.toMatch(/\d+\s*%|4[,.][89]|Google|yıldız/i);
    expect(BRAND_GOLD).toBe("#D4AF37");
    expect(HERO_HEADLINE + PRIMARY_CTA).not.toMatch(/1\.000|1000\s*\/\s*55|55\s*TL/);
  });
});
