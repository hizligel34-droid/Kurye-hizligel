import { describe, expect, it } from "vitest";
import { DISTRICT_PRICES } from "./fiyatListesi";
import {
  BUSINESS,
  calculateDeliveryPrice,
  canTransitionStatus,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP_E164,
  DEFAULT_DELIVERY_TARGET_TIERS,
  DEFAULT_PRICING,
  DEFAULT_VAT_RATE,
  deliveryTargetForDistance,
  displayStatus,
  formatDeliveryTarget,
  formatPriceBreakdown,
  formatPriceHint,
  formatPriceInclusive,
  formatTariff,
  formatTariffInclusive,
  formatVatPercent,
  generateTrackingCode,
  MAX_WEIGHT_KG,
  nextCourierStatus,
  redactPendingForCourier,
  STATUS_LABELS,
  VAT_EXCL_LABEL,
  VAT_INCL_LABEL,
  WEIGHT_LIMIT_MESSAGE,
  type DeliveryOrder,
} from "./kuryeler";
import { buildOrderConfirmationMail } from "./orderConfirmation";

describe("kuryeler.tr sipariş durumları", () => {
  it("Bekliyor → atama → alındı → yolda → teslim adımlarına izin verir", () => {
    expect(canTransitionStatus("pending", "assigned")).toBe(true);
    expect(canTransitionStatus("assigned", "picked_up")).toBe(true);
    expect(canTransitionStatus("picked_up", "en_route")).toBe(true);
    expect(canTransitionStatus("en_route", "delivered")).toBe(true);
  });

  it("aşama atlamayı reddeder", () => {
    expect(canTransitionStatus("pending", "delivered")).toBe(false);
    expect(canTransitionStatus("assigned", "en_route")).toBe(false);
    expect(canTransitionStatus("delivered", "en_route")).toBe(false);
  });

  it("iptali teslimattan önce izinli tutar", () => {
    expect(canTransitionStatus("pending", "cancelled")).toBe(true);
    expect(canTransitionStatus("en_route", "cancelled")).toBe(true);
    expect(canTransitionStatus("delivered", "cancelled")).toBe(false);
  });

  it("kurye bir sonraki adımı sırayla önerir", () => {
    expect(nextCourierStatus("assigned")).toBe("picked_up");
    expect(nextCourierStatus("picked_up")).toBe("en_route");
    expect(nextCourierStatus("en_route")).toBe("delivered");
    expect(nextCourierStatus("pending")).toBeNull();
  });

  it("müşteriye atamayı ayrı Türkçe etiketle gösterir", () => {
    expect(STATUS_LABELS.pending).toBe("Bekliyor");
    expect(STATUS_LABELS.assigned).toBe("Kurye atandı, alıma gidiyor");
    expect(STATUS_LABELS.picked_up).toBe("Alındı");
    expect(STATUS_LABELS.en_route).toBe("Yolda");
    expect(STATUS_LABELS.delivered).toBe("Teslim edildi");
    expect(STATUS_LABELS.cancelled).toBe("İptal");
    expect(displayStatus("assigned")).toBe("assigned");
  });
});

describe("kuryeler.tr sürüş fiyatı", () => {
  it("10 km için 1.100 TL KDV hariç + %20 KDV = 1.320 TL üretir", () => {
    const result = calculateDeliveryPrice({ distanceKm: 10 });
    expect(result.netTl).toBe(1100);
    expect(result.vatTl).toBe(220);
    expect(result.grossTl).toBe(1320);
    expect(result.totalTl).toBe(1320);
    expect(result.vatRate).toBe(0.2);
    expect(result.baseTry).toBe(600);
    expect(result.distanceFeeTry).toBe(500);
    expect(result.commissionTl).toBe(220);
    expect(result.courierEarningTl).toBe(880);
  });

  it("7,4 km sürüş için net 970 TL + 194 TL KDV üretir (600 + 50×km)", () => {
    const result = calculateDeliveryPrice({ distanceKm: 7.4 });
    expect(result.netTl).toBe(970);
    expect(result.vatTl).toBe(194);
    expect(result.grossTl).toBe(1164);
    expect(result.totalTl).toBe(1164);
    expect(result.baseTry).toBe(600);
    expect(result.distanceFeeTry).toBe(370);
  });

  it("yönetici açılış, km bedeli ve KDV oranını kullanır", () => {
    const result = calculateDeliveryPrice({
      distanceKm: 10,
      pricing: { ...DEFAULT_PRICING, baseTry: 90, perKmTry: 20, commissionRate: 0.1, vatRate: 0.1 },
    });
    expect(result.netTl).toBe(290);
    expect(result.vatTl).toBe(29);
    expect(result.grossTl).toBe(319);
    expect(result.totalTl).toBe(319);
    expect(result.commissionTl).toBe(29);
  });

  it("ağırlık üst sınırını 30 kg olarak tutar", () => {
    expect(MAX_WEIGHT_KG).toBe(30);
    expect(WEIGHT_LIMIT_MESSAGE).toBe("Maksimum taşıma sınırı 30 kg");
  });

  it("tüketiciye KDV dahil tarife ve örnek gösterir, faturada kırılım kalır", () => {
    expect(DEFAULT_VAT_RATE).toBe(0.2);
    expect(DEFAULT_PRICING.vatRate).toBe(0.2);
    expect(VAT_EXCL_LABEL).toBe("KDV hariç");
    expect(VAT_INCL_LABEL).toBe("KDV dahil");
    expect(formatVatPercent(0.2)).toBe("%20");
    expect(formatTariffInclusive()).toBe("Açılış 720 TL + km başı 60 TL (KDV dahil)");
    expect(formatTariff()).toBe("Açılış 600 TL + km başı 50 TL (KDV hariç)");
    const sample = calculateDeliveryPrice({ distanceKm: 10 });
    expect(formatPriceInclusive(sample)).toBe("1.320 TL (KDV dahil)");
    expect(formatPriceHint(sample)).toBe("1.100 TL + 220 TL KDV");
    expect(formatPriceBreakdown(sample)).toBe("1.100 TL KDV hariç · KDV (%20): 220 TL · 1.320 TL KDV dahil");
  });

  it("varsayılan tarife yalnızca TL alanları taşır", () => {
    expect(Object.keys(DEFAULT_PRICING).sort()).toEqual(
      [
        "baseTry",
        "commissionRate",
        "geocoder",
        "perKmTry",
        "roundingDecimals",
        "routingProvider",
        "routingUrl",
        "deliveryTargetTiers",
        "showcaseMode",
        "vatRate",
      ].sort(),
    );
    expect(DEFAULT_PRICING).toEqual(
      expect.objectContaining({
        baseTry: 600,
        perKmTry: 50,
        roundingDecimals: 2,
        vatRate: 0.2,
        showcaseMode: false,
      }),
    );
  });
});

describe("kuryeler.tr hedef teslim kademeleri", () => {
  it("yol mesafesine göre kademe seçer", () => {
    const cases: Array<[number, string]> = [
      [5, "60 dakika"],
      [5.1, "2 saat"],
      [20, "2 saat"],
      [40, "3 saat"],
      [100, "4 saat"],
      [100.1, "aynı gün"],
    ];
    for (const [km, label] of cases) {
      expect(deliveryTargetForDistance(km).label).toBe(label);
      expect(formatDeliveryTarget(km)).toBe(`Hedef teslim: ${label}`);
    }
  });

  it("ayar dizisindeki eşikleri kullanır", () => {
    const custom = [
      { maxKm: 8, label: "90 dakika" },
      { maxKm: null, label: "aynı gün" },
    ];
    expect(deliveryTargetForDistance(8, custom).label).toBe("90 dakika");
    expect(deliveryTargetForDistance(8.1, custom).label).toBe("aynı gün");
    expect(DEFAULT_DELIVERY_TARGET_TIERS.map(tier => tier.maxKm)).toEqual([5, 20, 40, 100, null]);
  });
});

describe("kuryeler.tr bölge referans listesi", () => {
  it("CSV’deki 55 İstanbul bölgesini isteğe bağlı referans olarak yükler", () => {
    expect(DISTRICT_PRICES).toHaveLength(55);
    expect(DISTRICT_PRICES.find(row => row.bolge === "Beşiktaş")?.fiyatTl).toBe(350);
  });
});

describe("kuryeler.tr takip kodu", () => {
  it("KY- önekiyle uzun kriptografik kod üretir", () => {
    const code = generateTrackingCode();
    expect(code).toMatch(/^KY-[A-F0-9]{32}$/);
    expect(generateTrackingCode()).not.toBe(code);
  });
});

describe("kuryeler.tr iletişim", () => {
  it("işletme telefonu ve WhatsApp numarasını gösterir", () => {
    expect(CONTACT_PHONE_DISPLAY).toBe("0532 474 67 45");
    expect(CONTACT_WHATSAPP_E164).toBe("905324746745");
    expect(CONTACT_PHONE_TEL).toBe("tel:+905324746745");
  });

  it("künyede unvan, telefon ve Beşiktaş adresini doldurur; vergi ve e-posta ? kalır", () => {
    expect(BUSINESS.legalName).toBe("Canan Tekin Organizasyon ve Kurye Hizmetleri");
    expect(BUSINESS.ownerName).toBe("Canan Tekin");
    expect(BUSINESS.traderKind).toBe("esnaf");
    expect(BUSINESS.address).toBe(
      "Büyük Beşiktaş Çarşısı, Ortabahçe Caddesi No: 10, Kat 1, No: 143, Beşiktaş/İstanbul",
    );
    expect(BUSINESS.taxOffice).toBe("?");
    expect(BUSINESS.taxId).toBe("?");
    expect(BUSINESS.kep).toBe("?");
    expect(BUSINESS.email).toBe("?");
    expect(BUSINESS).not.toHaveProperty("tckn");
    expect(BUSINESS).not.toHaveProperty("tcKimlik");
    expect(BUSINESS).not.toHaveProperty("identityNumber");
    expect(JSON.stringify(BUSINESS)).not.toMatch(/T\.C\.|TCKN|kimlik no/i);
  });
});

describe("kurye pano redaksiyonu", () => {
  it("bekleyen işte ad, telefon ve tam adresi gizler", () => {
    const redacted = redactPendingForCourier({
      id: "1",
      trackingCode: "KY-TEST",
      customerId: "c1",
      courierId: null,
      status: "pending",
      product: "Gizli evrak",
      pickupAddress: "Moda Cad. 12",
      dropoffAddress: "Büyükdere 120",
      bolge: "Beşiktaş",
      recipientName: "Ayşe",
      recipientPhone: "05420000005",
      scheduledAt: null,
      notes: "kapı kodu 12",
      contactPhone: "05420000000",
      paymentMethod: "nakit",
      paymentStatus: "bekliyor",
      pickupPhoto: null,
      deliveryPhoto: null,
      signatureData: null,
      weightKg: 2,
      distanceKm: 7.4,
      durationMin: 18,
      netPriceTl: 970,
      vatTl: 194,
      totalPriceTl: 1164,
      courierEarningTl: 776,
      companyRevenueTl: 194,
      pickupLat: 41,
      pickupLng: 29,
      dropoffLat: 41.1,
      dropoffLng: 29.1,
      routeGeojson: "[]",
      createdAt: "",
      updatedAt: "",
      assignedAt: null,
      pickedUpAt: null,
      deliveredAt: null,
      cancelledAt: null,
      cancelReason: "",
      cancelledBy: null,
    } satisfies DeliveryOrder);
    expect(redacted.boardOnly).toBe(true);
    expect(redacted.recipientPhone).toBe("");
    expect(redacted.product).toBe("Gönderi");
    expect(redacted.pickupAddress).toBe("Beşiktaş");
    expect(redacted.recipientName).toBe("");
    expect(redacted.contactPhone).toBe("");
    expect(redacted.notes).toBe("");
    expect(redacted.pickupLat).toBeNull();
    expect(redacted.netPriceTl).toBe(970);
    expect(redacted.vatTl).toBe(194);
    expect(redacted.totalPriceTl).toBe(1164);
    expect(redacted.distanceKm).toBe(7.4);
  });
});

describe("sipariş teyit e-postası", () => {
  it("KDV hariç / KDV / KDV dahil satırlarını içerir", () => {
    const quote = calculateDeliveryPrice({ distanceKm: 10 });
    const mail = buildOrderConfirmationMail(
      {
        id: "1",
        trackingCode: "KY-MAIL",
        customerId: "c1",
        courierId: null,
        status: "pending",
        product: "Evrak",
        pickupAddress: "Kadıköy",
        dropoffAddress: "Beşiktaş",
        bolge: "Beşiktaş",
        recipientName: "Ayşe",
        recipientPhone: "05420000005",
        scheduledAt: "2026-11-10T14:00:00.000Z",
        notes: "",
        contactPhone: "05420000000",
        paymentMethod: "nakit",
        paymentStatus: "bekliyor",
        pickupPhoto: null,
        deliveryPhoto: null,
        signatureData: null,
        weightKg: 2,
        distanceKm: 10,
        durationMin: 22,
        netPriceTl: quote.netTl,
        vatTl: quote.vatTl,
        totalPriceTl: quote.grossTl,
        courierEarningTl: quote.courierEarningTl,
        companyRevenueTl: quote.companyRevenueTl,
        pickupLat: 41,
        pickupLng: 29,
        dropoffLat: 41.1,
        dropoffLng: 29.1,
        routeGeojson: "[]",
        createdAt: "",
        updatedAt: "",
        assignedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
        cancelledAt: null,
        cancelReason: "",
        cancelledBy: null,
      },
      "musteri@ornek.tr",
    );
    expect(mail.body).toContain("1.320 TL (KDV dahil)");
    expect(mail.body).toContain("1.100 TL + 220 TL KDV");
    expect(mail.body).toContain("1.100 TL KDV hariç");
    expect(mail.body).toContain("KDV (%20): 220 TL");
    expect(mail.body).not.toContain("KDV ?");
    expect(mail.body).toContain("Canan Tekin Organizasyon ve Kurye Hizmetleri");
    expect(mail.body).toContain("İşletme sahibi: Canan Tekin");
    expect(mail.body).toContain(
      "Büyük Beşiktaş Çarşısı, Ortabahçe Caddesi No: 10, Kat 1, No: 143, Beşiktaş/İstanbul",
    );
    expect(mail.body).toContain("E-posta: ?");
    expect(mail.body).toContain("KEP: ?");
    expect(mail.body).not.toMatch(/MERSİS/);
    expect(mail.body).not.toMatch(/TCKN|T\.C\. kimlik/i);
  });
});
