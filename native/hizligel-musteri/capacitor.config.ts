import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "tr.hizligel.musteri",
  appName: "Hızlıgel Müşteri",
  webDir: "../../dist/native/musteri",
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
