import { BRAND_NAME, BRAND_PRODUCT, BRAND_URL } from "@shared/kuryeler";
import { PWA_APPS, type PwaPanel } from "@shared/kuryelerPwa";
import { useEffect } from "react";
import { useLocation } from "wouter";

const SITE_META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Hızlıgel — kuryeler.tr İstanbul kurye",
    description:
      "Hızlıgel: İstanbul içi kurye. Üç ayrı uygulama — Müşteri, Kurye, Yönetici. Fiyatı TL görün, teslimatı takip edin.",
  },
  "/takip": {
    title: "Sipariş takibi — Hızlıgel",
    description: "Takip kodunuzla Hızlıgel siparişinizin durumunu görün.",
  },
  "/kvkk": {
    title: "KVKK Aydınlatma Metni — Hızlıgel",
    description: "Hızlıgel / kuryeler.tr kişisel verilerin korunması aydınlatma metni (taslak).",
  },
  "/kosullar": {
    title: "Kullanım koşulları — Hızlıgel",
    description: "Hızlıgel hizmet ve kullanım koşulları (taslak).",
  },
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

export function Seo({ panel }: { panel?: PwaPanel }) {
  const [location] = useLocation();

  useEffect(() => {
    const page = panel
      ? { title: PWA_APPS[panel].name, description: PWA_APPS[panel].description }
      : (SITE_META[location] ?? SITE_META["/"]);
    document.title = page.title;
    upsertMeta("name", "description", page.description);
    upsertMeta("property", "og:title", page.title);
    upsertMeta("property", "og:description", page.description);
    upsertMeta("property", "og:url", `${BRAND_URL}${panel ? PWA_APPS[panel].startUrl : location === "/" ? "" : location}`);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:locale", "tr_TR");
    upsertMeta("property", "og:site_name", panel ? PWA_APPS[panel].name : `${BRAND_PRODUCT} · ${BRAND_NAME}`);
    upsertMeta("property", "og:image", `${BRAND_URL}${panel ? PWA_APPS[panel].iconPath : "/pwa/icons/site-512.png"}`);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", page.title);
    upsertMeta("name", "twitter:description", page.description);
    upsertCanonical(`${BRAND_URL}${panel ? PWA_APPS[panel].startUrl : location === "/" ? "/" : location}`);
  }, [location, panel]);

  return null;
}
