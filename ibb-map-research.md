# İBB araştırma tarihçesi

Bu dosya yalnızca geçmiş teknik araştırma notudur. Kullanıcı talebiyle İBB iframe, canlı harita bağlantısı, attribution ve İBB API bağlantısı canlı Run Kurye arayüzünden kaldırılmıştır.

Run Kurye'nin aktif harita akışı `OfflineIstanbulMap` bileşeni ve cihazda saklanan İstanbul PMTiles paketidir. Adres seçimi same-origin `/api/address` proxy'si ile; kesin araç rotası ve fiyat ise online rota doğrulaması ile yürütülür.

Bu tarihçe, daha önce İBB Şehir Haritası'nın iframe ve API erişim modelinin incelendiğini kaydeder; ancak canlı kod artık bu servise bağlanmaz ve İBB'ye ait URL'leri kullanıcıya göstermez.
