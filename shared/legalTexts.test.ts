import { describe, expect, it } from "vitest";
import { applyLegalPlaceholders, LEGAL_FILLED, LEGAL_UNKNOWN } from "./legalPlaceholders";
import {
  LEGAL_DOCUMENTS,
  LEGAL_DRAFT_BANNER,
  LEGAL_VERSION,
  ORDER_CHECKBOX_LABELS,
} from "./legalTexts";

describe("avukat taslak metinleri", () => {
  const allText = Object.values(LEGAL_DOCUMENTS)
    .map(doc => `${doc.title}\n${doc.body}`)
    .join("\n");

  it("her belgede TASLAK işareti ve sürüm ? vardır", () => {
    expect(LEGAL_VERSION).toBe("?");
    for (const doc of Object.values(LEGAL_DOCUMENTS)) {
      expect(doc.version).toBe("?");
      expect(doc.body).toContain(LEGAL_DRAFT_BANNER);
    }
  });

  it("e-posta ve iyzico doldurulur; belirtilen yer tutucular ? kalır", () => {
    expect(allText).toContain(LEGAL_FILLED.email);
    expect(allText).toContain(LEGAL_FILLED.odemeKurulusu);
    expect(allText).not.toContain("[E-POSTA]");
    expect(allText).not.toContain("[ÖDEME KURULUŞU]");
    expect(allText).toContain(LEGAL_UNKNOWN.vergiNo);
    expect(allText).toContain(LEGAL_UNKNOWN.kep);
    expect(allText).toContain(LEGAL_UNKNOWN.p1YetkiBelgesiNo);
    expect(LEGAL_DOCUMENTS.kunye.body).toMatch(/P1 yetki belgesi no: \?/);
    expect(LEGAL_DOCUMENTS.kunye.body).toMatch(/Barındırma: \?/);
  });

  it("TCKN alanı veya metni yoktur", () => {
    expect(allText).not.toMatch(/TCKN|T\.C\. kimlik/i);
    expect(applyLegalPlaceholders("fatura için TCKN/VKN")).toBe("fatura için VKN");
  });

  it("iletişim hattı 0532 474 67 45’tir; 0553 yoktur", () => {
    expect(allText).toContain("0532 474 67 45");
    expect(allText).not.toMatch(/0553\s*255|905532556745/);
  });

  it("müşteriye süre tablosu veya aynı gün teslimat vaadi yazmaz", () => {
    expect(allText).not.toMatch(/60\s*dk|60 dakika|≤\s*5\s*km|>\s*100\s*km/i);
    expect(allText).not.toContain("İl içi aynı gün teslimat");
    expect(LEGAL_DOCUMENTS.on_bilgi.body).toContain("Makul sürede, aktarmasız teslim");
  });

  it("onay kutusu metinleri ayrıdır ve varsayılan işaretli değildir", () => {
    expect(ORDER_CHECKBOX_LABELS.preInfo.length).toBeGreaterThan(20);
    expect(ORDER_CHECKBOX_LABELS.withdraw).toMatch(/cayma/i);
  });
});
