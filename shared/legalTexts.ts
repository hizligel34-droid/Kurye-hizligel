import { BUSINESS, CONTACT_PHONE_DISPLAY } from "./kuryeler";
import {
  applyLegalPlaceholders,
  LEGAL_DRAFT_BANNER,
  LEGAL_FILLED,
  LEGAL_UNKNOWN,
  LEGAL_VERSION,
  sha256Hex,
  type LegalDocKey,
} from "./legalPlaceholders";

export { LEGAL_DRAFT_BANNER, LEGAL_FILLED, LEGAL_UNKNOWN, LEGAL_VERSION, sha256Hex };
export type { LegalDocKey };

export type LegalDocument = {
  key: LegalDocKey;
  title: string;
  path: string;
  version: string;
  body: string;
};

function doc(key: LegalDocKey, title: string, path: string, raw: string): LegalDocument {
  const filled = applyLegalPlaceholders(raw).trim();
  const body = filled.includes(LEGAL_DRAFT_BANNER) ? filled : `${LEGAL_DRAFT_BANNER}\n\n${filled}`;
  return { key, title, path, version: LEGAL_VERSION, body };
}

const KUNYE = `
KÜNYE / BİLGİLENDİRME

Hizmet sağlayıcı: ${BUSINESS.legalName} – Hızlıgel / kuryeler.tr
İşletme sahibi: ${BUSINESS.ownerName}
Adres: ${BUSINESS.address}
Telefon: ${CONTACT_PHONE_DISPLAY}
E-posta: [E-POSTA]
Vergi dairesi / no: ${BUSINESS.taxOffice} / [VERGİ NO]
KEP: [KEP]
P1 yetki belgesi no: [P1 YETKİ BELGESİ NO]
Barındırma: [BARINDIRMA SAĞLAYICISI]

İşlem Rehberi · Kullanım Koşulları · Ön Bilgilendirme · KVKK · Çerez
`;

const ISLEM_REHBERI = `
HIZLIGEL NASIL ÇALIŞIR? (İŞLEM REHBERİ)

Hızlıgel, İstanbul içi kurye hizmetidir. Siparişi Hızlıgel Müşteri uygulamasından verirsiniz; taşımayı Hızlıgel kendi kuryeleri veya anlaşmalı kuryeleriyle yapar. Karşı tarafınız Hızlıgel’dir.

1. Üç uygulama
Hızlıgel Müşteri, Hızlıgel Kurye ve Hızlıgel Yönetici ayrı uygulamalardır. Birinde oturum açmak diğerine geçiş vermez.

2. Sipariş
Giriş yapın. Alım ve teslim noktasını haritadan seçin veya adresi yazın. Gönderi içeriğini ve ağırlığı girin (en fazla 20 kg). Tarih ve saat seçin. Ekranda görünen ücret KDV dâhildir ve Türk lirasıdır. Siparişi onaylamadan önce Ön Bilgilendirme ve Mesafeli Sözleşme metinlerini okuyun; onay kutularını işaretleyin. Onayla birlikte ödeme yükümlülüğü doğar.

3. Ödeme
Kart: iyzico ödeme formu sitede açılır; kart numarası Hızlıgel sunucularında tutulmaz.
Nakit veya kapıda kart: kurye teslimde tahsil eder.

4. Takip
Sipariş verdikten sonra kurye atanıncaya kadar ücretsiz iptal edebilirsiniz. Atanan kuryenin adı ve konumunu uygulamada görürsünüz. Teslimde kurye fotoğraf ve imza alır.

5. Yasak gönderiler
Tehlikeli madde, canlı hayvan, nakit para, yasadışı içerik ve 20 kg üstü kabul edilmez.

6. Destek
Telefon: ${CONTACT_PHONE_DISPLAY} · E-posta: [E-POSTA]
`;

const KVKK = `
KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ
Sürüm [SÜRÜM NO] – Yürürlük: [TARİH]
${LEGAL_DRAFT_BANNER}

1. Veri sorumlusu
${BUSINESS.legalName} (“Hızlıgel / kuryeler.tr”), işletme sahibi ${BUSINESS.ownerName}, ${BUSINESS.address}, vergi dairesi: ${BUSINESS.taxOffice}, VKN: [VERGİ NO], e-posta: [E-POSTA], KEP: [KEP], tel: ${CONTACT_PHONE_DISPLAY}.

2. Hangi verileri, hangi yolla topluyoruz?
Site ve uygulama formları, harita seçimi ve kurye uygulaması aracılığıyla, otomatik yollarla:
• Müşteri: ad soyad, cep telefonu, e-posta, şifre (şifrelenmiş), sipariş içeriği, alım ve teslim adresi ile harita koordinatı, sürüş mesafesi, tarih-saat, ödeme yöntemi ve durumu, notlar. Kurumsal müşteride unvan ve yetkili adı, fatura için VKN.
• Teslim alan kişi (alıcı): ad soyad, teslim adresi; teslimde paket/teslim noktası fotoğrafı ve imza. Alıcı verileri bize sipariş veren kişiden gelir.
• Kurye: ad soyad, telefon, e-posta, ehliyet ve ruhsat bilgisi, çevrimiçi durumu, konum (iş sırasında), kabul ettiği işler, alım ve teslim fotoğrafları, kazanç kayıtları.
• Tüm kullanıcılar: oturum ve güvenlik kayıtları (IP adresi, giriş zamanı).

3. Amaçlar ve hukuki sebepler (KVKK md.5/2)
• Siparişin alınması, kurye atanması, taşıma ve teslim, ücretin hesaplanması → sözleşmenin kurulması/ifası (md.5/2-c).
• Fatura, muhasebe ve yetkili kurum talepleri → hukuki yükümlülük (md.5/2-ç).
• Teslimin ispatı, hasar/kayıp ve uyuşmazlık süreçleri (fotoğraf, imza, kayıtlar) → bir hakkın tesisi, kullanılması veya korunması (md.5/2-e).
• Hesap ve sistem güvenliği, kötüye kullanımın önlenmesi → meşru menfaat (md.5/2-f).
Pazarlama iletisi göndermiyoruz; ileride gönderirsek ayrıca ve isteğe bağlı onay isteriz.

4. Kimlere aktarıyoruz?
• Siparişi kabul eden kuryeye: alım/teslim adresi, alıcı adı ve telefonu (yalnızca o iş için).
• Siparişi veren müşteriye: işi alan kuryenin adı ve sipariş durumu.
• Altyapı hizmeti aldığımız şirketlere (veri işleyen):
  – [VERİTABANI SAĞLAYICISI] (veritabanı ve kimlik doğrulama) – sunucu: [AB / ABD / diğer – kontrol],
  – [BARINDIRMA SAĞLAYICISI] (site barındırma) – [ülke],
  – [HARİTA / ROTA SERVİSLERİ] (adres arama, harita, km hesabı). Adres ararken veya haritada nokta seçerken yazdığınız adres, seçtiğiniz konum ve IP adresiniz bu servislere iletilir.
  – [ÖDEME KURULUŞU] (kartlı ödeme; kart numarası bize gelmez).
• Mali müşavir, avukat, sigorta şirketi; mahkemeler, vergi dairesi, kolluk ve diğer yetkili kurumlar (hukuki yükümlülük ve uyuşmazlık hâlinde).

5. Yurt dışına aktarım (KVKK md.9) — karar bekleniyor
Aşağıdaki iki seçenek taslaktır; yayına alınmamıştır.

Seçenek 1 — sunucular yurt içinde:
Veritabanı ve barındırma sunucularımız Türkiye’dedir. Harita/rota servislerinin sunucuları yurt dışındadır. Bu aktarım, KVKK md.9’daki [yeterlilik kararı / Kurul’un ilan ettiği standart sözleşme (imza tarihi: [TARİH], Kurum’a bildirim: [TARİH])] güvencesine dayanır.

Seçenek 2 — sunucular yurt dışında:
Veritabanı, barındırma ve harita/rota servislerinin sunucuları yurt dışındadır ([ülke / ABD]). Bu aktarım, KVKK md.9’daki [yeterlilik kararı / Kurul’un ilan ettiği standart sözleşme (imza tarihi: [TARİH], Kurum’a bildirim: [TARİH])] güvencesine dayanır.

6. Saklama süresi
Sipariş ve teslim kayıtları [YIL] yıl; fotoğraf ve imzalar [AY] ay (uyuşmazlık varsa sonuçlanana kadar); fatura ve muhasebe kayıtları kanuni süre boyunca. Süre bitince silinir, yok edilir veya anonim hâle getirilir.

7. Haklarınız (KVKK md.11)
Verinizin işlenip işlenmediğini öğrenme, bilgi isteme, amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü kişileri bilme, düzeltme, silme veya yok etme isteme, bu işlemlerin aktarılan kişilere bildirilmesini isteme, otomatik analiz sonucu aleyhinize çıkan sonuca itiraz etme, kanuna aykırı işleme nedeniyle zararın giderilmesini isteme.
Başvuru: ${BUSINESS.address} adresine yazılı olarak, [KEP] adresine KEP ile veya künyede belirtilen e-posta ([E-POSTA]) üzerinden. En geç 30 gün içinde ücretsiz yanıt verilir (md.13). Yanıttan memnun kalmazsanız Kişisel Verileri Koruma Kurulu’na şikâyet edebilirsiniz (md.14).

8. Çerezler ve yerel depolama
Sitede reklam veya analiz çerezi kullanmıyoruz. Giriş yaptığınızda oturumunuzu açık tutmak için tarayıcınızın yerel depolama alanı kullanılır; bu, hizmetin çalışması için zorunludur. Analiz veya pazarlama aracı eklersek önce sizden ayrıca izin isteriz.
`;

const CEREZ = `
ÇEREZ VE YEREL DEPOLAMA BİLGİSİ
Sürüm [SÜRÜM NO] – [TARİH]
${LEGAL_DRAFT_BANNER}

Hızlıgel / kuryeler.tr sitesi ve uygulamaları reklam veya izleme çerezi kullanmaz. Giriş yaptığınızda oturumunuzun açık kalması için tarayıcınızın yerel depolama alanı kullanılır; bu, hizmetin çalışması için zorunludur. Analiz veya pazarlama aracı eklersek, kullanılmaya başlamadan önce sizden ayrıca izin isteriz ve bu metni güncelleriz.
Çerez paneli şu anda yok; analiz eklenirse ayrıca izin istenir.
`;

const ON_BILGI = `
ÖN BİLGİLENDİRME FORMU
Sürüm [SÜRÜM NO] – [TARİH]
${LEGAL_DRAFT_BANNER}

SATICI / HİZMET SAĞLAYICI
${BUSINESS.legalName} – Hızlıgel / kuryeler.tr
İşletme sahibi: ${BUSINESS.ownerName}
Adres: ${BUSINESS.address}
Tel: ${CONTACT_PHONE_DISPLAY} · E-posta: [E-POSTA]
Vergi dairesi / no: ${BUSINESS.taxOffice} / [VERGİ NO] · KEP: [KEP]
P1 yetki belgesi no: [P1 YETKİ BELGESİ NO]

HİZMET
Konu: İstanbul ili sınırlarında, sizin belirlediğiniz alım noktasından teslim noktasına evrak veya paket taşıması (en fazla 20 kg).
Gönderi içeriği: [GÖNDERİ İÇERİĞİ]
Alım adresi: [ALIM ADRESİ]
Teslim adresi: [TESLİM ADRESİ]
Sürüş mesafesi: [KM] km (harita rotası; kuş uçuşu değildir)
Ağırlık: [KG] kg
Tarih / saat: [TARİH-SAAT]
Hizmet, kuryenin gönderiyi teslim almasıyla başlar.

BEDEL
Görünen ücret (KDV dâhil): [TUTAR] TL
KDV hariç: [NET] TL + KDV ([ORAN] %): [KDV] TL
Ödeme: [ÖDEME YÖNTEMİ] — kartlı ödemede iyzico
Teslim adresini siz değiştirmedikçe bu tutar artmaz. Türk lirası dışındaki para birimi kullanılmaz.

TESLİM
Makul sürede, aktarmasız teslim.
Gönderiniz, kurye tarafından teslim alındıktan sonra aktarma ve depolama yapılmadan doğrudan alıcıya götürülür ve makul bir sürede teslim edilir. Mevzuat gereği teslim süresi taahhüdü verilmez. Gönderinizin nerede olduğunu uygulamadan canlı izleyebilirsiniz.
Teslim, paket veya kapı fotoğrafı ve teslim alanın imzası ile belgelenir.

CAYMA HAKKI
Bu hizmet, sizin seçtiğiniz tarih ve saatte yapılan bir eşya taşımasıdır ve onayınızla hemen başlar. Bu nedenle cayma hakkı kullanılamaz (Mesafeli Sözleşmeler Yönetmeliği md.15/1-g ve h).
Kurye atanmadan önce siparişi uygulamadan ücretsiz iptal edebilirsiniz. Kurye yola çıktıktan sonraki iptallerde makul masraf yansıtılabilir.

YASAK GÖNDERİLER VE SORUMLULUK
Tehlikeli madde, canlı hayvan, nakit para, yasadışı içerik ve 20 kg üstü kabul edilmez. Beyan edilmeyen veya yasaklı içerikten gönderici sorumludur.
Hasar veya kayıp bildirimi, teslimden sonra makul sürede ${CONTACT_PHONE_DISPLAY} veya [E-POSTA] üzerinden yapılmalıdır.

UYUŞMAZLIK
Tüketici Hakem Heyeti, tüketici mahkemesi veya arabuluculuk. Tacirler yönünden İstanbul mahkemeleri ve icra daireleri (emredici kurallar saklıdır).

KİŞİSEL VERİLER
KVKK Aydınlatma Metni’ne göre işlenir. Pazarlama iletisi gönderilmez.

ONAY
Yukarıdaki ön bilgileri okudum, anladım.
`;

const MESAFELI = `
MESAFELİ HİZMET SÖZLEŞMESİ
Sürüm [SÜRÜM NO] – [TARİH]
${LEGAL_DRAFT_BANNER}

1. TARAFLAR
Hizmet sağlayıcı: ${BUSINESS.legalName} – Hızlıgel / kuryeler.tr, ${BUSINESS.address}, ${BUSINESS.taxOffice} / [VERGİ NO], ${CONTACT_PHONE_DISPLAY}, [E-POSTA], [KEP].
Müşteri: [AD SOYAD], [TELEFON], [E-POSTA], [ADRES].

2. KONU
İstanbul ili sınırlarında, müşterinin belirlediği alım noktasından teslim noktasına evrak veya paket taşıması (en fazla 20 kg). Taşımayı Hızlıgel kendi kuryeleri veya anlaşmalı kuryeleri aracılığıyla yapar; müşteriye karşı hizmetten Hızlıgel sorumludur.

3. HİZMETİN İFASI
Sipariş: [SİPARİŞ NO] · Takip kodu: [TAKİP KODU]
Alım: [ALIM ADRESİ] · Teslim: [TESLİM ADRESİ] · Mesafe: [KM] km · Ağırlık: [KG] kg
Tarih/saat: [TARİH-SAAT] · İçerik: [GÖNDERİ İÇERİĞİ]
Hizmet, kuryenin gönderiyi teslim almasıyla başlar. Teslim, fotoğraf ve imza ile belgelenir.

4. BEDEL VE ÖDEME
Görünen ücret (KDV dâhil): [TUTAR] TL. KDV hariç [NET] TL + KDV [KDV] TL.
Ödeme: [ÖDEME YÖNTEMİ] — kartlı ödemede iyzico
Teslim adresini müşteri değiştirmedikçe tutar artmaz. Fiyat yalnızca Türk lirasıdır.

5. TESLİM
Makul sürede, aktarmasız teslim.
Gönderi, teslim alındıktan sonra aktarmasız ve depolamasız olarak makul sürede alıcıya götürülür. Süre taahhüdü verilmez. Konum uygulamadan izlenebilir.

6. CAYMA
Mesafeli Sözleşmeler Yönetmeliği md.15/1-g ve h uyarınca cayma hakkı yoktur. Kurye atanmadan önce ücretsiz iptal mümkündür.

7. YASAK GÖNDERİ VE SORUMLULUK
Yasaklı, tehlikeli, beyan edilmeyen veya 20 kg’ı aşan içerikten gönderici sorumludur. Hasar/kayıp bildirimi teslimden sonra makul sürede yapılmalıdır.

8. KİŞİSEL VERİLER
KVKK Aydınlatma Metni’ne tabidir.

9. UYUŞMAZLIK
Tüketici: Hakem Heyeti / tüketici mahkemesi / arabuluculuk. Tacirler: İstanbul mahkemeleri ve icra daireleri.

10. YÜRÜRLÜK
Sipariş onay kutularının işaretlenmesi ve onay ile kurulur. Sözleşme ve ön bilgi metni müşteri hesabında saklanır; e-posta ile teyit gönderilir.
`;

const KOSULLAR = `
KULLANIM KOŞULLARI
Sürüm [SÜRÜM NO] – [TARİH]
${LEGAL_DRAFT_BANNER}

1. Taraflar
Bu koşullar, ${BUSINESS.legalName} (“Hızlıgel / kuryeler.tr”, hizmet sağlayıcı) ile site veya Hızlıgel Müşteri uygulaması üzerinden sipariş veren kişi (müşteri) arasındadır.

2. Hizmet
Taşıma hizmetini Hızlıgel, kendi kuryeleri veya anlaşmalı kuryeleri aracılığıyla verir; müşteriye karşı hizmetten Hızlıgel sorumludur. Hizmet, İstanbul ili sınırlarında evrak ve paket taşımasıdır (en fazla 20 kg). Çalışma alanı ve saatleri yönetici tarafından güncellenebilir.

3. Ücret
Ücret Türk lirası olarak gösterilir ve TL ile ödenir. Tarife KDV hariçtir: 600 TL taban + 50 TL × km. Üzerine %20 KDV eklenir. Mesafe haritadaki rota üzerinden hesaplanır, kuş uçuşu değildir. Siparişi onaylamadan önce KDV dâhil toplam gösterilir; fatura satırında KDV hariç tutar ve KDV ayrıca yazılır. Teslim adresini siz değiştirmedikçe bu tutar artmaz. Ödeme: iyzico (kart), nakit, kapıda kart. Kart bilgisi iyzico’da kalır. Fiyat yalnızca Türk lirasıdır.

4. İptal ve cayma
Kurye atanmadan önce siparişi ücretsiz iptal edebilirsiniz. Bu hizmet seçtiğiniz tarih ve saatte yapılan bir eşya taşımasıdır ve onayınızla hemen başlar; bu nedenle cayma hakkı kullanılamaz (Mesafeli Sözleşmeler Yönetmeliği md.15/1-g, h). Kurye yola çıktıktan sonraki iptallerde makul masraf yansıtılabilir.

5. Hasar, kayıp ve yasak gönderiler
Yasaklı, tehlikeli, beyan edilmeyen veya 20 kg’ı aşan içerikten gönderici sorumludur. Hizmet, paket/kapı fotoğrafı ve teslim alan imzası ile belgelenir. Hasar veya kayıp bildirimi teslimden sonra makul sürede telefon (${CONTACT_PHONE_DISPLAY}) veya künyede belirtilen e-posta ([E-POSTA]) üzerinden yapılmalıdır.

6. Kişisel veriler
Kişisel veriler KVKK Aydınlatma Metni’ne göre işlenir. Pazarlama iletisi gönderilmez.

7. Uyuşmazlık
Tüketici müşteriler, Tüketici Hakem Heyeti’ne veya arabuluculuğa başvurabilir. Tacirler yönünden İstanbul mahkemeleri ve icra daireleri yetkilidir (emredici kurallar saklıdır).
İletişim: [E-POSTA], ${CONTACT_PHONE_DISPLAY}.
`;

const KURYE_SOZ = `
KURYE KULLANICI SÖZLEŞMESİ
Sürüm [SÜRÜM NO] – [TARİH]
${LEGAL_DRAFT_BANNER}

1. Taraflar
${BUSINESS.legalName} – Hızlıgel / kuryeler.tr (“Hızlıgel”) ile Hızlıgel Kurye uygulamasına kayıt olan kişi (“Kurye”).

2. Hizmet modeli
Hızlıgel, kendi işi olarak müşteriye taşıma hizmeti satar. Kurye, Hızlıgel’in verdiği işi kabul ederek fiilî taşımayı yapar. Kurye müşteriye karşı taraf değildir; müşteriye karşı sorumluluk Hızlıgel’dedir.
Bu sözleşme, 6563 sayılı Kanun anlamında aracı hizmet sağlayıcı–işletmeci ilişkisi kurmaz.

3. Kayıt ve belgeler
Kurye, kimlik, iletişim, ehliyet ve ruhsat bilgilerini doğru bildirir. Hızlıgel kayıt veya dönemsel kontrol için belge isteyebilir.

4. İş kabulü
Açık işler listesinde görünen siparişi Kurye kabul edebilir veya geçebilir. Kabulden sonra alım ve teslimi makul sürede, uygulamadaki talimatlara göre tamamlar. Konum paylaşımı iş süresince zorunludur.

5. Bedel
Her iş için Kurye’ye ödenecek tutar iş kartında TL olarak görünür. Ödeme dönemleri ve kesintiler (varsa) Hızlıgel tarafından ayrıca bildirilir. Kurye, müşteriden Hızlıgel’in talimatı dışındaki bir bedel talep etmez.

6. Yasaklar
Yasaklı gönderi, sahte teslim kaydı, başkasına hesap kullandırma, müşteriyle Hızlıgel dışı anlaşma yasaktır. Aykırılıkta hesap durdurulabilir.

7. Sorumluluk
Taşıma sırasında Kurye’nin kusuruyla oluşan hasar veya kayıptan Kurye Hızlıgel’e karşı sorumludur. Hızlıgel müşteriye karşı asıl yükümlüdür.

8. Kişisel veriler
Kurye, iş için kendisine aktarılan alıcı adı, telefon ve adresini yalnızca o iş için kullanır; iş bitince uygulamadaki talimata göre siler. Kendi verilerinin işlenmesi KVKK Aydınlatma Metni’ndeki kurye bölümüne tabidir.

9. Süre ve fesih
Belirsiz sürelidir. Taraflar makul bildirimle sona erdirebilir. Ağır aykırılıkta Hızlıgel derhal sona erdirebilir.

10. Uyuşmazlık
İstanbul mahkemeleri ve icra daireleri (emredici kurallar saklıdır).
`;

const GONDERICI_SOZ = `
GÖNDERİCİ / İŞLETMECİ SÖZLEŞMESİ
Sürüm [SÜRÜM NO] – [TARİH]
${LEGAL_DRAFT_BANNER}

1. Taraflar
${BUSINESS.legalName} – Hızlıgel / kuryeler.tr (“Hızlıgel”, aracı hizmet sağlayıcı) ile sitede kendi adına taşıma hizmeti sunan kişi veya işletme (“İşletmeci”).

2. Hizmet
Hızlıgel, İşletmeci ile alıcıyı bir araya getiren çevrimiçi ortamı işletir. Taşıma sözleşmesi İşletmeci ile alıcı arasındadır. Hızlıgel taşımanın tarafı değildir; 6563 sayılı Kanun md.11/5 saklıdır.

3. Kayıt
İşletmeci: ad soyad / unvan, [VERGİ NO], adres, telefon, e-posta, P1 yetki belgesi (varsa). Hızlıgel belgelerini isteyebilir ve yayından kaldırabilir.

4. İlan ve fiyat
İşletmeci ilan, tarife ve stok bilgilerini kendisi girer ve güncel tutar. Fiyat TL’dir. Alıcıya karşı ifa ve ayıptan İşletmeci sorumludur.

5. Komisyon
Hızlıgel, başarılı iş başına [ORAN] % komisyon alır. Tahsilat [ÖDEME KURULUŞU] üzerinden yapılır; Hızlıgel payı düşülerek kalan İşletmeciye aktarılır. Dönem: [DÖNEM].

6. Yasaklar
Yasaklı gönderi, sahte ilan, alıcıyla platform dışı ödeme yönlendirme yasaktır.

7. İçerik
İşletmeci içeriğinden 5651 sayılı Kanun md.4 ve 6563 sayılı Kanun md.9 uyarınca İşletmeci sorumludur. Şikâyette Hızlıgel içeriği yayından kaldırabilir.

8. Kişisel veriler
İşletmeci, alıcı verilerini yalnızca o iş için kullanır. Aydınlatma yükümlülüğü kendi veri işleme faaliyetleri için İşletmecidedir.

9. Süre ve fesih
Belirsiz sürelidir. Ağır aykırılıkta Hızlıgel derhal durdurabilir.

10. Uyuşmazlık
İstanbul mahkemeleri ve icra daireleri. Tüketici alıcılar yönünden Tüketici Hakem Heyeti / tüketici mahkemesi.
`;

const ARACILIK = `
ARACILIK HİZMETİ BİLGİLENDİRMESİ VE ŞİKÂYET
Sürüm [SÜRÜM NO] – [TARİH]
${LEGAL_DRAFT_BANNER}

Hızlıgel / kuryeler.tr, 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun anlamında aracı hizmet sağlayıcıdır. Sitede yer alan taşıma ilanları ve tarifeler, kendi adına hareket eden işletmecilere (göndericilere) aittir. Taşıma sözleşmesi işletmeci ile alıcı arasındadır; Hızlıgel bu sözleşmenin tarafı değildir (md.11/5 saklıdır).

İşletmeci bilgileri (ad soyad / unvan, [VERGİ NO], adres, iletişim) ilgili ilan veya işletmeci sayfasında gösterilir.

Şikâyet
İlan, işletmeci veya sipariş hakkında şikâyet: [E-POSTA] veya ${CONTACT_PHONE_DISPLAY}.
Şikâyet, 6563 sayılı Kanun md.9 ve ilgili Tebliğ uyarınca incelenir; hukuka aykırı içerik yayından kaldırılabilir. Yanıt süresi: en geç [GÜN] gün.

Tüketici uyuşmazlıkları
Alıcı, satıcı/işletmeciye karşı Tüketici Hakem Heyeti veya tüketici mahkemesine başvurabilir. Hızlıgel, kendi aracılık hizmetine ilişkin şikâyetleri ayrıca değerlendirir.
`;

const ODEME = `
ÖDEME BİLGİSİ
Sürüm [SÜRÜM NO] – [TARİH]
${LEGAL_DRAFT_BANNER}

Kartlı ödemeler iyzico altyapısı ile alınır. Kart numarası, son kullanma tarihi ve CVV Hızlıgel sunucularında tutulmaz. Ödeme kaydı sipariş numarası, tutar (kuruş, TL), KDV ve iyzico işlem kimliği ile saklanır.
Nakit ve kapıda kart, kurye tesliminde tahsil edilir.
Fatura, teslim sonrası kesilir; ödeme anında e-fatura oluşturulmaz.
`;

export const LEGAL_DOCUMENTS: Record<LegalDocKey, LegalDocument> = {
  kunye: doc("kunye", "Künye / Bilgilendirme", "/kunye", KUNYE),
  kvkk: doc("kvkk", "KVKK Aydınlatma Metni", "/kvkk", KVKK),
  cerez: doc("cerez", "Çerez ve yerel depolama", "/cerez", CEREZ),
  on_bilgi: doc("on_bilgi", "Ön Bilgilendirme Formu", "/on-bilgilendirme", ON_BILGI),
  mesafeli: doc("mesafeli", "Mesafeli Hizmet Sözleşmesi", "/mesafeli-sozlesme", MESAFELI),
  kosullar: doc("kosullar", "Kullanım Koşulları", "/kullanim-kosullari", KOSULLAR),
  kurye_soz: doc("kurye_soz", "Kurye Kullanıcı Sözleşmesi", "/kurye-kullanici-sozlesmesi", KURYE_SOZ),
  gonderici_soz: doc("gonderici_soz", "Gönderici / İşletmeci Sözleşmesi", "/gonderici-sozlesmesi", GONDERICI_SOZ),
  aracilik: doc("aracilik", "Aracılık ve şikâyet", "/aracilik-ve-sikayet", ARACILIK),
  odeme: doc("odeme", "Ödeme bilgisi", "/odeme-bilgisi", ODEME),
  islem_rehberi: doc("islem_rehberi", "İşlem rehberi", "/islem-rehberi", ISLEM_REHBERI),
};

export const LEGAL_PAGE_LINKS: Array<{ href: string; label: string }> = [
  { href: "/kunye", label: "Künye" },
  { href: "/islem-rehberi", label: "İşlem rehberi" },
  { href: "/kullanim-kosullari", label: "Kullanım koşulları" },
  { href: "/on-bilgilendirme", label: "Ön bilgilendirme" },
  { href: "/mesafeli-sozlesme", label: "Mesafeli sözleşme" },
  { href: "/kvkk", label: "KVKK" },
  { href: "/cerez", label: "Çerez" },
  { href: "/odeme-bilgisi", label: "Ödeme bilgisi" },
  { href: "/aracilik-ve-sikayet", label: "Aracılık (taslak)" },
  { href: "/kurye-kullanici-sozlesmesi", label: "Kurye sözleşmesi (taslak)" },
  { href: "/gonderici-sozlesmesi", label: "Gönderici sözleşmesi (taslak)" },
];

export const ORDER_CHECKBOX_LABELS = {
  preInfo:
    "Ön Bilgilendirme Formu’nu ve Mesafeli Hizmet Sözleşmesi’ni okudum, anladım. Siparişi onayladığımda ödeme yükümlülüğüm doğacağını biliyorum.",
  withdraw:
    "Bu hizmetin seçtiğim tarih ve saatte başlayan bir taşıma olduğunu, bu nedenle cayma hakkımın bulunmadığını (Yön. md.15/1-g, h) kabul ediyorum. Kurye atanmadan önce ücretsiz iptal edebileceğimi biliyorum.",
} as const;

export const ORDER_SUMMARY_FOOTER = `Onayla birlikte ödeme yükümlülüğü doğar.`;
export const ORDER_CONFIRM_BUTTON = "Siparişi onayla – ödeme yükümlülüğü doğar";
