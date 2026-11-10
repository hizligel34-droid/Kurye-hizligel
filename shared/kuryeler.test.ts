import { describe, expect, it } from "vitest";
import { DISTRICT_PRICES } from "./fiyatListesi";
import {
  BUSINESS,
  calculateDeliveryPrice,
  canTransitionStatus,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP_E164,
  DEFAULT_PRICING,
  displayStatus,
  formatTariff,
  formatTlWithVat,
  generateTrackingCode,
  MAX_WEIGHT_KG,
  nextCourierStatus,
  redactPendingForCourier,
  STATUS_LABELS,
  VAT_STATUS_NOTE,
  WEIGHT_LIMIT_MESSAGE,
  type DeliveryOrder,
} from "./kuryeler";

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

  it("müşteriye beş Türkçe durum gösterir", () => {
    expect(STATUS_LABELS.pending).toBe("Bekliyor");
    expect(STATUS_LABELS.assigned).toBe("Bekliyor");
    expect(STATUS_LABELS.picked_up).toBe("Alındı");
    expect(STATUS_LABELS.en_route).toBe("Yolda");
    expect(STATUS_LABELS.delivered).toBe("Teslim edildi");
    expect(STATUS_LABELS.cancelled).toBe("İptal");
    expect(displayStatus("assigned")).toBe("pending");
  });
});

describe("kuryeler.tr sürüş fiyatı", () => {
  it("7,4 km sürüş için 970 TL üretir (600 + 50×km)", () => {
    const result = calculateDeliveryPrice({ distanceKm: 7.4 });
    expect(result.totalTl).toBe(970);
    expect(result.baseTry).toBe(600);
    expect(result.distanceFeeTry).toBe(370);
  });

  it("yönetici açılış ve km bedelini kullanır", () => {
    const result = calculateDeliveryPrice({
      distanceKm: 10,
      pricing: { ...DEFAULT_PRICING, baseTry: 90, perKmTry: 20, commissionRate: 0.1 },
    });
    expect(result.totalTl).toBe(290);
    expect(result.commissionTl).toBe(29);
  });

  it("ağırlık üst sınırını 30 kg olarak tutar", () => {
    expect(MAX_WEIGHT_KG).toBe(30);
    expect(WEIGHT_LIMIT_MESSAGE).toBe("Maksimum taşıma sınırı 30 kg");
  });

  it("KDV durumunu yer tutucu olarak gösterir, KDV dahil demez", () => {
    expect(VAT_STATUS_NOTE).toBe("KDV ?");
    expect(formatTlWithVat(970)).toBe("970 TL (KDV ?)");
    expect(formatTariff()).toMatch(/Açılış 600 TL \+ km başı 50 TL \(KDV \?\)/);
    expect(formatTlWithVat(970)).not.toMatch(/dahil/i);
  });

  it("varsayılan tarifede döviz alanı bulundurmaz", () => {
    expect(DEFAULT_PRICING).toEqual(
      expect.objectContaining({
        baseTry: 600,
        perKmTry: 50,
        roundingDecimals: 2,
        showcaseMode: false,
      }),
    );
    expect(DEFAULT_PRICING).not.toHaveProperty("baseUsd");
    expect(DEFAULT_PRICING).not.toHaveProperty("usdToTry");
    expect(DEFAULT_PRICING).not.toHaveProperty("perKmUsd");
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
    expect(BUSINESS.legalName).toBe("[AD SOYAD]");
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
      totalPriceTl: 970,
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
    } satisfies DeliveryOrder);
    expect(redacted.boardOnly).toBe(true);
    expect(redacted.product).toBe("Gönderi");
    expect(redacted.pickupAddress).toBe("Beşiktaş");
    expect(redacted.recipientName).toBe("");
    expect(redacted.contactPhone).toBe("");
    expect(redacted.notes).toBe("");
    expect(redacted.pickupLat).toBeNull();
    expect(redacted.totalPriceTl).toBe(970);
    expect(redacted.distanceKm).toBe(7.4);
  });
});
