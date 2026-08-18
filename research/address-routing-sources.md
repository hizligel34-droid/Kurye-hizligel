# Run Kurye adres ve rota araştırma notları

## Türkiye adres kapsamı

TurkiyeAPI, Türkiye için 81 il ve 973 ilçe ile mahalle/köy idari bölümlerini sağlayan herkese açık bir REST API sunuyor. Kaynak: https://turkiyeapi.dev/ . Ana sayfasındaki örnek meta yanıtında 2025 veri seti ve il/ilçe/mahalle kapsamı belirtiliyor. Kullanım koşulları ve adil kullanım sınırları için https://docs.turkiyeapi.dev/en/v2/guide/terms.html incelenmeli.

Açık kaynak alternatif olarak https://github.com/mhmmdglc/turkey-city-data deposu 2024 Türkiye il, ilçe ve mahalle verisini PostgreSQL tablolarında sunuyor; sokak verisi kapsamı bulunmadığı için doğrudan tam adres çözümü yerine yalnızca idari hiyerarşi için değerlendirilebilir.

TurkiyeAPI'nin https://turkiyeapi.com/ sitesi il, ilçe, mahalle, sokak ve kapı numarası seviyesinde daha geniş adres kapsamı iddia ediyor; ancak API anahtarı ve ticari plan gereksinimi bulunduğundan kullanıcıdan anahtar almadan üretim bağımlılığı yapılmamalı.

## Rota ve geocoding yaklaşımı

Proje şablonundaki yerleşik Google Maps proxy'si `server/_core/map.ts` üzerinden geocoding (`/maps/api/geocode/json`) ve driving directions (`/maps/api/directions/json`) isteklerini otomatik kimlik doğrulamayla destekliyor. Directions yanıtında ilk rotanın ilk ayağındaki `distance.value` metre, `duration.value` saniye olarak alınabilir. Bu yöntem kuş uçuşu hesaplamadan gerçek araç yolu kilometresi ve tahmini süre sağlar.

Kaynak: proje içi `/home/ubuntu/skills/webdev-maps-integration/SKILL.md`; harita proxy endpoint açıklamaları proje içi `/home/ubuntu/run-kurye/server/_core/map.ts` dosyasındadır.

## Uygulama kararı

Sipariş adresleri il, ilçe, mahalle, sokak ve açık adres alanlarının birleşimiyle oluşturulacak; backend bu adresleri geocode edip driving directions ile gerçek yol mesafesini hesaplayacak. Ücret formülü değişmeyecek: ilk 5 km 600 TL, 5 km üzerindeki her gerçek yol kilometresi 100 TL. Rota servisi başarısız olursa kesin fiyat üretilmeyecek; kullanıcıya rota doğrulanamadı uyarısı gösterilecek.

## Ücretsiz şehir paketi kararı (2026-08-18)

BBBike, İstanbul için OSM tabanlı ücretsiz bir PMTiles Shortbread arşivi yayımlıyor: `https://download.bbbike.org/osm/bbbike/Istanbul/Istanbul.osm.pmtiles-shortbread.zip`. Kaynak sayfasında paket boyutu yaklaşık 22 MB olarak listeleniyor ve OpenStreetMap katkıcılarına atıf isteniyor. Bu dosya harita görüntüleme ve önbellekleme için kullanılabilir; tek başına araç rotası motoru değildir.

BBBike üzerinde sabit ve doğrulanmış bir Ankara şehir dizini bulunamadı. Ankara için sahte veya tahmini bir indirme URL’si kullanılmayacak; kullanıcı arayüzünde paket hazırlanıyor durumu gösterilecek. Ankara’nın gerçek offline rota paketi, BBBike özel extract üretimi veya self-hosted lisanslı rota paketi hazır olduğunda manifest’e eklenecek.

Türkiye geneli Geofabrik PBF dosyası yaklaşık 612 MB olduğundan tarayıcıya doğrudan gömülmesi veya her kullanıcıya indirilmesi uygun değildir. OSM/ODbL atfı uygulamada görünür tutulacaktır.
