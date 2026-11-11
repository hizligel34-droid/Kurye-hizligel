import { BrandMark, DemoBanner } from "@/components/kuryeler/BrandShell";
import { DeliveryTargetsBlock } from "@/components/kuryeler/DeliveryTargetsBlock";
import { MobileCallBar } from "@/components/kuryeler/MobileCallBar";
import { SiteFooter } from "@/components/kuryeler/SiteFooter";
import { SkipLink } from "@/components/kuryeler/UiStates";
import { getPricing } from "@/lib/kuryelerApi";
import { cardClass } from "@/lib/kuryelerTheme";
import { DEFAULT_PRICING, MAX_WEIGHT_KG, formatTariffInclusive, type PricingSettings } from "@shared/kuryeler";
import { useEffect, useState } from "react";
import { Link } from "wouter";

const extraFaqs = [
  {
    id: "sss-fiyat",
    q: "Ücret nasıl hesaplanır?",
    a: (pricing: PricingSettings) =>
      `${formatTariffInclusive(pricing)}. Kuş uçuşu değil, sürüş kilometresidir. Müşteriye görünen tutar KDV dahildir; altında net + KDV dökümü yer alır.`,
  },
  {
    id: "sss-uye",
    q: "Üye olmadan kurye çağırabilir miyim?",
    a: () =>
      "Evet. Ana sayfadaki fiyatı gördükten sonra Çağır ile ad, telefon, alım ve teslim adresi bırakın veya künyedeki numarayı arayın. WhatsApp bağlantısı yalnızca sizin tıklamanızla açılır.",
  },
  {
    id: "sss-gonderi",
    q: "Hangi gönderiler alınır?",
    a: () =>
      `Evrak, paket ve acil gönderi. En fazla ${MAX_WEIGHT_KG} kg. Yasaklı madde, canlı hayvan ve tehlikeli madde kabul edilmez.`,
  },
  {
    id: "sss-odeme",
    q: "Nasıl öderim?",
    a: () =>
      "Nakit, kapıda kart veya iyzico. Fatura teslim sonrası kesilir. Tutar Türk Lirasıdır.",
  },
  {
    id: "sss-iptal",
    q: "Siparişi iptal edebilir miyim?",
    a: () =>
      "Kurye atanmadan önce ücretsiz iptal edebilirsiniz. Atama sonrası iptal kuralları mesafeli sözleşmede yer alır.",
  },
  {
    id: "sss-bolge",
    q: "İstanbul dışı gider misiniz?",
    a: () => "Hizmet İstanbul içidir. İl dışı tarife bu sitede yayımlanmaz.",
  },
  {
    id: "sss-takip",
    q: "Siparişi nasıl takip ederim?",
    a: () => "Takip koduyla giriş yapmadan bakabilirsiniz. Tam sipariş için Hızlıgel Müşteri uygulaması vardır.",
  },
];

export default function SssPage() {
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
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)]">SSS</p>
        <h1 className="mt-2 text-3xl font-black">Sıkça sorulanlar</h1>
        <section className={`${cardClass} mt-6 space-y-4 p-5 sm:p-8`} aria-labelledby="sss-teslim">
          <h2 id="sss-teslim" className="text-xl font-black">
            Teslim ne kadar sürer?
          </h2>
          <DeliveryTargetsBlock pricing={pricing} />
        </section>
        {extraFaqs.map(item => (
          <section key={item.id} className={`${cardClass} mt-4 space-y-2 p-5 sm:p-8`} aria-labelledby={item.id}>
            <h2 id={item.id} className="text-xl font-black">
              {item.q}
            </h2>
            <p className="text-sm leading-6 text-[#b4a882]">{item.a(pricing)}</p>
          </section>
        ))}
      </main>
      <SiteFooter />
      <div className="h-16 md:hidden" aria-hidden />
      <MobileCallBar />
    </div>
  );
}
