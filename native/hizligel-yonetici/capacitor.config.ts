import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "tr.hizligel.yonetici",
  appName: "Hızlıgel Yönetici",
  webDir: "../../dist/native/yonetici",
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#0A0A0A",
  },
  android: {
    backgroundColor: "#0A0A0A",
  },
};

export default config;
