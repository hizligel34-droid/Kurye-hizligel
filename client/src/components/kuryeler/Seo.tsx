import { BRAND_NAME, BRAND_URL } from "@shared/kuryeler";
import { panelFromPath, PWA_APPS } from "@shared/kuryelerPwa";
import { useEffect } from "react";
import { useLocation } from "wouter";

const PAGE_META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "kuryeler.tr — İstanbul kurye teslimat",
    description:
      "İstanbul içi kurye: evrak, paket ve gıda teslimatı. Fiyatı TL görün, siparişi canlı takip edin. Müşteri, kurye ve yönetici panelleri.",
  },
  "/takip": {
    title: "Sipariş takibi — kuryeler.tr",
    description: "Takip kodunuzla kuryeler.tr siparişinizin durumunu görün.",
  },
  "/kvkk": {
    title: "KVKK Aydınlatma Metni — kuryeler.tr",
    description: "kuryeler.tr kişisel verilerin korunması aydınlatma metni (taslak).",
  },
  "/kosullar": {
    title: "Kullanım koşulları — kuryeler.tr",
    description: "kuryeler.tr hizmet ve kullanım koşulları (taslak).",
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

export function Seo() {
  const [location] = useLocation();

  useEffect(() => {
    const panel = panelFromPath(location);
    const page = PAGE_META[location] ?? PAGE_META[location.split("/").slice(0, 2).join("/")] ?? {
      title: PWA_APPS[panel].name,
      description: PWA_APPS[panel].description,
    };
    document.title = page.title;
    upsertMeta("name", "description", page.description);
    upsertMeta("property", "og:title", page.title);
    upsertMeta("property", "og:description", page.description);
    upsertMeta("property", "og:url", `${BRAND_URL}${location === "/" ? "" : location}`);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:locale", "tr_TR");
    upsertMeta("property", "og:site_name", BRAND_NAME);
    upsertMeta("property", "og:image", `${BRAND_URL}/pwa/icons/site-512.png`);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", page.title);
    upsertMeta("name", "twitter:description", page.description);
    upsertCanonical(`${BRAND_URL}${location === "/" ? "/" : location}`);
  }, [location]);

  return null;
}
