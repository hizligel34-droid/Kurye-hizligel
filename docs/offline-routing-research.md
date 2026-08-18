# Offline Routing Engine Research

## Decision status

Run Kurye'nin web tabanlı İstanbul deneyimi için doğrudan tarayıcı içine GraphHopper veya Valhalla gömmek yerine, **mobil uygulamada native/kalıcı servis katmanı ve web'de güvenli online fallback** yaklaşımı korunmalıdır. Şu anki proje gerçek offline harita önbelleğini destekliyor; PMTiles tek başına yol ağı üzerinde rota hesabı yapmaz.

## Valhalla

Valhalla resmi belgeleri, OpenStreetMap verisi kullanan açık kaynak bir routing engine olduğunu ve veriyi tiled hierarchical data structure olarak işlediğini belirtiyor. Belgelerde bölgesel extract ve offline mobile routing senaryoları için tile yaklaşımının kullanılabildiği görülüyor. Bu nedenle İstanbul'a özel offline routing için teknik olarak daha uygun adaydır; ancak mobil dağıtım için Valhalla tile üretimi, paket boyutu, native bağlama ve sürüm/harita güncelleme pipeline'ı gerekir.

Kaynak: [Valhalla Docs](https://valhalla.github.io/valhalla/)

## GraphHopper

GraphHopper açık kaynak, Apache-2.0 lisanslı bir Java routing engine ve standalone web server olarak çalışır. Resmi belgeleri OSM verisiyle server/API kullanımını, Java runtime ve bölgesel `.osm.pbf` import sürecini açıklıyor. Resmi Directions API ise ticari, API key ve kredi tabanlıdır; bu nedenle ücretsiz ve kalıcı tarayıcı içi offline seçenek olarak doğrudan uygun değildir. Mobil navigasyon için MapLibre Navigation SDK ile birlikte kullanım öneriliyor, fakat GraphHopper'ın kendisini web bundle içine almak yerine native/servis katmanında çalıştırmak gerekir.

Kaynaklar: [GraphHopper Docs](https://docs.graphhopper.com/) ve [GraphHopper GitHub](https://github.com/graphhopper/graphhopper)

## Run Kurye için sonuç

İstanbul-only kapsamda sonraki teknik paket, **Valhalla adapter sözleşmesi** olmalıdır: `routeOffline` yalnızca cihazda doğrulanmış İstanbul Valhalla tile seti varsa çalışmalı; tile yoksa veya koordinat İstanbul dışındaysa kesin km/fiyat üretmemeli ve mevcut Google online route fallback'ine dönmelidir. Web uygulamasına büyük tile seti gömmek yerine, Android/iOS paket indirme ve native servis entegrasyonu ayrı bir mobil faz olarak planlanmalıdır. Bu karar, mevcut güvenli fiyat kilidini ve OSM/ODbL atıf yükümlülüğünü korur.
