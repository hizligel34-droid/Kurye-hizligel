# Project TODO

- [x] Run Kurye ana sayfası: marka, hizmetler, hızlı sipariş CTA'sı ve öne çıkan özellikler
- [x] Sipariş oluşturma: alma adresi, teslimat adresi, ürün ve iletişim detayları
- [x] Sabit ücretlendirme: 600 TL açılış, ilk 5 km dahil, 5 km sonrası km başına 100 TL
- [x] Sipariş oluşturma ekranında km ve toplam fiyatın otomatik hesaplanması
- [x] Sipariş numarasıyla takip: Alındı, Yolda, Teslim Edildi aşamaları
- [x] Müşteri ile operatör/kurye arasında canlı destek sohbet arayüzü
- [x] Kullanıcı kaydı, giriş, profil ve geçmiş siparişler
- [x] Kurye/admin paneli: sipariş listesi, durum güncelleme, mesaj yönetimi ve kurye atama
- [x] Muhasebe: sipariş başına sabit %20 işyeri komisyonu, kurye kazancı ve firma geliri ayrıştırma
- [x] Ödeme geçmişi ve muhasebe raporlama ekranı
- [x] Sipariş durumu değişikliklerinde müşteri bildirim akışı
- [x] AI sohbet botu: sipariş durumu, fiyat tahmini ve teslimat süresi sorularına yanıt
- [x] Mobil öncelikli, hızlı ve dokunmatik uyumlu tasarım
- [x] Backend şeması, sorgu yardımcıları, tRPC prosedürleri ve güvenli rol kontrolleri
- [x] Vitest testleri: ücret hesaplama, %20 komisyon ve sipariş durum geçişleri
- [x] Oluşturucu AI doğrulaması: tüm ana akışların çalıştığını kontrol etme
- [x] Denetleyici AI doğrulaması: tip, build, test, tarayıcı ve mobil görünüm denetimi
- [x] Tamamlanan özellikleri işaretleme ve tek teslim checkpoint'i oluşturma
- [x] Denetleyici bulgusu: takip yanıtında adres ve telefon gibi kişisel verileri koruma
- [x] Denetleyici bulgusu: sohbet erişiminde sipariş sahipliği ve kurye ataması kontrolü
- [x] Denetleyici bulgusu: kurye durum güncellemesini yalnızca atanmış siparişlerle sınırlama
- [x] Gerçek müşteri-operatör/kurye sohbet ekranı: mesaj listesi, gönderme ve yenileme/polling
- [x] Kullanıcı hesabı: profil yönetimi ve müşteri sipariş geçmişi ekranları
- [x] Admin/kurye paneli: kurye atama ve mesaj yönetimi arayüzleri
- [x] Ödeme geçmişi kayıtları ve detaylı muhasebe raporlama ekranı
- [x] Müşteri tarafında görünür bildirim merkezi
- [x] Sipariş durum geçişleri için Vitest testleri
- [x] Profil düzenleme formu ve kaydetme akışını kullanıcı hesabına ekle
- [x] Admin/kurye panelinde kurye atama kontrolü ve sipariş bazlı mesaj yönetimi ekle
- [x] Muhasebe ekranında ödeme geçmişi ve detay kırılımı görünümü ekle
- [x] Profil formunda sahte telefon varsayılanını kaldır ve başarılı kayıt sonrası kullanıcı verisini yenile
- [x] Admin/kurye paneline sipariş seçerek mesaj görüntüleme ve yanıtlama arayüzü ekle
- [x] Muhasebe geçmişinde satır bazında toplam ödeme, %20 komisyon, kurye kazancı ve firma geliri kolonlarını göster
- [x] Canlı destek mesajlarında müşteri dilini algıla ve operasyon ekranında Türkçe çeviri göster
- [x] Türkçe operatör yanıtını müşterinin mesaj diline otomatik çevirerek müşteriye göster
- [x] İngilizce, Almanca, Rusça, Arapça, Çince ve Yunanca dahil çok dilli çeviri fallback akışını ekle
- [x] Çok dilli çeviri için güvenli backend prosedürü, testler ve build doğrulaması
- [x] messages.detectedLanguage migration'ını doğrula ve gerekirse veritabanına uygula
- [x] Desteklenmeyen diller için güvenli çeviri fallback'i ekle
- [x] Çeviri yardımcıları, hedef dil seçimi ve fallback için Vitest testleri ekle
- [x] Çeviri mesaj akışını migration sonrası DB ile yeniden doğrula
- [x] Müşteri dili → operatör yanıt dili seçim helper'ı için özel Vitest testi ekle
- [x] Çevrilmiş mesaj payload'ının detectedLanguage ve translatedContent alanlarını koruduğunu test et
- [x] Migration sonrası mesaj yazma/okuma alan uyumunu prosedür seviyesinde yeniden doğrula
- [x] chat.send ve chat.messages tRPC zincirinin detectedLanguage ve translatedContent alanlarını koruduğunu prosedür testiyle doğrula
- [x] chat.send testinde yazılan payload'ı yakala ve chat.messages dönüşünü aynı fake store üzerinden doğrula
- [x] Profil kaydı sonrası hesap ekranındaki görünen kullanıcı verilerini auth sorgusundan garantiyle yenile
- [x] Profil güncelleme akışının güncel ad ve telefon bilgisini yansıttığını test et
- [x] Profil güncelleme tRPC prosedürünün güncel ad ve telefon değerlerini döndürdüğünü test et
- [x] Kuş uçuşu mesafe hesabını kaldırıp il-ilçe-mahalle-sokak/konum tabanlı rota hesabını tanımla
- [x] Türkiye'nin tüm il, ilçe ve mahallelerini adres seçim akışına ekle
- [x] Alış ve teslim adreslerinde il, ilçe, mahalle, sokak ve açık adres alanlarını kullan
- [x] Rota mesafesi ve ücret hesaplamasını sipariş oluşturma backend'ine bağla
- [x] Mobil sipariş formunda hiyerarşik adres seçimi ve yeni fiyat özetini göster
- [x] Türkiye adres kapsamı, rota ücretleri ve sabit %20 komisyon için testleri ekle
- [x] Ücretlendirmede kuş uçuşu mesafe yerine gerçek araç yol rotası kilometresi kullan
- [x] Adres koordinatlarını geocoding ile rota servisine gönder ve gerçek yol km/süre bilgisini al
- [x] Fiyat özetinde rota km'sini, tahmini süreyi ve 600 TL + km başı 100 TL hesabını açıkça göster
- [x] Rota servisi başarısız olduğunda tahmini fiyatı kesin fiyat gibi göstermeyen güvenli fallback ekle
- [x] Gerçek yol rotası ücret formülü ve fallback davranışı için testler yaz
- [x] Çevrim dışı Türkiye haritası için lisanslı veri kaynağını ve dağıtım yöntemini belirle
- [x] Harita kutucuklarını/vektör verisini indirme ve önbellekleme akışını tasarla
- [x] Çevrim dışı gerçek yol rotası için uygun kontrollü fallback seç: offline paket harita önbelleği, gerçek km/süre ve kesin fiyat online rota doğrulamasına bağlı
- [x] Çevrim dışı mod göstergesi ve internet yokken güvenli fiyat davranışı ekle
- [x] Harita lisansı, veri boyutu ve mobil tarayıcı performansını doğrula
- [x] İstanbul offline harita/rota paketini seçilebilir indirme olarak tanımla
- [x] Ankara offline paketini hazırlanıyor durumu ve ücretsiz BBBike extract kaynağıyla açıkça tanımla; doğrulanmamış doğrudan indirme URL'si kullanma
- [x] Şehir paketi indirme ilerlemesi, boyutu ve cihazda hazır durumu göster
- [x] IndexedDB/Service Worker önbelleğiyle indirilen paketleri offline kullanılabilir yap
- [x] Paket içi offline rota motoru bulunmadığını güvenli şekilde belirt; paket dışı ve offline rotalarda online rota fallback'i ve kesin fiyat kilidi uygula
- [x] Offline modda rota doğrulanmadan kesin ücret ve sipariş onayı verme
- [x] Şehir paketleri için test, lisans bildirimi ve performans denetimi ekle
- [x] Ücretsiz OpenStreetMap kaynaklarından İstanbul paket URL ve checksum metadata'sı tanımla
- [x] Ankara için doğrulanmış ücretsiz doğrudan şehir paketi bulunmadığını belgeleyip BBBike extract kaynağını metadata olarak tanımla
- [x] Paketlerde OpenStreetMap/ODbL atıf ve kaynak bağlantısını görünür göster
- [x] Büyük dosyaları projeye gömmek yerine güvenli harici indirme ve IndexedDB önbelleği kullan
- [x] Offline harita ile online rota servisinin kapsamını kullanıcıya açıkça ayır
- [x] İndirilen offline paketleri IndexedDB'den okuyup cached paket erişimi ve offline harita önbelleği olarak sun
- [x] İstanbul paket manifestine doğrulanmış checksum metadata'sı ekle ve checksum bilgisini kullanıcıya göster
- [x] Offline indirme boyutu, hata durumu ve mobil performans için görünür uyarı ve mobil doğrulama ekle
- [x] İstanbul offline paket kartında checksum algoritmasını ve doğrulanmış değerini kullanıcıya görünür göster
- [x] AddressPicker select state'ini id tabanlı düzelt; Türkiye API için loading/error/empty state ekle
- [x] Açık adres detayını backend payload ve kayıt modelinde ayrı alan olarak taşı ve test et
- [x] Türkiye adres akışı ve rota/komisyon entegrasyonu için test kapsamını genişlet
- [x] Rota fallback davranışı için ortak sipariş onay testi ekle
- [x] Offline şehir paketleri için indirme performansı ve boyut davranışı testi ekle
- [x] Açık adres detail alanları için orders.create/DB helper write-read testi ekle
- [x] Türkiye adres seçimi, rota fiyatı ve %20 komisyon entegrasyonunu doğrulayan kapsamlı test ekle
- [x] Offline paket indirme progress, boyut ve hata akışını testle
- [x] orders.create veya ilgili DB write/read zincirinde pickupAddressDetail ve deliveryAddressDetail alanlarını doğrula
- [x] Türkiye adres seçimi, routeEstimate ve %20 komisyonu aynı prosedür senaryosunda doğrula
- [x] offlinePackages download akışında progress, fetch hatası ve oversize response mock testlerini ekle
- [x] orders.create sonrası pickupAddressDetail ve deliveryAddressDetail alanlarını get/read-back yolu ile doğrula
- [x] pricing.estimate ile Türkiye adres girdileri, gerçek rota km'si ve %20 komisyonu aynı senaryoda doğrula
- [x] orders.create sonrası gerçek orders.mine read-back yolunu mock bypass etmeden doğrula
- [x] pickupAddressDetail ve deliveryAddressDetail kolon migration uyumsuzluğunu gider
- [x] Gerçek DB transaction rollback içinde geçici orders kaydını oluşturup pickup/delivery detail alanlarını mock'suz read-back doğrula
- [x] Ücretsiz offline routing engine seçimini ve lisansını doğrula
- [x] İstanbul-only kapsam için Valhalla tile/native adapter paket formatını belirle; Ankara kapsam dışı bırakıldı
- [x] Yerel servis katmanında Valhalla offline route adapter modülünü entegre et; gerçek tile servisi ayrı deployment işidir
- [x] Yapılandırılmış Valhalla provider çıktısından doğrulanmış gerçek km, süre ve 600 TL + km bazlı fiyatı üret; provider yoksa Google fallback kullan
- [x] İnternet yokken rota doğrulama, paket dışı koordinat ve hata durumlarını güvenli yönet
- [x] Valhalla provider için rota doğruluğu, süre, fiyat, health/stale ve mobil offline sınır testlerini ekle; gerçek tile/native pipeline ayrı deployment işidir
- [x] İsteğe bağlı VALHALLA_BASE_URL ve VALHALLA_TILE_EXPIRES_AT yapılandırması ile health-check/stale korumasını ekle
- [x] İstanbul Valhalla tile verilerinin sunucu depolama/yenileme stratejisini tanımla; Ankara kapsam dışı bırakıldı
- [x] Backend'de Valhalla route adaptörü ve online Google fallback önceliğini yapılandır
- [x] Valhalla route km/süre çıktısını mevcut 600 TL + km başı 100 TL ve %20 komisyon akışına bağla
- [x] Kalıcı servis erişilemezliği, İstanbul dışı koordinat ve stale tile durumlarını güvenli yönet
- [x] Valhalla bağlantısı, route doğruluğu, süre, fiyat ve health-check testlerini ekle
- [x] Ücretsiz OpenStreetMap şehir haritası paketlerinin indirilebilir manifestini doğrula
- [x] Harita paketini IndexedDB/Service Worker ile cihazda sakla ve internet yokken aç
- [x] Harita görüntüleme için offline paket okuyucu/harita katmanını bağla
- [x] OpenStreetMap/ODbL attribution ve veri kaynağı bağlantısını göster
- [x] Offline harita ile offline gerçek rota motorunun ayrı kapsamını kullanıcıya açıkça göster
- [x] Harita paketinin indirme, önbellek, offline açılış ve mobil performans testlerini ekle
- [x] Adres seçiminde yalnızca İstanbul ilini sabitle
- [x] İstanbul ilçe ve mahalle listesini kullan; diğer illeri gizle
- [x] İstanbul cadde/sokak alanını ve açık adres girişini ekle
- [x] Offline paket manifestinden Ankara ve diğer şehirleri kaldır
- [x] İstanbul-only adres, rota, ücret ve mobil form testlerini güncelle
- [x] İstanbul-only adres akışı için il sabitliği, başka il seçilememe ve ilçe/mahalle yüklenmesi testi ekle
- [x] Offline paket manifestinin yalnızca İstanbul içerdiğini doğrulayan birim test ekle
- [x] Mobil sipariş formunda İstanbul-only adres payload ve rota/fiyat akışını doğrulayan test ekle
- [x] İstanbul-only AddressPicker için il sabitliği, başka il seçilememe, ilçe ve mahalle yüklenmesini gerçek yardımcı akışıyla test et
- [x] Mobil sipariş formu/orders.create/pricing.estimate zincirinde İstanbul-only adres payload'ını ve rota-fiyat akışını entegrasyon testiyle doğrula
- [x] AddressPicker bileşenini render ederek İstanbul il alanının devre dışı ve tek seçenek olduğunu doğrula
- [x] AddressPicker çıktı akışını ve doğrulanmış rota/fiyat zincirini tRPC entegrasyon testiyle doğrula
- [x] Offline şehir paketi bölümündeki Ankara metnini İstanbul-only kapsamına göre düzelt
- [x] İlçe, mahalle ve cadde alanlarının görünmemesi sorununu AddressPicker veri ve arayüz akışında düzelt
- [x] İlçe/mahalle/cadde görünürlüğü için test, build ve mobil görünüm doğrulaması yap
- [x] Mobil viewport'ta sipariş formunu açıp AddressPicker'da ilçe, mahalle ve cadde alanlarının göründüğünü tarayıcı/screenshot ile doğrula
- [x] AddressPicker düzeltmesi için ilçe yüklemesi doğrudan çalışırken mahalle fallback'ini kapsayan özel test ekle
- [x] Mobil viewport'ta sipariş formuna doğrudan geçiş sağlayıp AddressPicker alanlarını gerçek ekran üzerinde doğrula
- [x] TürkiyeAPI CORS/erişim sorununu same-origin sunucu adres proxy'siyle gider ve AddressPicker'ı proxy üzerinden yükle
- [x] İBB Şehir Haritası API uç noktalarını, teknik erişim modelini ve kullanım/lisans koşullarını doğrula
- [x] İBB iframe/embed için güvenli kaynak/katman yapılandırması ekle; gerçek same-origin İBB veri proxy'si sonraki değerlendirmede
- [x] Kullanıcı talebiyle İBB İstanbul canlı harita katmanı entegrasyonunu iptal et; İstanbul offline PMTiles akışını koru
- [x] İBB harita kaynağı, attribution, offline açılış, mobil görünüm ve rota/fiyat sınırlarını test et
- [x] İBB Şehir Haritası iframe gömmesini online modda ekle ve offline modda mevcut İstanbul PMTiles paketine güvenli fallback göster
- [x] İBB harita atfı, API kaynak bağlantısı ve offline rota sınırlamasını arayüzde açıkça belirt
- [x] İndirilen İstanbul PMTiles paketini okuyup offline modda gerçek harita katmanı/önizlemesi gösteren bir bileşen bağla
- [x] IBB iframe erişilemediğinde cached paket ile harita açılış akışını ve kullanıcı durumlarını test et
- [x] IBBMapEmbed offline ready/not-ready/error durumlarını saf durum yardımcısı ve Vitest testleriyle kapsa
- [x] Tarayıcıda bağlantı kesildiğinde cached paket yok durumu ve PMTiles fallback açılış durumunu doğrula
- [x] Tarayıcıda IndexedDB'ye hazır İstanbul PMTiles paketini seed ederek offline modda gerçek PMTiles haritasının açıldığını doğrula
- [x] Cached paket yok ve cached paket hazır offline senaryolarını ayrı ayrı doğrula
- [x] BBBike İstanbul PMTiles indirmesini same-origin proxy üzerinden tarayıcıya açarak gerçek cached paket seed doğrulamasını mümkün kıl
- [x] İstanbul ZIP/PMTiles paketini dosya seçiciyle IndexedDB'ye içe aktarma seçeneği ekle ve gerçek PMTiles seed doğrulamasını tamamla
- [x] Offline manifest testini same-origin İstanbul proxy URL'sini doğrulayacak şekilde güncelle
- [x] ZIP/PMTiles dosya içe aktarma akışını tarayıcıda gerçekten doğrula: dosyayı seç, IndexedDB kaydını kontrol et ve offline PMTiles haritasının açıldığını kanıtla
- [x] ZIP/PMTiles import akışı için IndexedDB write/read ve ready state testini ekle
- [x] Mevcut boş/eksik IndexedDB veritabanlarını version migration ile düzelt ve içe aktarma akışını tekrar doğrula
- [x] İBB için gerçek veri/katman same-origin proxy gereksinimini ayrıca değerlendir; mevcut entegrasyon iframe/embed ve offline OSM PMTiles fallback olarak belgelenmiştir
- [x] TRPCProvider React hook çakışması sürerse React 18.3 uyumluluk seçeneğini izole bir denemeyle doğrula; başarılı olmazsa geri dön
- [x] TRPCProvider ile React başlangıç runtime'ını minimal giriş akışında izole et ve boş ekranın kaynağını kesinleştir
- [x] İzolasyon sonucuna göre React/tRPC provider başlatma akışını düzelt ve mobil preview'da render doğrula
- [x] Runtime düzeltmesi sonrası İstanbul adres/cadde akışını ve mobil görünümü yeniden doğrula
- [x] TRPCProvider/useState null hatasının kalıcı nedenini kodda gider; final main.tsx/Vite yapılandırmasında tekil ve doğrulanmış çözümü bırak
- [x] Kalıcı runtime fix sonrası Home ve order mobil preview'da tarayıcı konsolunun hatasız olduğunu kanıtla
- [x] Runtime fix sonrası İstanbul ilçe/mahalle/cadde akışını mobilde yeniden doğrula ve mümkünse bunu test/kanıtla destekle
- [x] Valhalla'yı İstanbul offline routing için öncelikli açık kaynak aday olarak seç ve GraphHopper/servis sınırlamalarını belgeleyerek araştırma notu oluştur
- [x] İstanbul offline routing paketinin Valhalla tile seti ve native Android/iOS adapter sözleşmesiyle çalışacağını tanımla
- [x] Hazır olmayan veya doğrulanmamış offline engine'in kesin rota/fiyat üretmesini engelleyen shared route adapter ekle
- [x] Offline route adapterı için hazır, İstanbul-only, malformed response ve engine error Vitest senaryolarını ekle
- [x] Gerçek Valhalla tile üretim/dağıtım pipeline'ı ve Android/iOS native bridge gereksinimini docs/valhalla-deployment.md içinde uygulanabilir dış deployment bağımlılığı olarak belgeledim; bu web autoscale projesinde sahte tile/native kodu üretilmedi
- [x] Landing hero kartındaki 600 TL tahmini ücretini ve footer'daki ücret formülü metnini kaldır; fiyat bilgisi yalnızca sipariş akışında kalsın
- [x] İBB gerçek veri/katman entegrasyonu için same-origin proxy gereksinimini yazılı olarak belgeleyip iframe + PMTiles fallback kararını teknik gerekçeyle kaydet
- [x] İBB proxy ertelenme kararını testlenebilir kapsam ve kullanıcıya açık kaynak/attribution sınırıyla ilişkilendir
- [x] Backend Valhalla HTTP provider'ını Valhalla trip özetinden verified route formatına dönüştür
- [x] Valhalla provider için service URL yokluğu, başarılı JSON ve güvenli null fallback testlerini ekle
- [x] Valhalla provider health-check yardımcı fonksiyonunu ve sağlıklı/erişilemez servis testlerini ekle
- [x] Sipariş ekranında offline haritanın gerçek offline routing motoru olmadığını ve kesin km/fiyat için online doğrulama gerektiğini görünür durum kartıyla göster
- [x] Kullanıcının işaret ettiği resmi İstanbul harita/adres kaynağının erişilebilir ilçe, mahalle ve cadde-sokak uç noktalarını doğrula
- [x] İBB resmi adres provider'ını kullanıcı talebiyle kullanımdan kaldır; mevcut same-origin İstanbul adres proxy/fallback sözleşmesini koru
- [x] İBB provider kaldırma sonrası mevcut adres kaynağı erişilemezliği, eksik mahalle/cadde ve İstanbul dışı veriyi fallback ve güvenli hata durumlarıyla yönet
- [x] İBB resmi kaynak akışı kaldırıldığı için mobil sipariş formu ve orders.create mevcut İstanbul proxy/fallback akışıyla test edildi
- [x] Müşteri rolü için giriş, sipariş oluşturma, adres seçimi, fiyat, takip, sohbet, bildirim ve geçmiş akışlarını uçtan uca denetle
- [x] Kurye rolü için atanmış sipariş, durum güncelleme, müşteri sohbeti, bildirim ve kazanç görünümünü uçtan uca denetle
- [x] Admin/operasyon rolü için sipariş listesi, kurye atama, durum, sohbet, muhasebe ve rol yetkilerini uçtan uca denetle
- [x] Ücretlendirme, komisyon, rota doğrulama ve İstanbul adres payload'larını rol akışlarıyla birlikte tekrar doğrula
- [x] Tüm rol ve temel iş akışlarının test, TypeScript, build ve mobil preview sonuçlarını kaydet
- [x] pricing.estimate ve orders.create prosedürlerinde İstanbul dışı ilçe/mahalle/adres payload'larını server-side reddet
- [x] Kurye orders.mine/listOrders sorgusunu yalnızca atanmış siparişlerle sınırla; admin/accountant görünümünü koru
- [x] İstanbul server-side doğrulama ve kurye sipariş izolasyonu için procedure-level Vitest testleri ekle
- [x] orders.create şemasında İstanbul ilçe, mahalle ve cadde/sokak alanlarını zorunlu doğrula; yalnızca serbest metinle sipariş açılmasını engelle
- [x] Zorunlu adres hiyerarşisi değişikliğini mevcut müşteri sipariş, fiyat ve İstanbul kapsam testleriyle doğrula
- [x] Müşteri, kurye ve admin order erişim yetkisini saf helper üzerinden test et; kurye yalnız atanmış order'ı, admin tüm order'ları görsün
- [x] İBB iframe, harita başlıkları, kaynak bağlantıları ve İBB’ye özgü frontend kullanımını kaldır
- [x] İBB’ye özel backend/provider ve dokümantasyon referanslarını kaldır veya kaldırılmış kapsam olarak güncelle
- [x] İstanbul offline PMTiles haritasını İBB fallback olmadan çalışır varsayılan akış yap
- [x] İBB kaldırma sonrası adres proxy’si, online rota/fiyat, offline harita ve mobil görünümü yeniden doğrula
- [x] Sipariş, takip, sohbet, operasyon ve hesap bölümleri için doğrudan mobil URL deep-link rotalarını 404 vermeden Home section'larına bağla
- [x] Deep-link rotalarını mobil tarayıcıda /order ve /track ile görsel olarak doğrula
- [x] Pasted_content.txt dosyasını sınıflandır: yalnızca 7 bölge sınırı GeoJSON'u, İstanbul ilçe/mahalle/cadde adres verisi değil
- [x] Bölge sınırı GeoJSON'unu AddressPicker'a bağlamama ve mevcut İstanbul adres proxy/fallback mimarisini koruma kararını kaydet
- [x] İstanbul adres proxy'sinde cadde/sokak önerisi, fallback ve kaynak erişilememe durumlarını yeniden denetle
- [x] Mobil sipariş onayındaki backend validation hatasının gerçek hata mesajını log ve network payload'ından belirle
- [x] orders.create input ile Home submit payload uyumsuzluğunu düzelt
- [x] Mobil rota doğrulaması sonrası sipariş onayını başarı ve hata senaryolarıyla test et
 - [x] Mobil ilçe seçimi sırasında görünen 1 error uyarısının gerçek hata kaynağını browserConsole/network ve proxy loglarından belirle
 - [x] İlçe seçiminden sonra mahalle ve cadde state/endpoint senkronizasyonunu düzelt; iki AddressPicker'ın birbirini etkilemesini engelle
 - [x] İlçe, mahalle ve cadde seçiminin pickup/delivery payload'ına doğru yazıldığını mobil etkileşim ve procedure testiyle doğrula
 - [x] Adres akışında kullanıcıya görünen generic error yerine anlamlı yükleme/hata/boş durum mesajlarını göster
- [x] Run Kurye logosunu header, mobil üst alan ve giriş/ana marka alanlarında görünür hale getir
- [x] Logo için erişilebilir alt metin, responsive boyut ve mevcut marka renkleriyle tutarlı görünüm sağla
- [x] Masaüstü ve mobil viewport'ta logo görünümünü test et
 - [x] Pricing query'yi yalnızca pickup ve delivery adreslerinin ilçe-mahalle-cadde/sokak-açık adres hiyerarşisi tamamlandığında çalıştır; “İstanbul” gibi eksik adresleri sorgulama
 - [x] Rota sorgusu eksik adres nedeniyle çalışmadığında generic API error yerine form içi yönlendirme göster
- [x] Müşteri, kurye, firma/muhasebe ve admin üyelik deneyimini ortak güvenli oturum akışıyla netleştir
- [x] Her rolün yalnızca kendi muhasebe kayıtlarını ve yetkili özetlerini görebileceği veri/procedure modelini tasarla
- [x] Müşteri için Banabi/Getir benzeri hızlı sipariş, aktif sipariş ve geçmiş sipariş akışını geliştir
- [x] Kurye için uygun işler, teslimat kazancı, komisyon ve ödeme geçmişi panelini geliştir
- [x] Firma/muhasebe için sipariş, %20 komisyon, kurye kazancı ve tahsilat raporlarını rol bazlı göster
- [x] Üyelik, muhasebe erişimi ve yeni mobil akışlar için Vitest ve mobil görsel denetim ekle
- [x] Kurye tamamlanan teslimat sayısı, puan ve rozet seviyeleri için ortak hesaplama sözleşmesini tanımla
- [x] Kurye profiline güvenli tamamlanan teslimat özeti, puan ve rozet prosedürünü ekle
- [x] Kurye panelinde rozet, puan ve bir sonraki seviyeye ilerleme görünümünü ekle
- [x] Kurye başarı sistemi için Vitest, TypeScript, build ve mobil görsel doğrulaması yap
- [x] Gerçek teslimat puanlarına dayalı kurye leaderboard hesaplama sözleşmesini tanımla
- [x] Rol kontrollü leaderboard tRPC prosedürünü ve güvenli kurye özetlerini ekle
- [x] Mobil liderlik tablosu, kişisel sıra ve puan görünümünü kurye paneline ekle
- [x] Leaderboard için Vitest, TypeScript, build ve mobil görsel doğrulaması yap
- [x] Run Kurye için İstanbul içi bağımsız kurye hizmet sözleşmesi metnini ve alanlarını uyarlama
- [x] Kurye sözleşmesi kabul kaydı için veri modeli ve rol kontrollü backend akışı ekleme
- [x] Kurye profil/üyelik ekranında sözleşme görüntüleme ve onay kutusu akışını ekleme
- [x] Sözleşme akışı için hukuki uyarı, Vitest, TypeScript, build ve mobil doğrulaması yapma
- [x] Kimlik, ehliyet ve araç ruhsatı belge türleri için güvenli metadata ve doğrulama sözleşmesini tanımla
- [x] Kurye belgeleri için dosya depolama, erişim ve inceleme durumlarını rol kontrollü backend’e ekle
- [x] Kurye belge yükleme ve admin inceleme ekranlarını mobil uyumlu geliştir
- [x] Belge akışı için güvenlik, Vitest, TypeScript, build ve mobil görsel doğrulaması yap
- [x] Mobil OAuth callback akışında invalid oauth state hatasını ve oturum cookie uyumunu düzelt
- [x] OAuth hata durumunda kullanıcıya güvenli ve anlaşılır yeniden giriş yönlendirmesi göster
- [x] OAuth mobil giriş, belge erişimi ve belge yükleme akışlarını yeniden test et
- [x] Ödeme/e-fatura webhook mimarisi ve idempotent event sözleşmelerini beceriye ekle
- [x] Kurye ve müşteri panelleri için temel wireframe/UI akış dokümanını beceriye ekle
- [x] Lojistik platformu yatırımcı sunumu içeriğini varsayımları açıkça belirterek hazırla
- [x] Yatırımcı sunumunu slayt dosyası olarak üret, görsel doğrula ve teslim et
- [x] Skill’e finansal öngörü, gelir modeli ve çalışan panel doğrulama rehberlerini ekle
- [x] Kurye ve müşteri wireframe’lerini Run Kurye’de çalışan etkileşimli panellere dönüştür
- [x] Müşteri paneline gerçek sipariş durumu takip çubuğu ve bildirim alanı ekle
- [x] Finansal öngörü ve gelir modelini yatırımcı sunumuna yeni slaytlarla ekle
- [x] Yeni akışları test et, mobil doğrula, skill’i validate et ve checkpoint oluştur
- [x] Türkçe, İngilizce, Arapça, Rusça, Yunanca, İtalyanca, Almanca ve Fransızca dil kataloğunu tanımla
- [x] Mobil header’da erişilebilir dil seçici ve kalıcı kullanıcı tercihi ekle
- [x] Müşteri, kurye ve sohbet ekranlarında seçilen dil metinlerini bağla
- [x] Çok dilli arayüz için test, TypeScript, build ve mobil görsel doğrulaması yap
- [x] Sıralı tamamlamada finansal skill ve öngörü maddelerini kapat
- [x] Sıralı tamamlamada çalışan kurye/müşteri paneli maddelerini kapat
- [x] Sıralı tamamlamada takip, bildirim, dil ve hata akışlarını doğrula
- [x] Sıralı tamamlamada yatırımcı sunumu, tam test, skill validation ve checkpoint’i kapat
- [x] Müşteri paneline canlı sipariş durum animasyonları ve durum bildirimleri ekle
- [x] Gerçek ödeme almayan sandbox kredi kartı test formu ve ödeme sonucu akışını ekle
- [x] Kurye geçmiş sipariş ve kazanç raporlarını filtreleme/sıralama arayüzüyle ekle
- [x] Üç yeni akışı güvenlik, Vitest, TypeScript, build ve mobil görsel denetiminden geçir


## Current feature expansion
- [x] Canlı takipte hareket/ilerleme animasyonu ve rota meta bilgilerini görünür kıl
- [x] Sipariş akışına gerçek tahsilat yapmayan sandbox kredi kartı formu bağla
- [x] Kurye paneline tarih/durum aralığı, sıralama ve özet metriklerle detaylı rapor ekle
- [x] Investor deck finansal model slaytlarını final varsayımlar ve kaynak notlarıyla güncelle
- [x] Çok dilli akış, sandbox ödeme ve canlı takip için uçtan uca regresyon denetimi
- [x] Yeni özellikler için Vitest testleri ve production build doğrulaması
- [x] Yeni sürümü checkpoint olarak kaydet ve yayınlanan sürümü kullanıcıya ilet


## Real-time courier location
- [x] SSE veya WebSocket tabanlı kurye konum yayın kanalını ekle
- [x] Konum akışını yalnızca sipariş sahibi ve yetkili operasyon rollerine aç
- [x] Müşteri canlı takip haritasında kurye işaretçisini akıcı güncelle ve bağlantı durumunu göster
- [x] Kurye konum gönderimi, bağlantı kopması ve yetkisiz erişim için Vitest testleri ekle
- [x] Gerçek zamanlı takip akışını TypeScript, build ve mobil görsel denetiminden geçir
- [x] Yeni gerçek zamanlı takip sürümünü checkpoint olarak kaydet


## Courier recenter control
- [x] Offline haritada “Kuryeyi Bul” butonu ve son konuma yeniden merkezleme ekle
- [x] Kullanıcı haritada gezinirken otomatik merkezlemeyi durdur, butonla yeniden etkinleştir
- [x] Canlı kurye hareketinde takip modunu ve erişilebilir bağlantı durumunu göster
- [x] Kuryeyi Bul davranışı için test, TypeScript, build ve mobil görsel doğrulama yap
- [x] Yeni harita kontrolü sürümünü checkpoint olarak kaydet


## Courier speed and ETA panel
- [x] Canlı konum verisinden anlık hızı km/sa biçiminde göster
- [x] Mevcut doğrulanmış rota süresinden ETA bilgisini üret ve harita panelinde göster
- [x] Konum veya rota verisi eksik olduğunda güvenli bekleme durumunu göster
- [x] Hız/ETA panelini mobil uyumlu, küçük ve erişilebilir tasarımla doğrula
- [x] Hız ve ETA hesaplamaları için Vitest, TypeScript, build ve görsel denetim yap
- [x] Yeni hız ve ETA paneli sürümünü checkpoint olarak kaydet


## Dynamic traffic ETA
- [x] Kalan mesafeyi kurye konumu ile teslimat konumundan hesapla veya güvenli rota verisiyle güncelle
- [x] Anlık hız ve trafik katsayısını birleştirerek dinamik ETA üret
- [x] Trafik verisi alınamadığında güvenli fallback ve kullanıcı açıklaması göster
- [x] ETA panelinde kalan mesafe, trafik durumu ve son güncelleme zamanını göster
- [x] Dinamik ETA için Vitest, TypeScript, build ve mobil görsel doğrulama yap
- [x] Yeni dinamik ETA sürümünü checkpoint olarak kaydet


## End-to-end demo audit
- [x] Uygulamayı ve canlı sunucuyu çalıştırıp loglarda mevcut hataları tespit et
- [x] Demo müşteriyle İstanbul örnek adreslerini tek tek oluştur ve adres doğrulamasını denetle
- [x] Örnek sipariş oluştur, rota/fiyat/ödeme akışını doğrula ve takip kodunu kaydet
- [x] Demo kurye ile siparişi kabul et, alma/yolda/teslim durumlarını sırayla ilerlet
- [x] Müşteri-kurye uygulama içi mesajlaşmasını iki yönde doğrula
- [x] Demo muhasebe, puan/başarı ve bildirim kayıtlarını doğrula
- [x] Bulunan eksikleri düzelt, regresyon testleri ve production build çalıştır
- [x] Uçtan uca demo tekrarını ve mobil görsel denetimini tamamla
- [x] Demo denetimi sonucunu yayınlanabilir checkpoint olarak kaydet


## Cash on delivery
- [x] Sipariş formuna kapıda nakit ödeme seçeneği ekle
- [x] Sipariş backend’inde ödeme yöntemini ve teslimatta tahsil edilecek durumunu kaydet
- [x] Kart sandbox ve kapıda nakit yöntemlerini rol/muhasebe ekranlarında doğru göster
- [x] Kapıda nakit ödeme için sipariş, teslimat ve muhasebe regresyon testleri ekle
- [x] TypeScript, production build ve mobil görsel denetim yap
- [x] Kapıda nakit ödeme sürümünü checkpoint olarak kaydet


## Quick chat message templates
- [x] Müşteri ve kurye için rol uyumlu hazır mesaj şablonları tanımla
- [x] Şablonlara tıklayarak mevcut sohbet gönderim akışına mesaj gönder
- [x] Şablonları çok dilli ve mobil erişilebilir arayüzde göster
- [x] Hazır mesaj yardımcıları için Vitest, TypeScript, build ve mobil görsel doğrulama yap
- [x] Hazır mesaj sürümünü checkpoint olarak kaydet


## Chat photo sharing
- [x] Mesaj şemasına fotoğraf metadata alanlarını ve migration’ı ekle
- [x] Yetkili müşteri/kurye fotoğraf yükleme prosedürünü ve dosya doğrulamasını ekle
- [x] Sohbet arayüzüne hızlı fotoğraf seçme, önizleme ve gönderme kontrolü ekle
- [x] Fotoğraf erişim güvenliği, MIME/boyut doğrulaması, Vitest, TypeScript, build ve mobil görsel denetimini tamamla
- [x] Fotoğraf sohbet sürümünü checkpoint olarak kaydet


## Chat photo detail preview
- [x] Sohbet fotoğraflarına tıklama ve klavye ile açma davranışı ekle
- [x] Tam ekran fotoğraf detay modalı, kapatma ve erişilebilir etiketler ekle
- [x] Yakınlaştırma/küçültme, sıfırlama ve mobil dokunmatik kullanımını ekle
- [x] Yetkili fotoğraf URL’si ve mevcut sohbet erişim kontrollerini koru
- [x] Fotoğraf önizleme için test, TypeScript, production build ve mobil görsel denetim yap
- [x] Fotoğraf detay önizleme sürümünü checkpoint olarak kaydet


## Project archive delivery
- [x] Run Kurye kaynak kodunu geçici ve üretim dışı klasörleri hariç tutarak ZIP arşivle
- [x] ZIP arşivini doğrula ve kullanıcıya teslim et


## Uploaded secure-delivery archive adaptation
- [x] Yüklenen run-kurye-v5-guvenli-teslimat.zip arşivini güvenli biçimde aç ve dosya envanteri çıkar
- [x] Arşivdeki güvenli teslimat modüllerini mevcut proje ile karşılaştır
- [x] Uyarlanabilir güvenli teslimat özelliklerini Run Kurye’ye entegre et
- [x] Uyarlanan özellikleri güvenlik, test, TypeScript, build ve görsel denetimden geçir
- [x] Uyarlanmış sürümü checkpoint olarak kaydet


## Uploaded secure-delivery archive adaptation
- [x] Yüklenen run-kurye-v5-guvenli-teslimat.zip arşivini güvenli biçimde aç ve dosya envanteri çıkar
- [x] Arşivdeki güvenli teslimat modüllerini mevcut proje ile karşılaştır
- [x] Uyarlanabilir güvenli teslimat özelliklerini Run Kurye’ye entegre et
- [x] Uyarlanan özellikleri güvenlik, test, TypeScript, build ve görsel denetimden geçir
- [x] Uyarlanmış sürümü checkpoint olarak kaydet

- [x] Secure Delivery: arşivdeki OTP, teslim fotoğrafı ve teslim kanıtı alanlarını mevcut sipariş şemasına uyarlama
- [x] Secure Delivery: teslim fotoğrafı yükleme ve OTP doğrulamalı teslim tamamlama prosedürlerini ekleme
- [x] Secure Delivery: müşteri ve kurye demo arayüzünü güvenli teslimat adımlarıyla senkronize etme
- [x] Secure Delivery: OTP/fotoğraf/teslim statüsü regresyon testleri, TypeScript ve production build doğrulaması

- [x] v6 operasyon ZIP kaynağını çıkarıp dosya ve migration farklarını incele
- [x] v6 operasyon akışını mevcut Run Kurye backend ve UI sözleşmelerine uyarlama
- [x] v6 güvenli teslimat ve rol bazlı operasyon akışlarını entegre etme
- [x] v6 entegrasyonu için test, TypeScript, production build ve mobil görünüm doğrulaması

- [x] Ana ekrandaki Fiyat özeti kartını kaldır; sipariş içi fiyat hesaplamasını koru
- [x] Fiyat özeti kaldırma değişikliğini mobil görünüm, test ve build ile doğrula

- [x] v7 adres dizini ZIP’ini çıkarıp dosya ve veri envanterini oluştur
- [x] v7 adres dizini ile mevcut İstanbul-only adres akışı arasındaki farkları incele
- [x] Uyarlanabilir v7 adres dizini özelliklerini adres seçimi ve rota akışına entegre et
- [x] v7 adres dizini için adres, rota/fiyat, test, TypeScript, build ve mobil doğrulama yap

- [x] Alış ve teslim adreslerine daire numarası, kat bilgisi ve kurye özel teslimat notu alanlarını ekle
- [x] Yeni alanları orders şeması, sipariş doğrulaması ve backend kayıt akışına bağla
- [x] Yeni adres alanlarını mobil formda göster ve sipariş özetinde doğru taşı
- [x] Yeni alanlar için migration, test, TypeScript, build ve mobil görsel doğrulaması yap
