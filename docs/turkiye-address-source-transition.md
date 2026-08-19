# Türkiye Adres Kaynağı Değerlendirmesi

## Mevcut durum

Run Courier, `turkiyeapi.dev` v1 ve İstanbul’a özel yerel fallback verisini kullanmaktadır. Kullanıcı onayıyla mevcut kayıtlı kullanıcı adresleri ve İstanbul’a özel fallback yaklaşımı kaldırılacaktır. Veritabanı sayımı, sıfırlama anında kayıtlı adres, varsayılan adres referansı ve geçmiş siparişlerde İstanbul adresi bulunmadığını gösterdi.

## Araştırılan kaynaklar

| Kaynak | Kapsam | Kullanım değerlendirmesi | Karar |
|---|---|---|---|
| [Tradres](https://tradres.com.tr/) | 81 il, ilçe, mahalle, sokak | Public API eğitim/prototip kullanımı ile sınırlı; verinin topluca yeniden yayımlanmasını veya satışını yasaklıyor. | Ticari kurye platformu için kullanılmayacak. |
| [turkey-geo-api](https://github.com/onurusluca/turkey-geo-api) | 81 il, ilçe, mahalle, sokak; belde/köy katmanları | MIT lisanslı açık kaynak proje; veri dosyaları repo ile birlikte geliyor, Türkçe arama ve sayfalama sağlıyor. | Yeni kaynak adaptörünün temel kaynağı olarak seçildi. |

## Entegrasyon ilkesi

Adres seçici, projeye büyük statik veri gömmek yerine seçilen kaynağın hiyerarşik API sözleşmesine bağlanacaktır. Kullanıcıdan gelen kayıtlı adresler kullanıcı hesaplarından silinecek; geçmiş siparişlerdeki adres denetim izi silinmeyecektir. Kaynak erişilemezse adres doğrulaması başarısız olacak, tahmini/veri uydurulmayacaktır.
