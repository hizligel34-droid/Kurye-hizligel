export const PWA_PANELS = ["musteri", "kurye", "yonetici"] as const;
export type PwaPanel = (typeof PWA_PANELS)[number];

export type NativeAppConfig = {
  appId: string;
  appName: string;
  configFile: string;
};

export type PwaApp = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  startUrl: string;
  scope: string;
  manifestPath: string;
  iconPath: string;
  icon180Path: string;
  swPath: string;
  offlinePath: string;
  themeColor: string;
  backgroundColor: string;
  htmlPath: string;
  bundleId: string;
};

export const PWA_APPS: Record<PwaPanel, PwaApp> = {
  musteri: {
    id: "https://kuryeler.tr/musteri/",
    name: "Hızlıgel Müşteri",
    shortName: "Hızlıgel Müşteri",
    description: "Sipariş oluşturun, haritada sürüş ücretini görün, teslimatı takip edin.",
    startUrl: "/musteri/",
    scope: "/musteri/",
    manifestPath: "/musteri/manifest.webmanifest",
    iconPath: "/pwa/icons/musteri-512.png",
    icon180Path: "/pwa/icons/musteri-180.png",
    swPath: "/musteri/sw.js",
    offlinePath: "/musteri/offline.html",
    themeColor: "#0A0A0A",
    backgroundColor: "#0A0A0A",
    htmlPath: "/musteri/index.html",
    bundleId: "tr.hizligel.musteri",
  },
  kurye: {
    id: "https://kuryeler.tr/kurye/",
    name: "Hızlıgel Kurye",
    shortName: "Hızlıgel Kurye",
    description: "Müsait işleri alın, rotayı ve km’yi görün, fotoğraf ve imza ile teslim edin.",
    startUrl: "/kurye/",
    scope: "/kurye/",
    manifestPath: "/kurye/manifest.webmanifest",
    iconPath: "/pwa/icons/kurye-512.png",
    icon180Path: "/pwa/icons/kurye-180.png",
    swPath: "/kurye/sw.js",
    offlinePath: "/kurye/offline.html",
    themeColor: "#0A0A0A",
    backgroundColor: "#0A0A0A",
    htmlPath: "/kurye/index.html",
    bundleId: "tr.hizligel.kurye",
  },
  yonetici: {
    id: "https://kuryeler.tr/yonetici/",
    name: "Hızlıgel Yönetici",
    shortName: "Hızlıgel Yönetici",
    description: "Sipariş, kurye, müşteri ve sürüş TL tarifesini yönetin.",
    startUrl: "/yonetici/",
    scope: "/yonetici/",
    manifestPath: "/yonetici/manifest.webmanifest",
    iconPath: "/pwa/icons/yonetici-512.png",
    icon180Path: "/pwa/icons/yonetici-180.png",
    swPath: "/yonetici/sw.js",
    offlinePath: "/yonetici/offline.html",
    themeColor: "#0A0A0A",
    backgroundColor: "#0A0A0A",
    htmlPath: "/yonetici/index.html",
    bundleId: "tr.hizligel.yonetici",
  },
};

export const NATIVE_APPS: Record<PwaPanel, NativeAppConfig> = {
  musteri: {
    appId: PWA_APPS.musteri.bundleId,
    appName: PWA_APPS.musteri.name,
    configFile: "native/hizligel-musteri/capacitor.config.ts",
  },
  kurye: {
    appId: PWA_APPS.kurye.bundleId,
    appName: PWA_APPS.kurye.name,
    configFile: "native/hizligel-kurye/capacitor.config.ts",
  },
  yonetici: {
    appId: PWA_APPS.yonetici.bundleId,
    appName: PWA_APPS.yonetici.name,
    configFile: "native/hizligel-yonetici/capacitor.config.ts",
  },
};

export const PANEL_ROLE = {
  musteri: "customer",
  kurye: "courier",
  yonetici: "admin",
} as const;

export function panelFromPath(pathname: string): PwaPanel | "site" {
  if (pathname === "/musteri" || pathname.startsWith("/musteri/")) return "musteri";
  if (pathname === "/kurye" || pathname.startsWith("/kurye/")) return "kurye";
  if (pathname === "/yonetici" || pathname.startsWith("/yonetici/")) return "yonetici";
  return "site";
}

export function appBase(panel: PwaPanel) {
  return PWA_APPS[panel].scope.replace(/\/$/, "") || `/${panel}`;
}
