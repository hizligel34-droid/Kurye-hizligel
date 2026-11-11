import { BRAND_NAME, BRAND_PRODUCT, BRAND_URL } from "@shared/kuryeler";
import { PWA_APPS, type PwaPanel } from "@shared/kuryelerPwa";
import { useEffect } from "react";
import { useLocation } from "wouter";

const SITE_META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Hızlıgel — kuryeler.tr İstanbul kurye",
    description:
      "Hızlıgel: İstanbul moto kurye. Evrak, paket, acil teslimat. İl içi aynı gün teslimat. Fiyatı TL görün, üye olmadan çağırın.",
  },
  "/takip": {
    title: "Sipariş takibi — Hızlıgel",
    description: "Takip kodunuzla Hızlıgel siparişinizin durumunu görün.",
  },
  "/sss": {
    title: "SSS — Hızlıgel",
    description:
      "Hızlıgel teslim süreleri, ücret, üyeliksiz çağrı ve ödeme. İl içi aynı gün teslimat. Hedef süredir; trafik ve hava koşullarına göre değişebilir.",
  },
  "/ucret-hesapla": {
    title: "Ücret hesapla — Hızlıgel",
    description:
      "Hızlıgel yürürlükteki tarife: açılış 720 TL + km başı 60 TL KDV dahil. Sürüş kilometresine göre anında fiyat.",
  },
  "/404": {
    title: "Sayfa bulunamadı — Hızlıgel",
    description: "Aradığınız adres yok. İstanbul moto kurye için ana sayfadan fiyat görün veya arayın.",
  },
  "/kvkk": {
    title: "KVKK Aydınlatma Metni — Hızlıgel",
    description: "Hızlıgel / kuryeler.tr kişisel verilerin korunması aydınlatma metni. TASLAK – yayına alınmadı.",
  },
  "/kosullar": {
    title: "Kullanım koşulları — Hızlıgel",
    description: "Hızlıgel hizmet ve kullanım koşulları. TASLAK – yayına alınmadı.",
  },
  "/kullanim-kosullari": {
    title: "Kullanım koşulları — Hızlıgel",
    description: "Hızlıgel hizmet ve kullanım koşulları. TASLAK – yayına alınmadı.",
  },
  "/kunye": {
    title: "Künye — Hızlıgel",
    description: "Hızlıgel / kuryeler.tr künye ve bilgilendirme. TASLAK – yayına alınmadı.",
  },
  "/iletisim": {
    title: "İletişim / Künye — Hızlıgel",
    description: "Hızlıgel iletişim ve künye bilgileri. TASLAK – yayına alınmadı.",
  },
  "/cerez": {
    title: "Çerez bilgisi — Hızlıgel",
    description: "Hızlıgel çerez ve yerel depolama bilgisi. TASLAK – yayına alınmadı.",
  },
  "/on-bilgilendirme": {
    title: "Ön bilgilendirme — Hızlıgel",
    description: "Hızlıgel ön bilgilendirme formu. TASLAK – yayına alınmadı.",
  },
  "/mesafeli-sozlesme": {
    title: "Mesafeli sözleşme — Hızlıgel",
    description: "Hızlıgel mesafeli hizmet sözleşmesi. TASLAK – yayına alınmadı.",
  },
  "/odeme-bilgisi": {
    title: "Ödeme bilgisi — Hızlıgel",
    description: "Hızlıgel iyzico ödeme bilgisi. TASLAK – yayına alınmadı.",
  },
  "/aracilik-ve-sikayet": {
    title: "Aracılık ve şikâyet — Hızlıgel",
    description: "Pazar yeri aracılık ve şikâyet metni. TASLAK – yayına alınmadı.",
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
