import { describe, expect, it } from "vitest";
import { getStoredLanguage, supportedLanguages, translations } from "./i18n";

describe("Run Kurye language catalog", () => {
  it("exposes all requested languages with one RTL option", () => {
    expect(supportedLanguages.map(language => language.code)).toEqual(["tr", "en", "ar", "ru", "el", "it", "de", "fr"]);
    expect(supportedLanguages.find(language => language.code === "ar")?.dir).toBe("rtl");
    expect(supportedLanguages.filter(language => language.dir === "rtl")).toHaveLength(1);
  });

  it("provides core UI translations for every language", () => {
    for (const language of supportedLanguages) {
      expect(translations[language.code].language).toBeTruthy();
      expect(translations[language.code].tracking).toBeTruthy();
      expect(translations[language.code].notifications).toBeTruthy();
    }
  });

  it("falls back to Turkish outside a browser context", () => {
    expect(getStoredLanguage()).toBe("tr");
  });
});
