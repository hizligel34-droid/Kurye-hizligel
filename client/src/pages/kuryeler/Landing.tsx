import { BrandMark, DemoBanner } from "@/components/kuryeler/BrandShell";
import { SiteFooter } from "@/components/kuryeler/SiteFooter";
import { SkipLink } from "@/components/kuryeler/UiStates";
import { WhatsAppButton, WhatsAppFab } from "@/components/kuryeler/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useKuryelerAuth, panelPathForRole } from "@/contexts/KuryelerAuth";
import { contactEmail, contactPhoneDisplay } from "@/lib/contact";
import { cardClass, goldBtn, ghostBtn } from "@/lib/kuryelerTheme";
import { BRAND_NAME, BRAND_URL, DEFAULT_PRICING, formatTl, PACKAGE_LABELS } from "@shared/kuryeler";
import { PWA_APPS } from "@shared/kuryelerPwa";
import { Bike, Clock3, LayoutDashboard, Package, Phone, ShieldCheck, Sparkles, UserRound, WalletCards } from "lucide-react";
import { Link } from "wouter";

const steps = [
  { title: "Adresleri yazın", body: "Alış ve teslim noktasını, paket türünü ve telefonunuzu girin." },
  { title: "Fiyatı görün", body: "Açılış ücreti + km (ve isteğe bağlı Avrupa–Anadolu ek ücreti) anında hesaplanır." },
  { title: "Kurye alsın", body: "Yakındaki kurye işi kabul eder; durumu canlı izlersiniz." },
  { title: "Teslim", body: "Alındı, yolda, teslim edildi — her adım kayıt altındadır." },
];

const apps = [
  {
    href: "/musteri",
    icon: Package,
    title: PWA_APPS.musteri.name,
    body: "Sipariş oluşturun, fiyatı TL olarak görün, geçmişi izleyin. Mac’e ayrı uygulama olarak yüklenebilir.",
  },
  {
    href: "/kurye",
    icon: UserRound,
    title: PWA_APPS.kurye.name,
    body: "Müsait işleri alın, durumu adım adım güncelleyin, günlük kazancı görün.",
  },
  {
    href: "/yonetici",
    icon: LayoutDashboard,
    title: PWA_APPS.yonetici.name,
    body: "Bugünün siparişleri, aktif kuryeler, gelir ve fiyat ayarları.",
  },
];

export default function Landing() {
  const { user } = useKuryelerAuth();
  const cta = user ? panelPathForRole(user.role) : "/musteri/kayit";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BRAND_NAME,
    url: BRAND_URL,
    email: contactEmail(),
    telephone: contactPhoneDisplay(),
    areaServed: "İstanbul",
    address: { "@type": "PostalAddress", addressLocality: "İstanbul", addressCountry: "TR" },
    description: "İstanbul içi kurye teslimat platformu.",
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
              <Link href="/takip">Takip</Link>
            </Button>
            {user ? (
              <Button size="sm" className={goldBtn} asChild>
                <Link href={panelPathForRole(user.role)}>Panele git</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="hidden text-[#f5edd6] sm:inline-flex" asChild>
                  <Link href="/musteri/giris">Giriş</Link>
                </Button>
                <Button size="sm" className={goldBtn} asChild>
                  <Link href="/musteri/kayit">Sipariş ver</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="icerik">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_42%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
              İstanbul · kuryeler.tr
            </p>
            <h1 className="mt-3 max-w-xl text-[2rem] font-black leading-tight tracking-tight text-[#f5edd6] sm:text-5xl">
              Şehrin kuryesi, kapınızın önünde.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-[#b4a882]">
              Evrak, paket veya gıda. Alış ve teslim adresini yazın, fiyatı TL olarak görün,
              kuryeyi canlı takip edin. Üç ayrı uygulama: müşteri, kurye ve yönetici.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className={`h-12 px-6 text-base ${goldBtn}`} asChild>
                <Link href={cta}>Sipariş oluştur</Link>
              </Button>
              <Button size="lg" variant="outline" className={`h-12 px-6 text-base ${ghostBtn}`} asChild>
                <Link href="/takip">Siparişimi takip et</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-[#b4a882]">
              <span className="inline-flex items-center gap-2">
                <Clock3 className="size-4 text-[#D4AF37]" /> Aynı gün teslim
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#D4AF37]" /> Rol bazlı güvenli panel
              </span>
              <span className="inline-flex items-center gap-2">
                <WalletCards className="size-4 text-[#D4AF37]" /> {formatTl(DEFAULT_PRICING.baseFeeTl)} açılış
              </span>
            </div>
          </div>
          <Card className={cardClass}>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Örnek fiyat</p>
                <span className="rounded-full border border-[#3a3014] bg-[#1a1508] px-3 py-1 text-xs font-bold text-[#D4AF37]">
                  Kadıköy → Beşiktaş
                </span>
              </div>
              <div className="rounded-2xl border border-[#3a3014] bg-black p-4">
                <p className="text-3xl font-black text-[#D4AF37]">{formatTl(150 + 9.5 * 25 + 40)}</p>
                <p className="mt-1 text-sm text-[#8a7c52]">Açılış + km + Avrupa–Anadolu geçişi</p>
              </div>
              <ul className="space-y-2 text-sm text-[#b4a882]">
                <li>Açılış ücreti {formatTl(DEFAULT_PRICING.baseFeeTl)}</li>
                <li>Km başı {formatTl(DEFAULT_PRICING.perKmTl)}</li>
                <li>Kıtalar arası ek {formatTl(DEFAULT_PRICING.crossSideSurchargeTl)}</li>
              </ul>
              <p className="text-xs text-[#8a7c52]">
                Yönetici panelinden taban ücret, km bedeli ve bölge ek ücretini değiştirebilirsiniz.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-black">Üç ayrı uygulama</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#b4a882]">
          Her panel kendi adresi, adı ve ikonuyla Mac’e ayrı PWA olarak yüklenebilir.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {apps.map(app => (
            <Link key={app.href} href={app.href} className={`${cardClass} p-5 transition hover:border-[#D4AF37]`}>
              <span className="grid size-11 place-items-center rounded-2xl border border-[#3a3014] bg-black text-[#D4AF37]">
                <app.icon size={20} />
              </span>
              <h3 className="mt-4 font-extrabold">{app.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#8a7c52]">{app.body}</p>
            </Link>
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
        <h2 className="text-2xl font-black">Paket türleri</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(PACKAGE_LABELS) as Array<keyof typeof PACKAGE_LABELS>).map(key => (
            <div key={key} className={`${cardClass} p-4`}>
              <span className="grid size-9 place-items-center rounded-2xl border border-[#3a3014] bg-black text-[#D4AF37]">
                <Bike className="size-4" />
              </span>
              <p className="mt-3 font-bold">{PACKAGE_LABELS[key]}</p>
              <p className="text-xs text-[#8a7c52]">Ek {formatTl(DEFAULT_PRICING.packageFees[key])}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-3xl border border-[#D4AF37]/40 bg-black px-5 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-bold text-[#D4AF37]">
                <Sparkles className="size-4" /> İstanbul içi kurye ağı
              </p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">Hemen sipariş verin.</h2>
              <p className="mt-2 max-w-md text-sm text-[#8a7c52]">
                Müşteri, kurye ve yönetici panelleri ayrı uygulamalar olarak yüklenebilir.
              </p>
            </div>
            <Button size="lg" className={`h-12 w-full sm:w-auto ${goldBtn}`} asChild>
              <Link href={cta}>Sipariş oluştur</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20" aria-labelledby="iletisim-baslik">
        <div className={`${cardClass} grid gap-6 p-5 md:grid-cols-[1.2fr_0.8fr] md:items-center md:p-8`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">İletişim</p>
            <h2 id="iletisim-baslik" className="mt-2 text-2xl font-black">Siparişi konuşalım.</h2>
            <p className="mt-2 text-sm leading-6 text-[#8a7c52]">
              WhatsApp veya telefon ile 7/24 ulaşın. Adres ve paket bilgisiyle fiyatı hemen netleştiririz.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
              <Phone className="size-4 text-[#D4AF37]" aria-hidden />
              <a href={`tel:+90${contactPhoneDisplay().replace(/\D/g, "").slice(-10)}`}>{contactPhoneDisplay()}</a>
            </p>
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
