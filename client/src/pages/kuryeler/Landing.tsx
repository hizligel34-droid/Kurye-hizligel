import { BrandMark, DemoBanner } from "@/components/kuryeler/BrandShell";
import { SiteFooter } from "@/components/kuryeler/SiteFooter";
import { SkipLink } from "@/components/kuryeler/UiStates";
import { WhatsAppButton, WhatsAppFab } from "@/components/kuryeler/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useKuryelerAuth, panelPathForRole } from "@/contexts/KuryelerAuth";
import { getPricing } from "@/lib/kuryelerApi";
import { contactEmail, contactPhoneDisplay } from "@/lib/contact";
import { cardClass, goldBtn, ghostBtn } from "@/lib/kuryelerTheme";
import {
  BRAND_NAME,
  BRAND_PRODUCT,
  BRAND_URL,
  BUSINESS,
  calculateDeliveryPrice,
  DEFAULT_PRICING,
  formatKm,
  formatTariff,
  formatTlWithVat,
  isShowcaseMode,
} from "@shared/kuryeler";
import { PWA_APPS } from "@shared/kuryelerPwa";
import { Clock3, LayoutDashboard, Package, Phone, ShieldCheck, Smartphone, Sparkles, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

const steps = [
  { title: "Noktaları seçin", body: "Alım ve teslim yerini haritadan veya adres aramasından işaretleyin." },
  { title: "Sürüş ücretini görün", body: `${formatTariff()}. Kuş uçuşu değil, gerçek rota.` },
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

export default function Landing() {
  const { user } = useKuryelerAuth();
  const [showcase, setShowcase] = useState(isShowcaseMode());
  const samplePrice = calculateDeliveryPrice({ distanceKm: 7.4 });
  const sample3 = calculateDeliveryPrice({ distanceKm: 3 });
  const sample12 = calculateDeliveryPrice({ distanceKm: 12 });
  const ctaHref = showcase ? "/iletisim" : user ? panelPathForRole(user.role) : "/musteri/";

  useEffect(() => {
    void getPricing()
      .then(pricing => setShowcase(isShowcaseMode(pricing)))
      .catch(() => setShowcase(isShowcaseMode()));
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `${BRAND_PRODUCT} · ${BRAND_NAME}`,
    legalName: BUSINESS.legalName,
    taxID: BUSINESS.taxId,
    url: BRAND_URL,
    email: contactEmail(),
    telephone: contactPhoneDisplay(),
    areaServed: "İstanbul",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address,
      addressLocality: "İstanbul",
      addressCountry: "TR",
    },
    description: "İstanbul içi kurye teslimat. Üç ayrı uygulama: Müşteri, Kurye, Yönetici.",
  };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#0a0a0a] text-[#f5edd6]">
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
            <Button variant="ghost" size="sm" className="px-2 text-[#f5edd6] sm:px-3" asChild>
              <Link href="/takip">Takip</Link>
            </Button>
            <Button size="sm" className={goldBtn} asChild>
              <a href={ctaHref}>{showcase ? "Ara" : user ? "Uygulamam" : "Sipariş ver"}</a>
            </Button>
          </div>
        </div>
      </header>

      <main id="icerik">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_42%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
                İstanbul · {BRAND_PRODUCT} · {BRAND_NAME}
              </p>
              <h1 className="mt-3 max-w-xl text-[2rem] font-black leading-tight tracking-tight text-[#f5edd6] sm:text-5xl">
                {showcase ? "İstanbul kuryesi. Vitrin yayını." : "Şehrin kuryesi, üç ayrı uygulama."}
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-[#b4a882]">
                {showcase
                  ? `Sipariş formu kapalıdır. Tarifeyi görün, telefon veya WhatsApp ile ulaşın. ${formatTariff(DEFAULT_PRICING)}.`
                  : "Müşteri, kurye ve yönetici birbirinden bağımsız yüklenir. iPhone’da üç ayrı ana ekran ikonu: Hızlıgel Müşteri, Hızlıgel Kurye, Hızlıgel Yönetici."}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {showcase ? (
                  <Button size="lg" className={`h-12 px-6 text-base ${goldBtn}`} asChild>
                    <a href={`tel:+90${contactPhoneDisplay().replace(/\D/g, "").slice(-10)}`}>
                      {contactPhoneDisplay()}
                    </a>
                  </Button>
                ) : (
                  <Button size="lg" className={`h-12 px-6 text-base ${goldBtn}`} asChild>
                    <a href={ctaHref}>Hızlıgel Müşteri</a>
                  </Button>
                )}
                <Button size="lg" variant="outline" className={`h-12 px-6 text-base ${ghostBtn}`} asChild>
                  <Link href="/takip">Siparişimi takip et</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-[#b4a882]">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="size-4 text-[#D4AF37]" /> Aynı gün teslim
                </span>
                <span className="inline-flex items-center gap-2">
                  <Smartphone className="size-4 text-[#D4AF37]" /> iPhone ana ekrana ekle
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[#D4AF37]" /> Rol kilitli uygulamalar
                </span>
              </div>
            </div>
            <Card className={cardClass}>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Örnek sürüş ücreti</p>
                  <span className="rounded-full border border-[#3a3014] bg-[#1a1508] px-3 py-1 text-xs font-bold text-[#D4AF37]">
                    {formatKm(7.4)}
                  </span>
                </div>
                <div className="rounded-2xl border border-[#3a3014] bg-black p-4">
                  <p className="text-3xl font-black text-[#D4AF37]">{formatTlWithVat(samplePrice.totalTl)}</p>
                  <p className="mt-1 text-sm text-[#8a7c52]">{formatTariff()}</p>
                </div>
                <ul className="space-y-2 text-sm text-[#b4a882]">
                  <li>3 km → {formatTlWithVat(sample3.totalTl)}</li>
                  <li>7,4 km → {formatTlWithVat(samplePrice.totalTl)}</li>
                  <li>12 km → {formatTlWithVat(sample12.totalTl)}</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-black">Üç ayrı uygulama</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#b4a882]">
            Her biri kendi adı, ikonu, giriş ekranı ve kapsamı ile yüklenir. Uygulama içinde rol değiştirme yoktur.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {apps.map(app => (
              <a key={app.href} href={app.href} className={`${cardClass} p-5 transition hover:border-[#D4AF37]`}>
                <span className="grid size-11 place-items-center rounded-2xl border border-[#3a3014] bg-black text-[#D4AF37]">
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
                  <span className="grid size-9 place-items-center rounded-2xl border border-[#3a3014] bg-black text-sm font-black text-[#D4AF37]">
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
          <div className="rounded-3xl border border-[#D4AF37]/40 bg-black px-5 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-bold text-[#D4AF37]">
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
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">İletişim</p>
              <h2 id="iletisim-baslik" className="mt-2 text-2xl font-black">
                Künye ve ulaşım.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#8a7c52]">
                {BUSINESS.legalName} – Hızlıgel / kuryeler.tr · {BUSINESS.address}
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                <Phone className="size-4 text-[#D4AF37]" aria-hidden />
                <a href={`tel:+90${contactPhoneDisplay().replace(/\D/g, "").slice(-10)}`}>{contactPhoneDisplay()}</a>
              </p>
              <p className="mt-2 text-xs text-[#8a7c52]">{contactEmail()}</p>
              <Link href="/iletisim" className="mt-3 inline-block text-sm font-bold text-[#D4AF37]">
                Tam iletişim / künye
              </Link>
            </div>
            <WhatsAppButton className="w-full md:justify-self-end md:w-auto" />
          </div>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}
