# Harita entegrasyonu kararı

Run Kurye'nin canlı sitesinde üçüncü taraf belediye iframe'i veya belediyeye özgü harita bağlantısı kullanılmaz. İstanbul haritası yalnızca cihazda saklanan PMTiles paketiyle, `OfflineIstanbulMap` bileşeni üzerinden açılır.

Adres seçimi belediye iframe'inden değil, Run Kurye'nin same-origin `/api/address` proxy'si ve İstanbul fallback dizininden yürütülür. Gerçek araç rotası ve kesin fiyat için online rota doğrulaması gerekir; offline harita paketi tek başına yol ağı üzerinde rota hesaplamaz.

Bu karar, kullanıcının İBB entegrasyonunu kaldırma talebi doğrultusunda alınmıştır. İBB'ye ait iframe, attribution, API bağlantısı veya canlı harita metni artık ürün arayüzünün parçası değildir.
