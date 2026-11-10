import { BrandMark, DemoBanner } from "@/components/kuryeler/BrandShell";
import { SiteFooter } from "@/components/kuryeler/SiteFooter";
import { SkipLink } from "@/components/kuryeler/UiStates";
import { cardClass } from "@/lib/kuryelerTheme";
import {
  BUSINESS,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  DEFAULT_PRICING,
  formatTariff,
  MAX_WEIGHT_KG,
  VAT_STATUS_NOTE,
} from "@shared/kuryeler";
import { Link } from "wouter";

export type LegalKind = "kvkk" | "kosullar" | "iletisim" | "islem-rehberi";

const TITLES: Record<LegalKind, string> = {
  kvkk: "KVKK aydınlatma metni",
  kosullar: "Kullanım koşulları",
  iletisim: "İletişim / Künye",
  "islem-rehberi": "İşlem rehberi",
};

export default function LegalPage({ kind }: { kind: LegalKind }) {
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
        <h1 className="mt-2 text-3xl font-black">{TITLES[kind]}</h1>
        <article className={`${cardClass} mt-6 space-y-5 p-5 text-sm leading-7 text-[#b4a882] sm:p-8`}>
          {kind === "kvkk" ? <KvkkBody /> : null}
          {kind === "kosullar" ? <TermsBody /> : null}
          {kind === "iletisim" ? <ContactBody /> : null}
          {kind === "islem-rehberi" ? <GuideBody /> : null}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

function ContactBody() {
  return (
    <>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">İletişim</h2>
        <p className="mt-2">
          Hizmet sağlayıcı ve veri sorumlusu: {BUSINESS.legalName} – Hızlıgel / kuryeler.tr
        </p>
        <p>Vergi dairesi / Vergi kimlik no: {BUSINESS.taxOffice} / {BUSINESS.taxId}</p>
        <p>Merkez (iş yeri) adresi: {BUSINESS.address}</p>
        <p>
          Telefon: {CONTACT_PHONE_DISPLAY} · E-posta: {CONTACT_EMAIL} · KEP: {BUSINESS.kep}
        </p>
        <p>Bağlı olduğu meslek odası: {BUSINESS.chamber}</p>
        <p>{BUSINESS.trademarkNote}</p>
      </section>
      <p className="text-xs text-[#8a7c52]">
        Köşeli parantezli alanlar işletme kimliği tamamlanınca doldurulacaktır. Şirket kurulursa ilk satır
        “[TİCARET UNVANI] – MERSİS: [NO] – Ticaret sicil no: [NO]” olur.
      </p>
      <nav className="flex flex-wrap gap-3 font-semibold text-[#D4AF37]">
        <Link href="/islem-rehberi">İşlem rehberi</Link>
        <Link href="/kosullar">Kullanım koşulları</Link>
        <Link href="/kvkk">KVKK aydınlatma metni</Link>
      </nav>
    </>
  );
}

function GuideBody() {
  return (
    <>
      <p>İŞLEM REHBERİ</p>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Hızlıgel Müşteri uygulamasında hesap açın veya giriş yapın.</li>
        <li>
          “Yeni” sekmesinde ürün, alım ve teslim noktası (arama veya harita), ağırlık (en fazla {MAX_WEIGHT_KG} kg),
          teslim alan kişi, gün-saat, telefon ve ödeme yöntemini girin.
        </li>
        <li>
          Sağdaki özet kutusunda sürüş mesafesini ve toplam ücreti ({VAT_STATUS_NOTE}) kontrol edin. Hatalı
          bilgiyi bu aşamada alanlara dönerek düzeltebilirsiniz.
        </li>
        <li>
          Ön bilgilendirme ve koşulları okuyup iki onay kutusunu işaretleyin ve “Siparişi onayla –
          ödeme yükümlülüğü doğar” butonuna basın.
        </li>
        <li>
          Siparişiniz e-posta ile teyit edilir. Sipariş ve ön bilgi metni hesabınızda “Geçmiş”
          sekmesinde {BUSINESS.retentionOrdersYears} yıl boyunca saklanır ve size e-postayla da gönderilir.
        </li>
      </ol>
      <p>Uyuşmazlıklarda tüketici hakem heyetine veya arabuluculuğa başvurabilirsiniz.</p>
    </>
  );
}

function KvkkBody() {
  return (
    <>
      <p className="font-bold text-[#f5edd6]">
        KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ
        <br />
        Sürüm 1.0 – Yürürlük: {BUSINESS.kvkkEffective}
      </p>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">1. Veri sorumlusu</h2>
        <p className="mt-2">
          {BUSINESS.legalName} (“Hızlıgel / kuryeler.tr”), {BUSINESS.address}, VKN/MERSİS: {BUSINESS.taxId},
          e-posta: {CONTACT_EMAIL}, KEP: {BUSINESS.kep}, tel: {CONTACT_PHONE_DISPLAY}.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">2. Hangi verileri, hangi yolla topluyoruz?</h2>
        <p className="mt-2">
          Site ve uygulama formları, harita seçimi ve kurye uygulaması aracılığıyla, otomatik yollarla:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            Müşteri: ad soyad, cep telefonu, e-posta, şifre (şifrelenmiş), sipariş içeriği, alım ve
            teslim adresi ile harita koordinatı, sürüş mesafesi, tarih-saat, ödeme yöntemi ve durumu, notlar.
          </li>
          <li>
            Teslim alan kişi (alıcı): ad soyad, teslim adresi; teslimde paket/teslim noktası fotoğrafı ve imza.
            Alıcı verileri bize sipariş veren kişiden gelir.
          </li>
          <li>
            Kurye: ad soyad, telefon, e-posta, çevrimiçi durumu, kabul ettiği işler, alım ve teslim
            fotoğrafları, kazanç kayıtları.
          </li>
          <li>Tüm kullanıcılar: oturum ve güvenlik kayıtları (IP adresi, giriş zamanı).</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">3. Amaçlar ve hukuki sebepler (KVKK md.5/2)</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            Siparişin alınması, kurye atanması, taşıma ve teslim, ücretin hesaplanması → sözleşmenin
            kurulması/ifası (md.5/2-c).
          </li>
          <li>Fatura, muhasebe ve yetkili kurum talepleri → hukuki yükümlülük (md.5/2-ç).</li>
          <li>
            Teslimin ispatı, hasar/kayıp ve uyuşmazlık süreçleri (fotoğraf, imza, kayıtlar) → bir hakkın
            tesisi, kullanılması veya korunması (md.5/2-e).
          </li>
          <li>Hesap ve sistem güvenliği, kötüye kullanımın önlenmesi → meşru menfaat (md.5/2-f).</li>
        </ul>
        <p className="mt-2">
          Pazarlama iletisi göndermiyoruz; ileride gönderirsek ayrıca ve isteğe bağlı onay isteriz.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">4. Kimlere aktarıyoruz?</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Siparişi kabul eden kuryeye: alım/teslim adresi, alıcı adı ve telefonu (yalnızca o iş için).</li>
          <li>Siparişi veren müşteriye: işi alan kuryenin adı ve sipariş durumu.</li>
          <li>
            Altyapı hizmeti aldığımız şirketlere (veri işleyen):
            <ul className="mt-1 list-disc pl-5">
              <li>Supabase (veritabanı ve kimlik doğrulama) – sunucu: [AB/Frankfurt – kontrol],</li>
              <li>Turhost (site barındırma) – Türkiye,</li>
              <li>
                Harita ve adres servisleri: OpenStreetMap Foundation (harita, Nominatim adres arama),
                [Photon/komoot], OSRM / OpenRouteService (rota ve km hesabı). Adres ararken veya haritada
                nokta seçerken yazdığınız adres, seçtiğiniz konum ve IP adresiniz bu servislere iletilir.
              </li>
            </ul>
          </li>
          <li>
            Mali müşavir, avukat, sigorta şirketi; mahkemeler, vergi dairesi, kolluk ve diğer yetkili
            kurumlar (hukuki yükümlülük ve uyuşmazlık hâlinde).
          </li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">5. Yurt dışına aktarım (KVKK md.9)</h2>
        <p className="mt-2">
          Supabase ve harita/rota servislerinin sunucuları yurt dışındadır. Bu aktarım, KVKK md.9’daki
          [yeterlilik kararı / Kurul’un ilan ettiği standart sözleşme (imza tarihi: [TARİH], Kurum’a
          bildirim: [TARİH])] güvencesine dayanır.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">6. Saklama süresi</h2>
        <p className="mt-2">
          Sipariş ve teslim kayıtları {BUSINESS.retentionOrdersYears} yıl; fotoğraf ve imzalar {BUSINESS.retentionPhotoMonths} ay (uyuşmazlık varsa sonuçlanana
          kadar); fatura ve muhasebe kayıtları kanuni süre boyunca. Süre bitince silinir, yok edilir veya
          anonim hâle getirilir.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">7. Haklarınız (KVKK md.11)</h2>
        <p className="mt-2">
          Verinizin işlenip işlenmediğini öğrenme, bilgi isteme, amacını ve amaca uygun kullanılıp
          kullanılmadığını öğrenme, aktarıldığı üçüncü kişileri bilme, düzeltme, silme veya yok etme isteme,
          bu işlemlerin aktarılan kişilere bildirilmesini isteme, otomatik analiz sonucu aleyhinize çıkan
          sonuca itiraz etme, kanuna aykırı işleme nedeniyle zararın giderilmesini isteme.
          Başvuru: {BUSINESS.address}’e yazılı olarak, {BUSINESS.kep} adresine KEP ile veya kayıtlı e-postanızdan
          {CONTACT_EMAIL} adresine. En geç 30 gün içinde ücretsiz yanıt verilir (md.13). Yanıttan
          memnun kalmazsanız Kişisel Verileri Koruma Kurulu’na şikâyet edebilirsiniz (md.14).
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">8. Çerezler ve yerel depolama</h2>
        <p className="mt-2">
          Sitede reklam veya analiz çerezi kullanmıyoruz. Giriş yaptığınızda oturumunuzu açık tutmak için
          tarayıcınızın yerel depolama alanı kullanılır; bu, hizmetin çalışması için zorunludur.
          Analiz veya pazarlama aracı eklersek önce sizden ayrıca izin isteriz.
        </p>
      </section>
    </>
  );
}

function TermsBody() {
  const tariff = formatTariff(DEFAULT_PRICING);
  return (
    <>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">1. Taraflar</h2>
        <p className="mt-2">
          Bu koşullar, {BUSINESS.legalName} (“Hızlıgel / kuryeler.tr”, hizmet sağlayıcı) ile site veya
          Hızlıgel Müşteri uygulaması üzerinden sipariş veren kişi (müşteri) arasındadır.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">2. Hizmet</h2>
        <p className="mt-2">
          Taşıma hizmetini Hızlıgel, kendi kuryeleri veya anlaşmalı kuryeleri aracılığıyla verir; müşteriye
          karşı hizmetten Hızlıgel sorumludur. Hizmet, İstanbul ili sınırlarında evrak ve paket taşımasıdır
          (en fazla {MAX_WEIGHT_KG} kg). Çalışma alanı ve saatleri yönetici tarafından güncellenebilir.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">3. Ücret</h2>
        <p className="mt-2">
          Ücret Türk lirası olarak gösterilir ve TL ile ödenir: {tariff}. Mesafe haritadaki rota üzerinden
          hesaplanır, kuş uçuşu değildir. Siparişi onaylamadan önce toplam tutar gösterilir; teslim adresini
          siz değiştirmedikçe bu tutar artmaz. Ödeme yöntemleri: nakit, havale/EFT, kapıda kart. Gerçek kart
          tahsilatı bu sürümde yoktur; yöntem kayıt edilir. Fiyatlar dövize veya kura endeksli değildir.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">4. İptal ve cayma</h2>
        <p className="mt-2">
          Kurye atanmadan önce siparişi ücretsiz iptal edebilirsiniz. Bu hizmet seçtiğiniz tarih ve saatte
          yapılan bir eşya taşımasıdır ve onayınızla hemen başlar; bu nedenle cayma hakkı kullanılamaz
          (Mesafeli Sözleşmeler Yönetmeliği md.15/1-g, h). Kurye yola çıktıktan sonraki iptallerde makul
          masraf yansıtılabilir.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">5. Hasar, kayıp ve yasak gönderiler</h2>
        <p className="mt-2">
          Yasaklı, tehlikeli, beyan edilmeyen veya {MAX_WEIGHT_KG} kg’ı aşan içerikten gönderici sorumludur.
          Hizmet, paket/kapı fotoğrafı ve teslim alan imzası ile belgelenir. Hasar veya kayıp bildirimi
          teslimden sonra makul sürede {CONTACT_EMAIL} adresine yapılmalıdır.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">6. Kişisel veriler</h2>
        <p className="mt-2">
          Kişisel veriler{" "}
          <Link href="/kvkk" className="font-semibold text-[#D4AF37]">
            KVKK Aydınlatma Metni
          </Link>
          ’ne göre işlenir. Pazarlama iletisi gönderilmez.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#f5edd6]">7. Uyuşmazlık</h2>
        <p className="mt-2">
          Tüketici müşteriler, Tüketici Hakem Heyeti’ne veya arabuluculuğa başvurabilir. Tacirler yönünden
          İstanbul mahkemeleri ve icra daireleri yetkilidir (emredici kurallar saklıdır).
          İletişim: {CONTACT_EMAIL}, {CONTACT_PHONE_DISPLAY}.
        </p>
      </section>
      <p>
        Teknik adımlar için{" "}
        <Link href="/islem-rehberi" className="font-semibold text-[#D4AF37]">
          İşlem rehberi
        </Link>
        ’ne bakın.
      </p>
    </>
  );
}
