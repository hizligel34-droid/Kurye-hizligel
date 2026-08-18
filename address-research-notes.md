# Adres veri araştırması

- TurkiyeAPI resmi dokümantasyon: https://docs.turkiyeapi.dev/en/
- Mevcut `/api/v1/districts?provinceId=34` yanıtı ilçe nesnelerini ve bazı yanıtlarda gömülü `neighborhoods` dizisini içeriyor.
- Mevcut `/api/v1/neighborhoods?districtId=1103` endpoint'i mahalleleri döndürüyor.
- Tarayıcı ortamında doğrudan `https://turkiyeapi.dev/api/v1` çağrısı AddressPicker için güvenilir olmadı; mobil önizlemede `İstanbul ilçe listesi alınamadı` görüldü.
- Bu nedenle same-origin `/api/address/*` proxy eklendi; proxy upstream erişimini ve geçerli ID parametrelerini sunucu tarafında kontrol ediyor.
- Offline routing araştırması için kaynaklar: Valhalla resmi rota dokümanı https://valhalla.github.io/valhalla/api/route/overview/ ; Valhalla GitHub/Lisans https://github.com/valhalla/valhalla ; GraphHopper https://github.com/graphhopper/graphhopper ; OSRM https://project-osrm.org/.
