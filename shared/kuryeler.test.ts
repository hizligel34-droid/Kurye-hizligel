import { describe, expect, it } from "vitest";
import { DISTRICT_PRICES } from "./fiyatListesi";
import {
  calculateDeliveryPrice,
  canTransitionStatus,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP_E164,
  DEFAULT_PRICING,
  displayStatus,
  generateTrackingCode,
  MAX_WEIGHT_KG,
  nextCourierStatus,
  STATUS_LABELS,
  WEIGHT_LIMIT_MESSAGE,
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
  it("7,4 km sürüş için 8,4 USD üretir", () => {
    const result = calculateDeliveryPrice({ distanceKm: 7.4 });
    expect(result.priceUsd).toBe(8.4);
    expect(result.baseUsd).toBe(1);
    expect(result.distanceFeeUsd).toBe(7.4);
  });

  it("yönetici açılış ve km bedelini kullanır", () => {
    const result = calculateDeliveryPrice({
      distanceKm: 10,
      pricing: { ...DEFAULT_PRICING, baseUsd: 2, perKmUsd: 0.5, commissionRate: 0.1 },
    });
    expect(result.priceUsd).toBe(7);
    expect(result.commissionUsd).toBe(0.7);
  });

  it("ağırlık üst sınırını 30 kg olarak tutar", () => {
    expect(MAX_WEIGHT_KG).toBe(30);
    expect(WEIGHT_LIMIT_MESSAGE).toBe("Maksimum taşıma sınırı 30 kg");
  });
});

describe("kuryeler.tr bölge referans listesi", () => {
  it("CSV’deki 55 İstanbul bölgesini isteğe bağlı referans olarak yükler", () => {
    expect(DISTRICT_PRICES).toHaveLength(55);
    expect(DISTRICT_PRICES.find(row => row.bolge === "Beşiktaş")?.fiyatTl).toBe(350);
  });
});

describe("kuryeler.tr takip kodu", () => {
  it("KY- önekiyle üretir", () => {
    expect(generateTrackingCode()).toMatch(/^KY-[A-Z0-9]+$/);
  });
});

describe("kuryeler.tr iletişim", () => {
  it("işletme telefonu ve WhatsApp numarasını gösterir", () => {
    expect(CONTACT_PHONE_DISPLAY).toBe("0532 474 67 45");
    expect(CONTACT_WHATSAPP_E164).toBe("905324746745");
  });
});
