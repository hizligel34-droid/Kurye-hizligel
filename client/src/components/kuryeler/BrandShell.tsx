import { InstallPrompt } from "@/components/kuryeler/InstallPrompt";
import { SkipLink } from "@/components/kuryeler/UiStates";
import { useKuryelerAuth } from "@/contexts/KuryelerAuth";
import { Button } from "@/components/ui/button";
import { goldBtn } from "@/lib/kuryelerTheme";
import { PWA_APPS, type PwaPanel } from "@shared/kuryelerPwa";
import { Bike, LayoutDashboard, LogOut, MessageCircle, Package, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";

export function BrandMark({ compact = false, href = "/" }: { compact?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex min-h-11 min-w-0 items-center gap-2 font-black tracking-tight text-[#f5edd6]">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#D4AF37] bg-black text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)]">
        <Bike size={20} aria-hidden />
      </span>
      <span className={`truncate ${compact ? "text-base" : "text-base sm:text-xl"}`}>
        Hızlıgel
      </span>
    </Link>
  );
}

const PANEL_NAV: Record<PwaPanel, { href: string; label: string; icon: typeof Bike }[]> = {
  musteri: [
    { href: "/", label: "Sipariş", icon: Package },
    { href: "/takip", label: "Takip", icon: Bike },
    { href: "/destek", label: "Destek", icon: MessageCircle },
  ],
  kurye: [{ href: "/", label: "İşler", icon: Bike }],
  yonetici: [{ href: "/", label: "Yönetim", icon: LayoutDashboard }],
};

export function BrandShell({
  children,
  title,
  panel,
}: {
  children: ReactNode;
  title?: string;
  panel: PwaPanel;
}) {
  const { user, signOut } = useKuryelerAuth();
  const [location] = useLocation();
  const nav = PANEL_NAV[panel];
  const loginHref = "/giris";
  const app = PWA_APPS[panel];

  const mobileNav = [
    ...nav,
    {
      href: user ? (panel === "musteri" ? "/hesap" : "/") : loginHref,
      label: user ? "Hesap" : "Giriş",
      icon: UserRound,
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-[#0a0a0a] pb-[calc(6rem+env(safe-area-inset-bottom))] text-[#f5edd6] md:pb-0">
      <SkipLink />
      <DemoBanner />
      <header className="sticky top-0 z-30 border-b border-[#3a3014] bg-black/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
          <BrandMark href="/" />
          <nav aria-label={app.name} className="hidden items-center gap-5 text-sm font-semibold md:flex">
            {nav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={location === item.href ? "page" : undefined}
                className={location === item.href ? "text-[#D4AF37]" : "text-[#b4a882]"}
              >
                {item.label}
              </Link>
            ))}
            {panel === "musteri" && user ? (
              <Link
                href="/hesap"
                aria-current={location === "/hesap" ? "page" : undefined}
                className={location === "/hesap" ? "text-[#D4AF37]" : "text-[#b4a882]"}
              >
                Hesap
              </Link>
            ) : null}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-sm font-semibold text-[#b4a882] sm:inline">
                  {user.fullName.split(" ")[0] || app.shortName}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#f5edd6]"
                  aria-label="Çıkış"
                  onClick={() => void signOut()}
                >
                  <LogOut className="size-4" />
                  <span className="hidden min-[360px]:inline">Çıkış</span>
                </Button>
              </>
            ) : (
              <Button size="sm" className={goldBtn} asChild>
                <Link href={loginHref}>Giriş</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      {title ? (
        <div className="mx-auto max-w-6xl px-4 pt-6 text-left">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4AF37]">{app.name}</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        </div>
      ) : null}
      <main id="icerik" className="flex-1">
        {children}
      </main>
      <nav
        aria-label="Mobil menü"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#3a3014] bg-black/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
      >
        <div className={`mx-auto grid max-w-lg gap-1 ${mobileNav.length >= 4 ? "grid-cols-4" : mobileNav.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
          {mobileNav.map(item => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              aria-current={location === item.href ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-[11px] font-bold ${
                location === item.href ? "bg-[#1a1508] text-[#D4AF37]" : "text-[#8a7c52]"
              }`}
            >
              <item.icon className="mb-0.5 size-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}

export function DemoBanner() {
  const { mode } = useKuryelerAuth();
  if (mode !== "demo") return null;
  return (
    <div className="border-b border-[#3a3014] bg-[#1a1508] px-4 py-2 text-center text-xs font-semibold text-[#D4AF37]">
      Yerel demo modu — Supabase bağlanınca gerçek hesaplar ve canlı veri kullanılır.
    </div>
  );
}

export function InstallHint({ panel }: { panel: PwaPanel }) {
  return <InstallPrompt panel={panel} />;
}
