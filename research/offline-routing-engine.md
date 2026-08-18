# Offline Routing Engine Araştırması

OSRM, OSM yol verisi üzerinde çalışan yüksek performanslı açık kaynak bir routing engine'dir; HTTP ve Node.js API'leri sunar ancak tarayıcı içine doğrudan gömülen küçük bir istemci motoru değildir. Kaynak: https://project-osrm.org/docs/.

Valhalla MIT lisanslı, OSM verisiyle çalışan açık kaynak bir routing engine'dir. Tiled hiyerarşik veri yapısı; bölgesel extract, düşük bellek aygıtları ve offline routing için tasarlanmıştır. Kaynak: https://valhalla.github.io/valhalla/.

GraphHopper açık kaynak Java routing engine'dir ve resmi dokümantasyonunda mobil cihazlarda tam offline kullanım desteği belirtilmektedir. Ancak WebDev tarayıcı paketine doğrudan Java runtime veya büyük GraphHopper graph verisi gömmek uygun değildir. Kaynak: https://www.graphhopper.com/open-source/.

Run Kurye için teknik karar: şehir bazında offline routing için Valhalla tile extract + küçük bir yerel/native servis katmanı en uygun açık kaynak seçenektir. Mevcut WebDev Autoscale uygulaması 1 vCPU/512 MB sınırında olduğundan büyük Valhalla graph tile üretimi ve kalıcı offline engine tarayıcıya doğrudan eklenmemelidir. İlk uygulama, şehir paketinin indirildiğini, offline route engine durumunu ve online fallback'i açıkça ayırmalı; tam offline gerçek rota için paketleri kullanan persistent/local servis katmanı gerekir. OSM verisi için ODbL atfı korunmalıdır.
