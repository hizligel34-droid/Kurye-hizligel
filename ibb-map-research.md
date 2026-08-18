# İBB Şehir Haritası araştırma bulguları

18 Ağustos 2026 tarihinde `https://sehirharitasiapi.ibb.gov.tr/` resmi alan adı incelendi. Sayfa, İstanbul Büyükşehir Belediyesi haritasını yükleyen bir web uygulaması ve `developerconsole` bağlantısı içeriyor. Görsel arayüzde harita katmanları, arama alanı, WGS84 koordinat gösterimi ve “İstanbul Büyükşehir Belediyesi ©” atfı bulunuyor.

Sayfanın HTML kaynaklarında `js/mapBundle.js`, `js/mapAPI.js`, `js/ShrLayer.js` ve ilgili harita uygulama scriptleri görüldü. Ayrıca `http://sehirharitasiapi.ibb.gov.tr/developerconsole` bağlantısı mevcut. Resmi sayfa incelenmiş olsa da çevrimdışı kullanım izni, tile/vektör uç noktaları ve cache/redistribution şartları henüz doğrulanmadı.

Uygulama kararı: İBB servislerini doğrudan istemciden çağırmak yerine same-origin proxy ile bağlamak; yalnızca resmi olarak izin verilen veri uç noktalarını kullanmak; API lisansı/şartları açıkça doğrulanmadan veriyi kalıcı olarak projeye gömmemek. Harita önbelleği, mevcut İstanbul offline paket akışından ayrı tutulacak; harita önbelleği tek başına offline gerçek yol rotası veya kesin fiyat üretmeyecek.

Kaynak: [İBB Şehir Haritası](https://sehirharitasiapi.ibb.gov.tr/). Kaynak sayfasında görülen uygulama atfı: İstanbul Büyükşehir Belediyesi ©.
Geliştirici konsolu `https://sehirharitasiapi.ibb.gov.tr/developerconsole/` adresinde “5 Maddede API” sayfasını ve `/v1` dokümantasyon bağlantısını gösteriyor. Teknik destek adresi `cografibilgi@ibb.gov.tr`; sayfa altında İstanbul Büyükşehir Belediyesi, Bilgi İşlem Daire Başkanlığı, Coğrafi Bilgi Sistemi Müdürlüğü atfı yer alıyor. API anahtarı ve veri yeniden dağıtım/çevrimdışı önbellekleme şartları bu giriş sayfasında açıkça belirtilmedi; `/v1` sayfası ayrıca incelenmeli.
Run Kurye canlı önizlemesinde İBB paneli görünüyor: “İstanbul Şehir Haritası”, “İBB haritası canlı”, İBB attribution ve “İBB API bilgileri” bağlantısı mevcut. Panel online modda resmi `https://sehirharitasiapi.ibb.gov.tr/` sayfasını iframe ile açıyor; offline durum için PMTiles fallback ve rota sınırlaması metinle belirtiliyor.
