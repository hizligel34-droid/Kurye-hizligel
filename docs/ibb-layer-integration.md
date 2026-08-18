# İBB Harita Katmanı Entegrasyon Kararı

## Kapsam

Run Kurye yalnızca İstanbul içinde çalışır. Mevcut harita deneyimi iki katmanlıdır: bağlantı varken İBB Şehir Haritası güvenli bir iframe/embed olarak gösterilir; bağlantı yokken veya iframe erişilemez olduğunda cihazda önceden saklanan İstanbul OSM/PMTiles paketi açılır. Bu karar, harita görüntüleme ile gerçek yol rotası hesaplamasını bilinçli olarak ayrı tutar.

## Same-origin proxy değerlendirmesi

İBB harita sayfası ve katman uç noktaları tarayıcıdan doğrudan çağrıldığında CORS, referer/origin kısıtları, dinamik oturum davranışı veya üçüncü taraf iframe güvenlik başlıkları nedeniyle kararlı bir uygulama API'si olarak kabul edilemez. Bu nedenle uygulama, İBB'nin izin verdiği bir veri/API sözleşmesi ve kullanım koşulları doğrulanmadan İBB katmanlarını kopyalayan veya proxy üzerinden yeniden dağıtan bir endpoint üretmez.

Bu kararın teknik sonucu aşağıdaki tabloda özetlenmiştir.

| Durum | Uygulama davranışı | Neden |
|---|---|---|
| İBB embed erişilebilir | İBB haritası iframe içinde gösterilir | İBB'nin kendi arayüzü ve kaynak sunumu korunur |
| İBB embed erişilemez, İstanbul PMTiles hazır | MapLibre/PMTiles önizlemesi açılır | Cihazdaki harita verisi bağlantısız görüntüleme sağlar |
| İBB embed erişilemez, paket yok | Kullanıcıya anlaşılır hata ve indirme/import seçeneği gösterilir | Harita verisi yokken sahte katman veya sahte rota üretilmez |
| Kesin araç rotası/fiyat gerekli | Online Google rota doğrulaması beklenir | PMTiles harita paketi tek başına routing engine değildir |

## Neden gerçek İBB veri proxy'si ertelendi?

Gerçek bir same-origin İBB veri proxy'si ancak izin verilen katman endpoint'leri, kimlik doğrulama modeli, rate limit, atıf şartları, yeniden dağıtım hakkı ve offline cache süresi netleştirildikten sonra uygulanmalıdır. Bu bilgiler doğrulanmadan proxy eklemek hem teknik olarak kırılgan hem de veri kullanım koşullarına aykırı olma riski taşır. Projede bu sınır, `IBBMapEmbed` bileşenindeki kaynak bağlantısı/atıf metni, offline paket durumları ve kesin rota/fiyat kilidi ile kullanıcıya görünür durumdadır.

## Testlenebilir kabul kriterleri

Mevcut test kapsamı online iframe, cached İstanbul paketi hazır, cached paket yok, IndexedDB seed/import ve offline rota sınırlaması durumlarını ayrı ayrı kontrol eder. Kabul edilen davranış, İBB iframe başarısız olduğunda PMTiles fallback'inin açılması; PMTiles yoksa hata durumunun gösterilmesi; offline haritanın gerçek km, süre veya kesin fiyat iddiasında bulunmamasıdır. Gerçek İBB katman proxy'si, resmi veri erişim ve yeniden dağıtım koşulları doğrulanana kadar bilinçli olarak bu kapsamın dışındadır.

> **Sonuç:** Mevcut iframe + İstanbul PMTiles fallback mimarisi, doğrulanmış izinli İBB veri proxy'si bulunana kadar güvenli ve geri alınabilir çözümdür. Gerçek offline routing engine ayrı bir Valhalla tile/native bridge çalışmasıdır; harita görüntüleme paketiyle birleştirilmemelidir.
