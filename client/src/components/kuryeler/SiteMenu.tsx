import { BrandMark } from "@/components/kuryeler/BrandShell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { contactPhoneTel } from "@/lib/contact";
import { ghostBtn, goldBtn } from "@/lib/kuryelerTheme";
import { PRIMARY_CTA, SECONDARY_CTA } from "@shared/landingCopy";
import { LEGAL_PAGE_LINKS } from "@shared/legalTexts";
import { Bike, Menu, Phone } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const PRIMARY_LINKS = [
  { href: "/", label: "Ana sayfa" },
  { href: "/#cagir", label: PRIMARY_CTA },
  { href: "/takip", label: "Takip" },
  { href: "/sss", label: "SSS" },
  { href: "/iletisim", label: "İletişim" },
];

export function SiteHeader({ compact = false, homeHref = "/" }: { compact?: boolean; homeHref?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#3a3014] bg-black/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <BrandMark compact={compact} href={homeHref} />
        <SiteMenu />
      </div>
    </header>
  );
}

export function SiteMenu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav aria-label="Site" className="hidden items-center gap-2 md:flex">
        <Button variant="ghost" className="min-h-11 px-3 text-base text-[#f5edd6]" asChild>
          <Link href="/iletisim">İletişim</Link>
        </Button>
        <Button variant="ghost" className="min-h-11 px-3 text-base text-[#f5edd6]" asChild>
          <Link href="/takip">Takip</Link>
        </Button>
        <Button className={`min-h-11 whitespace-nowrap ${goldBtn}`} asChild>
          <a href="/#cagir">{PRIMARY_CTA}</a>
        </Button>
      </nav>
      <div className="flex items-center gap-2 md:hidden">
        <Button variant="outline" className={`${ghostBtn} min-h-11 min-w-11`} asChild>
          <Link href="/takip" aria-label="Takip">
            <Bike className="size-5" aria-hidden />
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          className={`${ghostBtn} min-h-11 min-w-11`}
          aria-label="Menüyü aç"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" aria-hidden />
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="h-dvh w-full max-w-none gap-0 border-[#3a3014] bg-[var(--ink)] p-0 text-[#f5edd6] sm:max-w-sm"
        >
          <SheetHeader className="border-b border-[#3a3014] px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] text-left">
            <SheetTitle className="pr-12 text-xl font-black text-[#f5edd6]">Menü</SheetTitle>
          </SheetHeader>
          <nav
            aria-label="Mobil menü"
            className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            {PRIMARY_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center rounded-xl px-3 text-base font-bold text-[#f5edd6] hover:bg-[#1a1508] hover:text-[var(--gold)]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href={contactPhoneTel()}
              className={`${ghostBtn} mt-2 inline-flex min-h-11 items-center justify-center gap-2 px-4 text-base`}
            >
              <Phone className="size-4" aria-hidden />
              {SECONDARY_CTA}
            </a>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)]">Yasal</p>
            {LEGAL_PAGE_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center rounded-xl px-3 text-base text-[#b4a882] hover:bg-[#1a1508] hover:text-[var(--gold)]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
