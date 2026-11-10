export const PWA_PANELS = ["musteri", "kurye", "yonetici", "site"] as const;
export type PwaPanel = (typeof PWA_PANELS)[number];

export const PWA_APPS: Record<
  PwaPanel,
  {
    id: string;
    name: string;
    shortName: string;
    description: string;
    startUrl: string;
    scope: string;
    manifestPath: string;
    iconPath: string;
    themeColor: string;
    backgroundColor: string;
  }
> = {
  musteri: {
    id: "https://kuryeler.tr/musteri",
    name: "kuryeler.tr Müşteri",
    shortName: "Müşteri",
    description: "Sipariş oluştur, fiyat gör, teslimatı takip et.",
    startUrl: "/musteri",
    scope: "/",
    manifestPath: "/pwa/musteri.webmanifest",
    iconPath: "/pwa/icons/musteri-512.png",
    themeColor: "#0A0A0A",
    backgroundColor: "#0A0A0A",
  },
  kurye: {
    id: "https://kuryeler.tr/kurye",
    name: "kuryeler.tr Kurye",
    shortName: "Kurye",
    description: "İşleri kabul et, durumu güncelle, günlük kazancı gör.",
    startUrl: "/kurye",
    scope: "/",
    manifestPath: "/pwa/kurye.webmanifest",
    iconPath: "/pwa/icons/kurye-512.png",
    themeColor: "#0A0A0A",
    backgroundColor: "#0A0A0A",
  },
  yonetici: {
    id: "https://kuryeler.tr/yonetici",
    name: "kuryeler.tr Yönetici",
    shortName: "Yönetici",
    description: "Sipariş, kurye ve fiyat yönetimini tek panelden yürütün.",
    startUrl: "/yonetici",
    scope: "/",
    manifestPath: "/pwa/yonetici.webmanifest",
    iconPath: "/pwa/icons/yonetici-512.png",
    themeColor: "#0A0A0A",
    backgroundColor: "#0A0A0A",
  },
  site: {
    id: "https://kuryeler.tr/",
    name: "kuryeler.tr",
    shortName: "kuryeler.tr",
    description: "İstanbul kurye teslimat platformu.",
    startUrl: "/",
    scope: "/",
    manifestPath: "/pwa/site.webmanifest",
    iconPath: "/pwa/icons/site-512.png",
    themeColor: "#0A0A0A",
    backgroundColor: "#0A0A0A",
  },
};

export function panelFromPath(pathname: string): PwaPanel {
  if (pathname.startsWith("/musteri")) return "musteri";
  if (pathname.startsWith("/kurye")) return "kurye";
  if (pathname.startsWith("/yonetici")) return "yonetici";
  return "site";
}
