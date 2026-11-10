#!/usr/bin/env node
/** Her Hızlıgel uygulaması için Capacitor webDir hazırlar (Apple/Google hesabı gerekmez). */
import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "dist/public");
const apps = ["musteri", "kurye", "yonetici"];

if (!existsSync(join(publicDir, "index.html"))) {
  console.error("Önce `pnpm build:static` çalıştırın.");
  process.exit(1);
}

for (const app of apps) {
  const dest = join(root, "dist/native", app);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(publicDir, dest, { recursive: true });
  const appIndex = join(dest, app, "index.html");
  if (!existsSync(appIndex)) {
    console.error(`${app} index.html bulunamadı`);
    process.exit(1);
  }
  writeFileSync(join(dest, "index.html"), readFileSync(appIndex));
  console.log(dest);
}
