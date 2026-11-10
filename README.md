# kuryeler.tr

İstanbul (Türkiye) için kurye teslimat platformu. Marka: **kuryeler.tr**. Arayüz Türkçe, para birimi **TL**, tema **siyah + altın (#D4AF37)**.

Bu depo zaten çalışan bir TypeScript kurye uygulamasıydı (Vite + React, eski Run Courier panelleri, Express/tRPC/MySQL). Yeni ürün bunun üzerine kuruldu: **statik SPA + Supabase** (Turhost’a FTP ile yüklenebilir). Eski ekranlar `/eski` altında duruyor; atılmadı.

## Bu sürümde yapılan iyileştirmeler

- Siyah + altın (`#D4AF37`) tema: landing, giriş, üç panel, 404, KVKK, koşullar
- Üç ayrı PWA: `/musteri`, `/kurye`, `/yonetici` (farklı `id`, ad, ikon, start_url)
- Turhost statik SPA + `.htaccess` + README’de FTP yayını
- Boş / yükleniyor / hata durumları ve Yeniden dene
- Türkçe form doğrulama (sipariş, giriş, fiyat, takip) + `aria-invalid` / `aria-describedby`
- Erişilebilirlik: skip link, etiketler, `aria-current`, `:focus-visible` altın halka
- SEO: description, Open Graph, Twitter, canonical, JSON-LD, robots.txt, sitemap
- Favicon + siyah-altın PWA ikonları
- KVKK ve kullanım koşulları taslak sayfaları
- Landing’de WhatsApp + telefon CTA ve sabit WhatsApp düğmesi
- 404 Türkçe (ana sayfa + müşteri paneli)
- 375 / 768 / 1280: marka adı her genişlikte, yığılır grid, alt menü, taşma önleme
- Eski Run Courier ekranları `/eski` altında; kod bölünerek asıl paket küçültüldü

## Ne var?

Üç rol, üç ayrı uygulama adresi (Mac’te ayrı PWA olarak yüklenebilir):

| Uygulama | Adres | PWA adı |
| --- | --- | --- |
| Müşteri | `/musteri` | kuryeler.tr Müşteri |
| Kurye | `/kurye` | kuryeler.tr Kurye |
| Yönetici | `/yonetici` | kuryeler.tr Yönetici |

- **Müşteri:** kayıt/giriş, alış + teslim adresi, paket türü, not, telefon, fiyat tahmini, canlı durum (Beklemede → Kuryeye atandı → Alındı → Yolda → Teslim edildi / İptal), geçmiş.
- **Kurye:** giriş, çevrimiçi/çevrimdışı, müsait işleri kabul, durumu adım adım güncelleme, günlük kazanç.
- **Yönetici:** bugünün siparişleri, aktif kuryeler, gelir; atama/iptal; kurye ve müşteri rolleri; açılış ücreti + km + Avrupa/Anadolu bölge eki.
- **Landing:** `/` — sipariş CTA’sı.
- **Takip:** `/takip` (kod ile).

Veri katmanı: **Supabase Auth + Postgres + RLS + Realtime**. Sunucu mantığı SQL fonksiyonları ve isteğe bağlı Edge Function (`supabase/functions/estimate-price`). Ortam değişkeni yoksa uygulama **yerel demo** ile açılır (Supabase şart değil, ekran görüntüsü ve deneme için).

## Yerel çalışma

```bash
pnpm install
cp .env.example .env   # isteğe bağlı; boş bırakılırsa demo modu
pnpm icons             # PWA ikonları (python3)
pnpm test
pnpm check
pnpm build:static
pnpm dev:spa           # http://localhost:4173
```

Demo girişleri (yalnızca demo / seed; canlıda değiştirin):

- Müşteri: `musteri@kuryeler.tr` / `KuryelerMusteri1!`
- Kurye: `kurye@kuryeler.tr` / `KuryelerKurye1!`
- Yönetici: `yonetici@kuryeler.tr` / `KuryelerYonetici1!`

## Supabase kurulumu (canlıya almak için)

1. [supabase.com](https://supabase.com) üzerinde proje açın (bölge: Frankfurt önerilir).
2. SQL Editor’de sırayla çalıştırın:
   - `supabase/migrations/20241109120000_kuryeler_init.sql`
   - `supabase/seed.sql`
3. Authentication → Providers → Email açık olsun. İlk kurulumda **Confirm email**’i kapatabilirsiniz (yoksa kayıt sonrası e-posta onayı gerekir).
4. Authentication → URL Configuration:
   - Site URL: `https://kuryeler.tr`
   - Redirect: `https://kuryeler.tr/**` ve yerel `http://localhost:4173/**`
5. Project Settings → API: **Project URL** ve **anon public** anahtarını kopyalayın. `service_role` anahtarını asla SPA’ya veya Git’e koymayın.
6. `.env` dosyasına yazın, sonra **yeniden derleyin** (Vite değişkenleri derleme anında gömülür):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_WHATSAPP_NUMBER=905324746745
VITE_CONTACT_EMAIL=iletisim@kuryeler.tr
VITE_CONTACT_PHONE=0532 474 67 45
```

7. İlk yönetici: seed’deki `yonetici@kuryeler.tr` veya SQL:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'sizin@eposta');
```

8. Realtime: migration `orders` ve `profiles` tablolarını yayına ekler. Dashboard → Replication’dan kontrol edin.
9. İsteğe bağlı Edge Function:

```bash
npx supabase functions deploy estimate-price
```

## Turhost’a yayınlama (önerilen)

Turhost paylaşımlı hosting (cPanel/Plesk) Node.js vaat etmez. Bu proje **statik dosya** olarak çalışır: tarayıcı doğrudan Supabase konuşur.

1. Bilgisayarınızda `pnpm build:static` çalıştırın. Çıktı: `dist/public/` (`index.html`, `assets/`, `pwa/`, `.htaccess`).
2. cPanel → Dosya Yöneticisi veya FTP ile **alan adının public_html** (veya `kuryeler.tr` klasörü) içine `dist/public` **içeriğini** yükleyin. `index.html` kökte olmalı.
3. `.htaccess` yüklenmiş olmalı (Apache/LiteSpeed). Bu dosya `/musteri` gibi adresleri `index.html`’e çevirir. Yoksa 404 alırsınız.
4. SSL (Let’s Encrypt) açık olsun; Supabase yalnızca HTTPS ister.
5. Env değişince dosyaları Turhost’ta “düzenlemek” yetmez: `.env`’i güncelleyip **yeniden `pnpm build:static`** alın ve tekrar yükleyin.

### SPA 404 olursa

- `.htaccess` yüklü mü, `mod_rewrite` açık mı diye hostinge sorun.
- Alternatif: Plesk’te Apache/nginx “additional directives” ile `try_files $uri $uri/ /index.html;`

### Mac’te üç ayrı uygulama

1. Site canlıyken Chrome veya Safari ile sırayla açın: `/musteri`, `/kurye`, `/yonetici`.
2. **Safari:** Paylaş → Dock’a Ekle (her panel ayrı isim/ikon).
3. **Chrome:** Adres çubuğu yükle simgesi → “Uygulama olarak yükle”. Manifest `id` ve `start_url` farklı olduğu için üçü ayrı uygulama olur.

## Vercel (alternatif)

Turhost yoksa Vercel de olur: Git bağlantısı, Framework Vite, Output `dist/public`, env olarak `VITE_SUPABASE_*`. `_redirects` SPA fallback içindir. Asıl hedef Turhost’tur.

## Güvenlik notu

- Anon key kamuya açıktır; koruma **RLS** ile yapılır. Migration politikalarını atlamayın.
- Fiyat sipariş yazılırken SQL tetikleyicisiyle yeniden hesaplanır.
- Yönetici rolü kayıt formundan verilemez.
- Demo şifrelerini canlıda mutlaka değiştirin veya seed kullanıcılarını silin.

## Bilinen eksikler (v1 sonrası)

- Gerçek kart ödemesi / iyzico-PayTR yok (fiyat gösterilir, tahsilat yok).
- Canlı GPS harita kurye konumu yok (durum akışı var).
- SMS / WhatsApp bildirimi yok.
- Adresler İstanbul ilçe listesi + serbest sokak; Türkiye geneli API Turhost statik kurulumunda yok.
- Eski Run Courier Express+MySQL yığını yalnızca `/eski` ve `pnpm dev` ile durur; Turhost statik yayın bunu kullanmaz.

## Ekran görüntüleri

`docs/ekran-goruntuleri/` (375 / 768 / 1280):

- `landing-375.png`, `landing-768.png`, `landing-1280.png`
- `musteri-375.png`, `musteri-768.png`, `musteri-1280.png`
- `kurye-375.png`, `kurye-768.png`, `kurye-1280.png`
- `yonetici-375.png`, `yonetici-768.png`, `yonetici-1280.png`
- `kvkk-1280.png`, `404-375.png`, `takip-375.png`, `giris-1280.png`

## Geliştirici komutları

| Komut | Ne işe yarar |
| --- | --- |
| `pnpm dev:spa` | Statik Vite (Turhost ile aynı mimari) |
| `pnpm build:static` | `dist/public` üret |
| `pnpm check` | TypeScript |
| `pnpm test` | Vitest (eski sözleşmeler + kuryeler.tr fiyat/durum) |
| `pnpm dev` | Eski Express sunucusu (zorunlu değil) |
