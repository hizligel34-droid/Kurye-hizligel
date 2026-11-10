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
- Sipariş: ürün, haritada alım/teslim, sürüş km, USD ücret, ağırlık (en fazla 30 kg), teslim alan kişi, gün ve saat, notlar, durum (Bekliyor / Alındı / Yolda / Teslim edildi / İptal), ödeme yöntemi/durumu
- Ana fiyat: **1 USD açılış + 1 USD × sürüş km** (kuş uçuşu değil). Örnek: 7,4 km → 8,4 USD. Açılış, km bedeli, yuvarlama ve USD/TL kuru Yönetici uygulamasından değişir
- Harita: Leaflet + OpenStreetMap karoları, Nominatim/Photon adres araması, OSRM (veya OpenRouteService) sürüş rotası
- Kurye: iş kabul, rota ve km, alım fotoğrafı, teslim fotoğrafı + imza, günlük kazanç
- Yönetici: tüm siparişler, kurye atama, USD fiyat ayarları; eski 55 bölgelik CSV yalnızca isteğe bağlı referans
- Supabase Auth + RLS + Realtime; env yoksa **yerel demo**
- Capacitor sarmalayıcı: üç ayrı `capacitor.config.ts` (ücretli Apple/Google hesabı gerekmez)
- Turhost statik yayın (`pnpm build:static` → `dist/public` + `.htaccess`)

## Fiyat nasıl hesaplanır?

```
ücret_usd = yuvarla(açılış_usd + km_usd × sürüş_km)
```

Varsayılan: açılış 1 USD, km 1 USD, 2 ondalık. 7,4 km → **8,4 USD**. İsteğe bağlı TL karşılığı yönetici kurundan üretilir (kur 0 ise TL gösterilmez). Mesafe haritadaki **yol/sürüş** rotasıdır; kuş uçuşu kullanılmaz.

Paket ağırlığı zorunludur. **30 kg üzeri** sipariş hem uygulamada hem veritabanında (`CHECK` + tetikleyici) şu mesajla reddedilir: `Maksimum taşıma sınırı 30 kg`.

Ücretsiz araçlar (kullanım politikasına uyulur: 500 ms arama gecikmesi, Nominatim `email`, OSM atıfı):

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
   - `supabase/seed.sql` (USD fiyat ayarları + isteğe bağlı bölge referansı + demo hesaplar)
3. Authentication → Email açık. İlk kurulumda Confirm email kapatılabilir.
4. Site URL: `https://kuryeler.tr`  
   Redirect: `https://kuryeler.tr/**`, `https://kuryeler.tr/musteri/**`, `https://kuryeler.tr/kurye/**`, `https://kuryeler.tr/yonetici/**` ve yerel `http://localhost:4173/**`
5. `.env`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_WHATSAPP_NUMBER=905324746745
VITE_CONTACT_EMAIL=iletisim@kuryeler.tr
VITE_CONTACT_PHONE=0532 474 67 45
# isteğe bağlı OpenRouteService (yoksa OSRM kullanılır)
# VITE_ORS_API_KEY=
```

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
- Sipariş ücreti `distance_km` üzerinden SQL tetikleyicisiyle USD yazılır; 30 kg `CHECK` + tetikleyici ile kesilir.
- Yönetici kaydı Müşteri/Kurye formundan açılamaz.
- Kart ödemesi yoktur; yalnızca nakit / havale / kapıda kart kaydı tutulur.

## Ekran görüntüleri

`docs/ekran-goruntuleri/` — iPhone 13 genişliği (390px) ve masaüstü.

## Geliştirici komutları

| Komut | Ne işe yarar |
| --- | --- |
| `pnpm dev:spa` | Vite (üç uygulama + site) |
| `pnpm build:static` | `dist/public` (Turhost) |
| `pnpm native:prepare` | Üç Capacitor webDir |
| `pnpm check` | TypeScript |
| `pnpm test` | Vitest |
| `pnpm icons` | PWA ikonları |
