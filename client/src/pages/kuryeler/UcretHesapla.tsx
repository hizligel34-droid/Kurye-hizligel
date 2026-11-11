import { DemoBanner } from "@/components/kuryeler/BrandShell";
import { MobileCallBar } from "@/components/kuryeler/MobileCallBar";
import { PriceCalculator } from "@/components/kuryeler/PriceCalculator";
import { SiteFooter } from "@/components/kuryeler/SiteFooter";
import { SiteHeader } from "@/components/kuryeler/SiteMenu";
import { SkipLink } from "@/components/kuryeler/UiStates";
import { getPricing } from "@/lib/kuryelerApi";
import { DEFAULT_PRICING, formatTariff, formatTariffInclusive, type PricingSettings } from "@shared/kuryeler";
import { useEffect, useState } from "react";

export default function UcretHesapla() {
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  useEffect(() => {
    void getPricing()
      .then(setPricing)
      .catch(() => setPricing(DEFAULT_PRICING));
  }, []);

  return (
    <div className="has-call-bar touch-scope min-h-dvh overflow-x-clip bg-[var(--ink)] pb-[var(--mobile-bottom-bar)] text-base leading-[1.5] text-[#f5edd6] md:pb-0">
      <SkipLink />
      <DemoBanner />
      <SiteHeader compact />
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
      <MobileCallBar />
    </div>
  );
}
