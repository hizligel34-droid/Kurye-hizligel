import { BrandMark, DemoBanner } from "@/components/kuryeler/BrandShell";
import { DeliveryTargetsBlock } from "@/components/kuryeler/DeliveryTargetsBlock";
import { SiteFooter } from "@/components/kuryeler/SiteFooter";
import { SkipLink } from "@/components/kuryeler/UiStates";
import { getPricing } from "@/lib/kuryelerApi";
import { cardClass } from "@/lib/kuryelerTheme";
import { DEFAULT_PRICING, type PricingSettings } from "@shared/kuryeler";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function SssPage() {
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  useEffect(() => {
    void getPricing()
      .then(setPricing)
      .catch(() => setPricing(DEFAULT_PRICING));
  }, []);

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-[#f5edd6]">
      <SkipLink />
      <DemoBanner />
      <header className="border-b border-[#3a3014] bg-black">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <BrandMark compact />
          <Link href="/" className="text-sm font-bold text-[#D4AF37]">
            Ana sayfa
          </Link>
        </div>
      </header>
      <main id="icerik" className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">SSS</p>
        <h1 className="mt-2 text-3xl font-black">Sıkça sorulanlar</h1>
        <section className={`${cardClass} mt-6 space-y-4 p-5 sm:p-8`} aria-labelledby="sss-teslim">
          <h2 id="sss-teslim" className="text-xl font-black">
            Teslim ne kadar sürer?
          </h2>
          <DeliveryTargetsBlock pricing={pricing} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
