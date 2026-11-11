import { BrandMark, DemoBanner } from "@/components/kuryeler/BrandShell";
import { MobileCallBar } from "@/components/kuryeler/MobileCallBar";
import { PriceCalculator } from "@/components/kuryeler/PriceCalculator";
import { SiteFooter } from "@/components/kuryeler/SiteFooter";
import { SkipLink } from "@/components/kuryeler/UiStates";
import { getPricing } from "@/lib/kuryelerApi";
import { DEFAULT_PRICING, formatTariff, formatTariffInclusive, type PricingSettings } from "@shared/kuryeler";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function UcretHesapla() {
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  useEffect(() => {
    void getPricing()
      .then(setPricing)
      .catch(() => setPricing(DEFAULT_PRICING));
  }, []);

  return (
    <div className="min-h-dvh bg-[var(--ink)] text-[#f5edd6]">
      <SkipLink />
      <DemoBanner />
      <header className="border-b border-[#3a3014] bg-black">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <BrandMark compact />
          <Link href="/" className="text-sm font-bold text-[var(--gold)]">
            Ana sayfa
          </Link>
        </div>
      </header>
      <main id="icerik" className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)]">Tarife</p>
        <h1 className="mt-2 text-3xl font-black">Ücret hesapla</h1>
        <p className="mt-3 text-sm leading-6 text-[#b4a882]">
          Yürürlükteki tarife: {formatTariffInclusive(pricing)}. Net tarife {formatTariff(pricing)}.
        </p>
        <div className="mt-6">
          <PriceCalculator pricing={pricing} />
        </div>
      </main>
      <SiteFooter />
      <div className="h-16 md:hidden" aria-hidden />
      <MobileCallBar />
    </div>
  );
}
