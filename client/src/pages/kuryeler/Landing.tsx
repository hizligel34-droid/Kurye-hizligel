import { BrandMark, DemoBanner } from "@/components/kuryeler/BrandShell";
import { DeliveryTargetsBlock } from "@/components/kuryeler/DeliveryTargetsBlock";
import { MobileCallBar } from "@/components/kuryeler/MobileCallBar";
import { PriceCalculator } from "@/components/kuryeler/PriceCalculator";
import { SiteFooter } from "@/components/kuryeler/SiteFooter";
import { SkipLink } from "@/components/kuryeler/UiStates";
import { WhatsAppButton } from "@/components/kuryeler/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPricing } from "@/lib/kuryelerApi";
import { contactPhoneDisplay, contactPhoneTel } from "@/lib/contact";
import { cardClass, goldBtn, ghostBtn } from "@/lib/kuryelerTheme";
import {
  HERO_HEADLINE,
  HERO_LEAD,
  PRIMARY_CTA,
  SECONDARY_CTA,
  SERVICE_CARDS,
  TRUST_PLACEHOLDER,
} from "@shared/landingCopy";
import {
  BRAND_NAME,
  BRAND_PRODUCT,
  BRAND_URL,
  BUSINESS,
  DEFAULT_PRICING,
  formatTariffInclusive,
  isShowcaseMode,
  SAME_DAY_CITY_DELIVERY,
  type PricingSettings,
} from "@shared/kuryeler";
import { PWA_APPS } from "@shared/kuryelerPwa";
import { Clock3, FileText, LayoutDashboard, Package, Phone, ShieldCheck, Smartphone, Sparkles, UserRound, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

const steps = [
  { title: "Noktaları seçin", body: "Alım ve teslim yerini haritadan veya adres aramasından işaretleyin." },
  { title: "Sürüş ücretini görün", body: `${formatTariffInclusive()}. Kuş uçuşu değil, gerçek rota.` },
  { title: "Kurye alsın", body: "Hızlıgel Kurye uygulamasındaki kurye işi, rotayı ve km’yi görür." },
  { title: "Teslim", body: "Alındı fotoğrafı, yolda, teslim fotoğrafı ve imza. En fazla 30 kg." },
];

const apps = [
  {
    href: "/musteri/",
    icon: Package,
    title: PWA_APPS.musteri.name,
    body: "Haritada alım/teslim seçin, sürüş km ve TL fiyatı görün, geçmişi izleyin.",
  },
  {
    href: "/kurye/",
    icon: UserRound,
    title: PWA_APPS.kurye.name,
    body: "Müsait işleri alın, rotayı ve km’yi görün, fotoğraf ve imza ile teslim edin.",
  },
  {
    href: "/yonetici/",
    icon: LayoutDashboard,
    title: PWA_APPS.yonetici.name,
    body: "Siparişler, kurye atama, açılış/km TL tarifesi ve isteğe bağlı bölge referansı.",
  },
];

const serviceIcons = [FileText, Package, Zap];

const faqs = [
  {
    q: "Teslim ne kadar sürer?",
    a: `${SAME_DAY_CITY_DELIVERY}. Hedef süre yol mesafesine göredir.`,
  },
  {
    q: "Ücret nasıl hesaplanır?",
    a: `${formatTariffInclusive()}. Kuş uçuşu değil, sürüş kilometresidir.`,
  },
  {
    q: "Üye olmadan çağırabilir miyim?",
    a: "Evet. Fiyatı gördükten sonra Çağır ile kısa talep bırakın veya arayın. Tam sipariş ve takip için Hızlıgel Müşteri uygulaması vardır.",
  },
  {
    q: "Hangi gönderiler alınır?",
    a: "Evrak, paket ve acil gönderi. En fazla 30 kg. Yasaklı madde kabul edilmez.",
  },
];

export default function Landing() {
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const showcase = isShowcaseMode(pricing);

  useEffect(() => {
    void getPricing()
      .then(setPricing)
      .catch(() => setPricing(DEFAULT_PRICING));
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `${BRAND_PRODUCT} · ${BRAND_NAME}`,
    legalName: BUSINESS.legalName,
    url: BRAND_URL,
    telephone: "+905324746745",
    areaServed: "İstanbul",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address,
      addressLocality: "Beşiktaş",
      addressRegion: "İstanbul",
      addressCountry: "TR",
    },
    description: `İstanbul moto kurye. Evrak, paket, acil teslimat. ${SAME_DAY_CITY_DELIVERY}.`,
    ...(BUSINESS.taxId !== "?" ? { taxID: BUSINESS.taxId } : {}),
    ...(BUSINESS.email !== "?" ? { email: BUSINESS.email } : {}),
    founder: BUSINESS.ownerName,
  };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[var(--ink)] text-[#f5edd6]">
      <SkipLink />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DemoBanner />
      <header className="sticky top-0 z-20 border-b border-[#3a3014] bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
          <BrandMark />
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" className="px-2 text-[#f5edd6] sm:px-3" asChild>
              <Link href="/iletisim">İletişim</Link>
            </Button>
            <Button variant="ghost" size="sm" className="hidden px-2 text-[#f5edd6] sm:inline-flex sm:px-3" asChild>
              <Link href="/takip">Takip</Link>
            </Button>
            <Button size="sm" className={`${goldBtn} hidden whitespace-nowrap md:inline-flex`} asChild>
              <a href="#cagir">{PRIMARY_CTA}</a>
            </Button>
          </div>
        </div>
      </header>

      <main id="icerik" className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_42%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:gap-10 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:py-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--gold)]">
                İstanbul · {BRAND_PRODUCT} · {BRAND_NAME}
              </p>
              <h1 className="mt-3 max-w-xl text-[2rem] font-black leading-tight tracking-tight text-[#f5edd6] sm:text-5xl">
                {HERO_HEADLINE}
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-[#b4a882]">{HERO_LEAD}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className={`h-12 px-6 text-base ${goldBtn}`} asChild>
                  <a href="#cagir">{PRIMARY_CTA}</a>
                </Button>
                <Button size="lg" variant="outline" className={`h-12 px-6 text-base ${ghostBtn}`} asChild>
                  <a href={contactPhoneTel()}>
                    <Phone className="mr-2 size-4" aria-hidden />
                    {SECONDARY_CTA}
                    <span className="sr-only"> {contactPhoneDisplay()}</span>
                  </a>
                </Button>
              </div>
              <div className="mt-6 hidden flex-wrap gap-4 text-sm font-semibold text-[#b4a882] sm:flex">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="size-4 text-[var(--gold)]" /> {SAME_DAY_CITY_DELIVERY}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Smartphone className="size-4 text-[var(--gold)]" /> iPhone ana ekrana ekle
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[var(--gold)]" /> İstanbul moto kurye
                </span>
              </div>
            </div>
            <PriceCalculator pricing={pricing} />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="hizmet-baslik">
          <h2 id="hizmet-baslik" className="text-2xl font-black">
            Hizmetler
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#b4a882]">İstanbul içi moto kurye. En fazla 30 kg.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {SERVICE_CARDS.map((card, index) => {
              const Icon = serviceIcons[index] ?? Package;
              return (
                <article key={card.title} className={`${cardClass} p-5`}>
                  <span className="grid size-11 place-items-center rounded-2xl border border-[#3a3014] bg-black text-[var(--gold)]">
                    <Icon size={20} aria-hidden />
                  </span>
                  <h3 className="mt-4 font-extrabold">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#8a7c52]">{card.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-6" aria-labelledby="guven-baslik">
          <h2 id="guven-baslik" className="text-2xl font-black">
            Güven
          </h2>
          <div className={`${cardClass} mt-4 p-5`}>
            <p className="text-sm leading-6 text-[#8a7c52]">{TRUST_PLACEHOLDER}</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-6" aria-labelledby="teslim-baslik">
          <h2 id="teslim-baslik" className="text-2xl font-black">
            Teslim
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#b4a882]">Yol mesafesine göre hedef süre.</p>
          <div className="mt-4">
            <DeliveryTargetsBlock pricing={pricing} />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-6" aria-labelledby="sss-baslik" id="sss">
          <h2 id="sss-baslik" className="text-2xl font-black">
            Sıkça sorulanlar
          </h2>
          <div className="mt-6 grid gap-4">
            {faqs.map(item => (
              <article key={item.q} className={`${cardClass} p-5`}>
                <h3 className="font-extrabold">{item.q}</h3>
                <p className="mt-2 text-sm leading-6 text-[#8a7c52]">{item.a}</p>
              </article>
            ))}
          </div>
          <Link href="/sss" className="mt-4 inline-block text-sm font-bold text-[var(--gold)]">
            Tüm SSS
          </Link>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="uygulamalar-baslik">
          <h2 id="uygulamalar-baslik" className="text-2xl font-black">
            Üç ayrı uygulama
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#b4a882]">
            Her biri kendi adı, ikonu, giriş ekranı ve kapsamı ile yüklenir. Uygulama içinde rol değiştirme yoktur.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {apps.map(app => (
              <a key={app.href} href={app.href} className={`${cardClass} p-5 transition hover:border-[var(--gold)]`}>
                <span className="grid size-11 place-items-center rounded-2xl border border-[#3a3014] bg-black text-[var(--gold)]">
                  <app.icon size={20} />
                </span>
                <h3 className="mt-4 font-extrabold">{app.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#8a7c52]">{app.body}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-6">
          <h2 className="text-2xl font-black">Nasıl çalışır?</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <Card key={step.title} className={cardClass}>
                <CardContent className="p-5">
                  <span className="grid size-9 place-items-center rounded-2xl border border-[#3a3014] bg-black text-sm font-black text-[var(--gold)]">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-extrabold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#8a7c52]">{step.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="rounded-3xl border border-[var(--gold)]/40 bg-black px-5 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-bold text-[var(--gold)]">
                  <Sparkles className="size-4" /> iPhone 13 Safari
                </p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">Ana ekrana üç ikon.</h2>
                <p className="mt-2 max-w-md text-sm text-[#8a7c52]">
                  Her uygulamayı Safari ile açın → Paylaş → Ana Ekrana Ekle. İkonlar karışmaz.
                </p>
              </div>
              <Button size="lg" className={`h-12 w-full sm:w-auto ${goldBtn}`} asChild>
                <a href={showcase ? "/iletisim" : "/musteri/"}>{showcase ? "İletişim" : "Müşteri uygulamasını aç"}</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20" aria-labelledby="iletisim-baslik">
          <div className={`${cardClass} grid gap-6 p-5 md:grid-cols-[1.2fr_0.8fr] md:items-center md:p-8`}>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)]">İletişim</p>
              <h2 id="iletisim-baslik" className="mt-2 text-2xl font-black">
                Künye ve ulaşım.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#8a7c52]">
                {BUSINESS.legalName} – Hızlıgel / kuryeler.tr · {BUSINESS.address}
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                <Phone className="size-4 text-[var(--gold)]" aria-hidden />
                <a href={contactPhoneTel()}>{contactPhoneDisplay()}</a>
              </p>
              <p className="mt-2 text-xs text-[#8a7c52]">E-posta: {BUSINESS.email}</p>
              <Link href="/iletisim" className="mt-3 inline-block text-sm font-bold text-[var(--gold)]">
                Tam iletişim / künye
              </Link>
            </div>
            <WhatsAppButton className="w-full md:w-auto md:justify-self-end" />
          </div>
        </section>
      </main>
      <SiteFooter />
      <MobileCallBar />
    </div>
  );
}
