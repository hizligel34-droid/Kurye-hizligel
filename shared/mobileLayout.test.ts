import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CONTACT_PHONE_DISPLAY, CUSTOMER_PHONE_NATIONAL } from "./contactConfig";
import { VIEWPORT_CONTENT } from "./mobileLayout";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(tsx?|css|html)$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe("mobil yerleşim kuralları", () => {
  it("viewport cihaz genişliği + cover; zoom kilidi yok", () => {
    const htmlFiles = [
      "client/index.html",
      "client/musteri/index.html",
      "client/kurye/index.html",
      "client/yonetici/index.html",
      "client/public/musteri/offline.html",
      "client/public/kurye/offline.html",
      "client/public/yonetici/offline.html",
    ];
    for (const file of htmlFiles) {
      const html = read(file);
      expect(html, file).toContain('name="viewport"');
      expect(html, file).toMatch(/width=device-width/);
      expect(html, file).toMatch(/initial-scale=1(\.0)?/);
      expect(html, file).toContain("viewport-fit=cover");
      expect(html, file).not.toMatch(/maximum-scale/);
      expect(html, file).not.toMatch(/user-scalable\s*=\s*no/i);
    }
    expect(VIEWPORT_CONTENT).toContain("width=device-width");
    expect(VIEWPORT_CONTENT).toContain("viewport-fit=cover");
  });

  it("gövde yazısı 16px / 1.5; altın zemin siyah yazı", () => {
    const css = read("client/src/index.css");
    expect(css).toMatch(/font-size:\s*16px/);
    expect(css).toMatch(/line-height:\s*1\.5/);
    expect(css).toContain("--gold: #D4AF37");
    expect(css).toMatch(/color:\s*#0A0A0A/);
    const theme = read("client/src/lib/kuryelerTheme.ts");
    expect(theme).toContain('text-base');
    expect(theme).toContain("min-h-11");
    expect(theme).toContain("checkLabelClass");
    expect(theme).toContain("text-black");
  });

  it("sitede hamburger + çekmece; panellerde alt sekme", () => {
    const menu = read("client/src/components/kuryeler/SiteMenu.tsx");
    expect(menu).toContain("Menüyü aç");
    expect(menu).toContain("md:hidden");
    expect(menu).toContain("h-dvh");
    expect(menu).toContain('aria-label="Takip"');
    expect(read("client/src/pages/kuryeler/Landing.tsx")).toContain("SiteHeader");
    expect(read("client/src/pages/kuryeler/Landing.tsx")).toContain("has-call-bar");
    const css = read("client/src/index.css");
    expect(css).toContain("--mobile-call-bar-height: 65px");
    expect(css).toContain("min-height: 44px");
    const shell = read("client/src/components/kuryeler/BrandShell.tsx");
    expect(shell).toContain('aria-label="Mobil menü"');
    expect(shell).toContain("md:hidden");
    expect(shell).toContain("gap-2");
    expect(shell).toContain("min-h-11");
    expect(shell).toContain("safe-area-inset-bottom");
    const track = read("client/src/pages/kuryeler/TrackPage.tsx");
    expect(track).toContain("h-12");
    expect(track).toContain("contactPhoneTel");
    expect(track).toContain("SECONDARY_CTA");
  });

  it("kuryeler sayfalarında 100vh / min-h-screen yok", () => {
    const files = walk(join(root, "client/src/pages/kuryeler")).concat(
      walk(join(root, "client/src/components/kuryeler")),
    );
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      expect(src, relative(root, file)).not.toMatch(/\bmin-h-screen\b/);
      expect(src, relative(root, file)).not.toMatch(/\b100vh\b/);
    }
  });

  it("telefon ve fiyat gösterimi değişmez", () => {
    expect(CUSTOMER_PHONE_NATIONAL).toBe("05324746745");
    expect(CONTACT_PHONE_DISPLAY).toBe("0532 474 67 45");
    const guest = read("shared/guestLead.ts");
    expect(guest).toContain("formatConsumerGross");
    expect(guest).toContain("formatConsumerVatLine");
  });
});
