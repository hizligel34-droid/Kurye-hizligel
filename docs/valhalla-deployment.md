# Run Kurye İstanbul Offline Routing Deployment

Run Kurye'nin canlı ürün kapsamı yalnızca İstanbul'dur. Ankara ve diğer şehirler için tile üretimi veya dağıtımı yapılmaz.

## Tile formatı

Offline motor için Valhalla tile seti kullanılmalıdır. Tile üretimi, İstanbul sınırlarıyla kırpılmış güncel OpenStreetMap yol verisinden yapılmalı; tile sürümü, veri tarihi, kaynak lisansı ve checksum birlikte yayınlanmalıdır. PMTiles harita paketi yalnızca görselleştirme içindir ve Valhalla yol ağı yerine geçmez.

## Depolama ve yenileme

Tile seti uygulama bundle'ına gömülmemelidir. Kalıcı servis ortamında sürümlü ve checksum doğrulamalı bir obje depolama alanında tutulmalı, Valhalla servisi yalnızca aktif sürümü okumalıdır. Yeni sürüm önce ayrı bir prefix'e yüklenmeli, checksum doğrulanmalı ve health-check başarılı olduktan sonra aktif sürüm işaretçisi değiştirilmelidir. Eski sürüm, geri dönüş amacıyla en az bir doğrulama döngüsü boyunca saklanmalıdır.

## Servis sözleşmesi

Backend `VALHALLA_BASE_URL` yapılandırılmışsa Valhalla provider'ını önce dener. Sağlıklı ve İstanbul koordinatları için `verified` route dönüyorsa gerçek kilometre ve süre mevcut ücret/komisyon hesabına girer. URL yoksa, HTTP hatası varsa, koordinatlar İstanbul dışındaysa veya route çıktısı geçersizse provider `null` döner ve mevcut Google driving fallback'i kullanılır. Kesin fiyat, doğrulanmış rota olmadan üretilmez.

## Android/iOS köprüsü

Native uygulama aşamasında bridge; tile sürümünü, checksum'u ve son health-check zamanını cihazda saklamalıdır. Uygulama stale tile veya başarısız health-check tespit ederse offline route sonucunu kesin kabul etmemeli, kullanıcıya online doğrulama gerektiğini göstermelidir. Bu repository'de native bridge ve gerçek tile üretim pipeline'ı henüz deploy edilmemiştir; bu doküman üretim önkoşullarını tanımlar.
