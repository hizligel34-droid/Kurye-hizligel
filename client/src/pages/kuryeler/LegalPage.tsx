import { BrandMark, DemoBanner } from "@/components/kuryeler/BrandShell";
import { SiteFooter } from "@/components/kuryeler/SiteFooter";
import { SkipLink } from "@/components/kuryeler/UiStates";
import { cardClass } from "@/lib/kuryelerTheme";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY } from "@shared/kuryeler";
import { Link } from "wouter";

export default function LegalPage({ kind }: { kind: "kvkk" | "kosullar" }) {
  const title = kind === "kvkk" ? "KVKK aydınlatma metni" : "Kullanım koşulları";
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
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Yasal</p>
        <h1 className="mt-2 text-3xl font-black">{title}</h1>
        <p className="mt-3 rounded-2xl border border-[#3a3014] bg-[#1a1508] p-4 text-sm leading-6 text-[#D4AF37]">
          Bu metin yer tutucudur; yürürlüğe almadan önce Türkiye’de KVKK ve sözleşmeler konusunda
          yetkin bir avukat tarafından incelenmelidir.
        </p>
        <article className={`${cardClass} mt-6 space-y-5 p-5 text-sm leading-7 text-[#b4a882] sm:p-8`}>
          {kind === "kvkk" ? <KvkkBody /> : <TermsBody />}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

function KvkkBody() {
  return (
    <>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">1. Veri sorumlusu</h2>
        <p className="mt-2">
          kuryeler.tr markası altında hizmet sunan işletme, 6698 sayılı Kişisel Verilerin Korunması
          Kanunu kapsamında veri sorumlusudur. İletişim: {CONTACT_EMAIL}, {CONTACT_PHONE_DISPLAY},
          İstanbul.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">2. İşlenen veriler</h2>
        <p className="mt-2">
          Ad soyad, e-posta, telefon, teslimat adresleri, sipariş ve ödeme durumu, kurye çevrimiçi
          bilgisi ve işlem kayıtları hizmetin ifası için işlenir.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">3. Amaç ve hukuki sebep</h2>
        <p className="mt-2">
          Veriler siparişin alınması, kurye atanması, teslimat, müşteri desteği, güvenlik ve yasal
          yükümlülükler için; sözleşmenin kurulması/ifası ve meşru menfaat hukuki sebeplerine
          dayanılarak işlenir.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">4. Aktarım</h2>
        <p className="mt-2">
          Altyapı sağlayıcıları (ör. kimlik doğrulama ve veritabanı hizmeti) ile, yasal zorunluluk
          halinde yetkili kurumlarla paylaşılabilir. Yurt dışı aktarım varsa ayrıca bilgilendirilir.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">5. Haklarınız</h2>
        <p className="mt-2">
          KVKK m.11 kapsamındaki haklarınızı {CONTACT_EMAIL} adresine yazılı başvurarak
          kullanabilirsiniz. Başvurular yasal süre içinde yanıtlanır.
        </p>
      </section>
    </>
  );
}

function TermsBody() {
  return (
    <>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">1. Hizmet</h2>
        <p className="mt-2">
          kuryeler.tr, İstanbul ili sınırlarında evrak, paket ve gıda gönderilerinin kurye ile
          taşınmasına aracılık eder. Hizmet alanı ve çalışma saatleri yönetici tarafından
          güncellenebilir.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">2. Ücret</h2>
        <p className="mt-2">
          Ücret, sipariş anındaki açılış ücreti, km bedeli, paket türü ve varsa Avrupa–Anadolu ek
          ücretine göre TL olarak hesaplanır. Tahsilat altyapısı bağlanana kadar platform fiyat
          gösterir; ödeme yöntemi ayrıca teyit edilir.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">3. İptal</h2>
        <p className="mt-2">
          Teslim edilmemiş siparişler müşteri veya yönetici tarafından iptal edilebilir. Kurye yola
          çıktıktan sonraki iptallerde makul masraf yansıtılabilir.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">4. Sorumluluk</h2>
        <p className="mt-2">
          Yasaklı, tehlikeli veya beyan edilmeyen içerikten gönderici sorumludur. Platform aracı
          konumundadır; kuryeler bağımsız hizmet sağlayabilir.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">5. Uygulama</h2>
        <p className="mt-2">
          Uyuşmazlıklarda İstanbul mahkemeleri ve icra daireleri yetkilidir (emredici kurallar saklıdır).
        </p>
      </section>
    </>
  );
}
