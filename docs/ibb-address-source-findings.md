# İBB adres kaynağı bulguları

İncelenen resmi kaynaklar:

- https://sehirharitasiapi.ibb.gov.tr/developer/
- https://sehirharitasiapi.ibb.gov.tr/
- https://haritaservis.ibb.gov.tr/vekportal/sharing/rest/portals/info?f=pjson

## Bulgular

İBB geliştirici sayfası, Şehir Haritası'nı iframe ve `map2.js`/`mapAPI.js` JavaScript API'siyle gömmeyi, ayrıca API key oluşturmayı anlatıyor. Belgede ilçe-mahalle-cadde listelerini JSON olarak veren açık, belgelenmiş bir adres endpoint'i görünmüyor.

İBB Şehir Haritası ana sayfasında resmi bir adres arama kutusu bulunuyor ve placeholder'ı `Cad/Sokak, No, Mahalle, İlçe`. Sayfa ayrıca tüm ilçeleri ve harita üzerindeki `Ilce Mahalle Yeni` katmanını gösteriyor. Bu, görsel arama/harita katmanı için kaynak olduğunu doğruluyor; ancak uygulama backend'inde doğrudan kullanılacak stabil hiyerarşik JSON sözleşmesi sağlamıyor.

İBB portal bilgi endpoint'i token tabanlı güvenlik kullanıyor: `https://haritaservis.ibb.gov.tr/vekportal/sharing/rest/portals/info?f=pjson` yanıtında `generateToken` servisi bulunuyor. Bu nedenle token/API key olmadan gizli servis uç noktalarını tahmin ederek çağırmak güvenli veya sürdürülebilir değil.

## Uygulama kararı

Run Kurye'nin kullanıcı adres seçimi same-origin `/api/address` proxy'si ve İstanbul fallback'i ile çalışır; İBB harita iframe/katman entegrasyonu görsel harita olarak korunur. İBB'den resmi, belgelenmiş bir adres JSON endpoint'i veya kullanıcı tarafından sağlanan API key/token geldiğinde yeni bir provider eklenebilir. Kaynak erişilemezse mevcut fallback korunmalı; tahmini veya uydurma cadde verisi üretilmemelidir.
