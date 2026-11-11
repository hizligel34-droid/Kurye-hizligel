import { BrandMark } from "@/components/kuryeler/BrandShell";
import { MobileCallBar } from "@/components/kuryeler/MobileCallBar";
import { SkipLink } from "@/components/kuryeler/UiStates";
import { Button } from "@/components/ui/button";
import { contactPhoneDisplay, contactPhoneTel } from "@/lib/contact";
import { ghostBtn, goldBtn } from "@/lib/kuryelerTheme";
import { PRIMARY_CTA, SECONDARY_CTA } from "@shared/landingCopy";
import { Home, Phone } from "lucide-react";
import { Link } from "wouter";

export default function NotFound({
  homeHref = "/",
  homeLabel = "Ana sayfa",
}: {
  homeHref?: string;
  homeLabel?: string;
}) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-[var(--ink)] text-[#f5edd6]">
      <SkipLink />
      <header className="border-b border-[#3a3014] bg-black">
        <div className="mx-auto flex h-16 max-w-lg items-center px-4">
          <BrandMark compact href={homeHref} />
        </div>
      </header>
      <main id="icerik" className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-[#3a3014] bg-[#101010] p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)]">Hızlıgel</p>
          <h1 className="mt-4 text-4xl font-black">Sayfa bulunamadı</h1>
          <p className="mt-4 text-sm leading-6 text-[#8a7c52]">
            Aradığınız adres yok. İstanbul moto kurye için ana sayfadan fiyat görün veya arayın.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button className={goldBtn} asChild>
              <a href="/#cagir">{PRIMARY_CTA}</a>
            </Button>
            <Button className={ghostBtn} asChild>
              <a href={contactPhoneTel()}>
                <Phone className="mr-2 h-4 w-4" aria-hidden />
                {SECONDARY_CTA}
                <span className="sr-only"> {contactPhoneDisplay()}</span>
              </a>
            </Button>
          </div>
          <div className="mt-4">
            <Button variant="ghost" className="text-[#f5edd6]" asChild>
              <Link href={homeHref}>
                <Home className="mr-2 h-4 w-4" />
                {homeLabel}
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <MobileCallBar />
    </div>
  );
}
