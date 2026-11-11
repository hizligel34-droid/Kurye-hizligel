# Hızlıgel · kuryeler.tr

İstanbul kurye platformu. Marka: **Hızlıgel** (alan adı **kuryeler.tr**). Arayüz Türkçe, tema siyah + altın (`#D4AF37`).

Üç **tamamen ayrı** yüklenebilir uygulama vardır. Birbirinin içinden rol değiştirilmez; her uygulamanın kendi girişi, ikonu ve kapsamı vardır.

| Uygulama | Adres | PWA adı | iOS/Android paket |
| --- | --- | --- | --- |
| Müşteri | `/musteri/` | **Hızlıgel Müşteri** | `tr.hizligel.musteri` |
| Kurye | `/kurye/` | **Hızlıgel Kurye** | `tr.hizligel.kurye` |
| Yönetici | `/yonetici/` | **Hızlıgel Yönetici** | `tr.hizligel.yonetici` |

Pazarlama sitesi: `/` (üç uygulamaya bağlantı verir, kendi başına bir panel değildir).

## Bu sürümde ne var?

- Üç ayrı HTML girişi, üç manifest (`name` / `short_name` / `icon` / `start_url` / `scope`)
- iPhone 13 Safari: her uygulama kendi `apple-touch-icon` (180px) ve `apple-mobile-web-app-title` ile Ana Ekrana Ekle
- Çevrimdışı kabuk (`offline.html` + uygulama kapsamlı service worker)
- Sipariş: ürün, haritada alım/teslim, sürüş km, TL ücret, ağırlık (en fazla 30 kg), teslim alan kişi, gün ve saat, notlar, durum (Bekliyor / Alındı / Yolda / Teslim edildi / İptal), ödeme yöntemi/durumu
- Ana fiyat **KDV hariç 600 TL açılış + 50 TL × sürüş km**, üstüne varsayılan **%20 KDV**. Tüketici ekranlarında büyük fiyat **KDV dahil**dir: **720 TL açılış + 60 TL/km**, örnek 10 km = **1.320 TL KDV dahil**, altında **Net 1.100 TL + KDV %20 220 TL**. Yönetici / fatura metinlerinde KDV hariç + KDV kırılımı kalır. Fiyat yalnızca Türk lirasıdır.
- Harita: Leaflet + OpenStreetMap karoları, Nominatim/Photon adres araması (Ara düğmesi, otomatik tamamlama yok), OSRM (veya OpenRouteService) sürüş rotası
- Kurye: iş kabul (kabul öncesi yalnızca ilçe/km/ücret), rota ve km, alım fotoğrafı, teslim fotoğrafı + imza, günlük kazanç
- Yönetici: tüm siparişler, kurye atama, TL fiyat ayarları ve vitrin modu; eski 55 bölgelik CSV yalnızca isteğe bağlı referans
- Supabase Auth + RLS + Realtime; env yoksa **yerel demo**
- Capacitor sarmalayıcı: üç ayrı `capacitor.config.ts` (ücretli Apple/Google hesabı gerekmez)
- Turhost statik yayın (`pnpm build:static` → `dist/public` + `.htaccess`)

## Fiyat nasıl hesaplanır?

```
net_tl   = yuvarla(açılış_tl + km_tl × sürüş_km)   # KDV hariç
kdv_tl   = yuvarla(net_tl × kdv_orani)             # varsayılan 0,20
brüt_tl  = net_tl + kdv_tl                         # KDV dahil
```

Varsayılan: açılış **600 TL**, km **50 TL**, KDV **%20**, 2 ondalık. Tüketiciye: **Açılış 720 TL + km başı 60 TL (KDV dahil)**; 10 km = **1.320 TL KDV dahil**, altında **Net 1.100 TL + KDV %20 220 TL**. 7,4 km → 1.164 TL (KDV dahil). Kurye payı ve komisyon **net** üzerinden hesaplanır. Fiyat yalnızca Türk lirasıdır. Mesafe haritadaki **yol/sürüş** rotasıdır; kuş uçuşu kullanılmaz.

Paket ağırlığı zorunludur. **30 kg üzeri** sipariş hem uygulamada hem veritabanında (`CHECK` + tetikleyici) şu mesajla reddedilir: `Maksimum taşıma sınırı 30 kg`.

Ücretsiz araçlar (Nominatim: Ara düğmesi + saniyede en fazla 1 istek, `email` parametresi, OSM atıfı):

- Harita: Leaflet + OpenStreetMap karoları
- Adres: Nominatim (varsayılan) veya Photon
- Rota: OSRM `router.project-osrm.org` (varsayılan) veya OpenRouteService (ücretsiz katman, `VITE_ORS_API_KEY`). Yönetici rota sağlayıcısını değiştirebilir.

## Yerel çalışma

```bash
pnpm install
cp .env.example .env   # boş bırakılırsa demo modu
pnpm icons             # 180 / 192 / 512 PWA ikonları
pnpm test
pnpm check
pnpm build:static      # Turhost: dist/public + .htaccess
pnpm dev:spa           # http://localhost:4173
```

Yerel demoda hazır şifre yoktur; e-posta ve şifre ile kayıt olun. Yanlış rol ile giriş reddedilir (ör. kurye hesabı Müşteri uygulamasına giremez). Kurye hesabı canlıda yalnızca yönetici tarafından atanır.

Vitrin yayını için `.env` içinde `VITE_VITRIN_MODU=true` veya Yönetici panelinden vitrin anahtarı: kayıt ve sipariş kapalı, tarife ve telefon görünür.

## iPhone 13 Safari — ana ekrana üç ayrı ikon

1. Safari ile **https** üzerinden sırayla açın: `/musteri/`, `/kurye/`, `/yonetici/`.
2. Her sayfada alttaki **Paylaş** (kare + ok) → **Ana Ekrana Ekle** → **Ekle**.
3. İsimler otomatik gelir: Hızlıgel Müşteri / Hızlıgel Kurye / Hızlıgel Yönetici.
4. Chrome veya başka tarayıcı kullanmayın; iOS yalnızca Safari’de bu menüyü sunar.
5. Kapsamlar (`/musteri/`, `/kurye/`, `/yonetici/`) ayrı olduğu için üç ikon da durur.

Geliştirmede `localhost` de çalışır; canlıda SSL zorunludur.

## Supabase kurulumu

1. [supabase.com](https://supabase.com) üzerinde proje açın (Frankfurt önerilir).
2. SQL Editor’de sırayla:
   - `supabase/migrations/20241109120000_kuryeler_init.sql`
   - `supabase/migrations/20241110120000_district_prices_and_order_fields.sql`
   - `supabase/migrations/20241110140000_driving_distance_pricing.sql`
   - `supabase/migrations/20241110150000_tl_pricing_and_compliance.sql`
   - `supabase/migrations/20241110160000_vat_exclusive.sql`
   - `supabase/migrations/20241110223000_rls_hardening.sql`
   - `supabase/migrations/20241111090000_rls_grants_and_profile.sql`
   - `supabase/migrations/20241111100000_support_cancel_claims.sql`
   - `supabase/migrations/20241111110000_delivery_target_tiers.sql`
   - `supabase/migrations/20241111120000_iyzico_enum_values.sql`
   - `supabase/migrations/20241111121000_iyzico_payments.sql`
   - `supabase/seed.sql` (TL fiyat ayarları + KDV oranı + isteğe bağlı bölge referansı; demo hesap bloğunu canlıda çalıştırmayın)
3. Authentication → Email açık. İlk kurulumda Confirm email kapatılabilir.
4. Site URL: `https://kuryeler.tr`  
   Redirect: `https://kuryeler.tr/**`, `https://kuryeler.tr/musteri/**`, `https://kuryeler.tr/kurye/**`, `https://kuryeler.tr/yonetici/**` ve yerel `http://localhost:4173/**`
5. `.env`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_CONTACT_EMAIL=serif.tekin@hotmail.com
# Telefon/WhatsApp: shared/contactConfig.ts — 0553 255 67 45 / wa.me/905532556745
# isteğe bağlı OpenRouteService (yoksa OSRM kullanılır)
# VITE_ORS_API_KEY=
# Vitrin: kayıt/sipariş kapalı
# VITE_VITRIN_MODU=true
```

İyzico ve `service_role` anahtarlarını **asla** `VITE_` önekiyle yazmayın.

## iyzico (sandbox)

Canlı başvuru, ücretli entegratör ve gerçek anahtar bu depoda yok. Yalnız sandbox.

1. [iyzico sandbox](https://sandbox-merchant.iyzipay.com) hesabı açın (ücretsiz deneme; canlı POS bağlamayın).
2. Supabase → Edge Functions → Secrets:

```
IYZICO_API_KEY=sandbox-...
IYZICO_SECRET_KEY=sandbox-...
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
IYZICO_CALLBACK_URL=https://<proje>.supabase.co/functions/v1/iyzico-callback
PUBLIC_SITE_URL=https://kuryeler.tr
```

3. Fonksiyonlar: `iyzico-checkout` (Checkout Form initialize, `paymentGroup=LISTING`), `iyzico-callback` (token retrieve), `iyzico-webhook` (imza doğrulama).
4. Webhook URL: `https://<proje>.supabase.co/functions/v1/iyzico-webhook`
5. Tutar sunucuda hesaplanır: `60000 + 5000 × km` kuruş + %20 KDV, para birimi yalnız TRY. Kart PAN/CVV bizim sunucuya gelmez.
6. Fatura `delivered` anında `kesilecek` kaydı açar; e-Arşiv/e-Fatura sağlayıcı bağlı değildir (ücretli; TODO).
7. Künye `business_profile` tablosundan okunur (esnaf: MERSİS satırı yok; VKN/KEP `?`; vergi dairesi Maslak; e-posta `serif.tekin@hotmail.com`; işletme sahibi Canan Tekin). TCKN sütunu yoktur.

Sonra **yeniden** `pnpm build:static`. `service_role` anahtarını asla SPA’ya koymayın.

6. İlk yönetici:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'sizin@eposta');
```

## Turhost statik yayın

1. `pnpm build:static` → çıktı `dist/public/` (`index.html`, `musteri/`, `kurye/`, `yonetici/`, `assets/`, `.htaccess`).
2. FTP / Dosya Yöneticisi ile **public_html** köküne `dist/public` **içeriğini** yükleyin.
3. `.htaccess` şarttır: `/musteri/giris` gibi adresleri ilgili `index.html`’e çevirir.
4. SSL açık olsun.
5. Env değişince Turhost’ta dosya düzenlemek yetmez; yeniden derleyip yükleyin.

## Capacitor (ileride iOS/Android)

Ücretli hesap **gerekmez**; yalnızca yapılandırma vardır. Native proje üretmek için kendi bilgisayarınızda:

```bash
pnpm build:static
pnpm native:prepare
# isteğe bağlı, kendi makinenizde:
npm i -D @capacitor/cli @capacitor/core
npx cap add ios --config native/hizligel-musteri/capacitor.config.ts
npx cap add android --config native/hizligel-kurye/capacitor.config.ts
```

Üç config:

- `native/hizligel-musteri/capacitor.config.ts` → `tr.hizligel.musteri`
- `native/hizligel-kurye/capacitor.config.ts` → `tr.hizligel.kurye`
- `native/hizligel-yonetici/capacitor.config.ts` → `tr.hizligel.yonetici`

App Store / Play Store yayını Apple ve Google geliştirici hesapları ister; bu depo onları zorunlu kılmaz.

## Güvenlik

- Anon key kamuya açıktır; koruma RLS ile yapılır.
- Sipariş ücreti `distance_km` üzerinden SQL tetikleyicisiyle TL yazılır; 30 kg `CHECK` + tetikleyici ile kesilir. Takip kodu kriptografik rastgele üretilir. Kurye, kabul etmediği işte ad/telefon/tam adres görmez.
- Yönetici kaydı Müşteri/Kurye formundan açılamaz.
- Kart ödemesi iyzico Checkout Form ile alınır; PAN/CVV saklanmaz. Havale/IBAN ile Hızlıgel hesabına aktarım yoktur.

## Ekran görüntüleri

`docs/ekran-goruntuleri/` — iPhone 13 genişliği (390px) ve masaüstü. Eski tarife görselleri kaldırıldı; güncel arayüz Türk lirası ve KDV ayrımıdır.

## Geliştirici komutları

| Komut | Ne işe yarar |
| --- | --- |
| `pnpm dev:spa` | Vite (üç uygulama + site) |
| `pnpm build:static` | `dist/public` (Turhost) |
| `pnpm native:prepare` | Üç Capacitor webDir |
| `pnpm check` | TypeScript |
| `pnpm test` | Vitest |
| `pnpm icons` | PWA ikonları |
