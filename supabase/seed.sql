-- kuryeler.tr örnek / ilk kurulum verisi
-- 1) Bu dosyayı SQL Editor'de çalıştırın (fiyat listesi + bölgeler).
-- 2) Authentication > Users üzerinden hesap oluşturun, ardından yönetici rolünü atayın.
-- CANLIYA ALMAYIN: aşağıdaki demo kullanıcı bloğunu canlı veritabanında çalıştırmayın.

insert into public.pricing_settings (
  id, base_fee_tl, per_km_tl, commission_rate, use_zones, cross_side_surcharge_tl,
  package_evrak_tl, package_kucuk_tl, package_orta_tl, package_buyuk_tl, package_gida_tl,
  base_try, per_km_try, vat_rate, rounding_decimals, routing_provider, routing_url, geocoder, showcase_mode
) values (
  1, 600, 50, 0.2000, false, 0, 0, 0, 0, 0, 0,
  600, 50, 0.2000, 2, 'osrm', 'https://router.project-osrm.org', 'nominatim', false
)
on conflict (id) do update set
  commission_rate = excluded.commission_rate,
  base_try = excluded.base_try,
  per_km_try = excluded.per_km_try,
  vat_rate = excluded.vat_rate,
  rounding_decimals = excluded.rounding_decimals,
  routing_provider = excluded.routing_provider,
  routing_url = excluded.routing_url,
  geocoder = excluded.geocoder,
  showcase_mode = excluded.showcase_mode,
  updated_at = now();

insert into public.district_prices (bolge, fiyat_tl, lat, lng) values
  ('Arnavutköy', 1000, 41.185, 28.74),
  ('Ataşehir', 600, 40.983, 29.127),
  ('Avcılar', 850, 40.979, 28.721),
  ('Ayazağa', 450, 41.118, 28.999),
  ('Bağdat vadi acil', 600, 40.963, 29.075),
  ('Bağcılar', 650, 41.039, 28.856),
  ('Bahçeköy', 750, 41.176, 28.993),
  ('Bahçelievler', 650, 41.002, 28.86),
  ('Bakırköy', 650, 40.981, 28.877),
  ('Başakşehir', 850, 41.093, 28.802),
  ('Bayrampaşa', 650, 41.048, 28.9),
  ('Beşiktaş', 350, 41.043, 29.008),
  ('Beykoz köyler', 1000, 41.125, 29.108),
  ('Beylikdüzü', 900, 41.001, 28.642),
  ('Beyoğlu', 350, 41.038, 28.985),
  ('Büyükçekmece', 1000, 41.021, 28.585),
  ('Çatalca', 1300, 41.143, 28.461),
  ('Çekmeköy', 700, 41.037, 29.2),
  ('Esenler', 650, 41.043, 28.876),
  ('Esenyurt', 900, 41.033, 28.675),
  ('Eyüp', 500, 41.056, 28.922),
  ('Fatih', 450, 41.018, 28.95),
  ('Ferhatpaşa', 850, 40.996, 28.802),
  ('Florya', 750, 40.973, 28.788),
  ('Gaziosmanpaşa', 650, 41.076, 28.911),
  ('Göktürk', 900, 41.183, 28.887),
  ('Güngören', 650, 41.021, 28.873),
  ('Kadıköy', 450, 40.983, 29.037),
  ('Kağıthane', 450, 41.08, 28.973),
  ('Kartal', 700, 40.911, 29.194),
  ('Kavacık', 650, 41.091, 29.092),
  ('Kemerburgaz', 900, 41.163, 28.923),
  ('Kurtköy', 1100, 40.901, 29.298),
  ('Kuyumcukent', 700, 41.004, 28.821),
  ('Küçükçekmece', 700, 41.003, 28.78),
  ('Maltepe', 650, 40.935, 29.151),
  ('OFİSLER', 450, 41.082, 29.011),
  ('Pendik', 900, 40.877, 29.233),
  ('Samandıra', 850, 40.992, 29.226),
  ('Sancaktepe', 850, 41.002, 29.237),
  ('Sarıyer merkez', 650, 41.166, 29.057),
  ('Silivri', 2000, 41.073, 28.246),
  ('Sultanbeyli', 850, 40.968, 29.267),
  ('Sultangazi', 750, 41.107, 28.868),
  ('Şenlikköy', 750, 40.978, 28.794),
  ('Şile', 2000, 41.175, 29.613),
  ('Şişli', 350, 41.06, 28.987),
  ('Tarabya', 450, 41.138, 29.047),
  ('Tuzla', 950, 40.816, 29.305),
  ('Uskumruköy', 850, 41.228, 29.029),
  ('Ümraniye', 650, 41.016, 29.124),
  ('Üsküdar', 450, 41.023, 29.016),
  ('Yeşilköy', 750, 40.96, 28.823),
  ('Zekeriya köy', 850, 41.211, 29.028),
  ('Zeytinburnu', 650, 41.003, 28.91)
on conflict (bolge) do update set
  fiyat_tl = excluded.fiyat_tl,
  lat = excluded.lat,
  lng = excluded.lng,
  updated_at = now();

-- Demo hesap ve şifre eklenmez. Kullanıcıları Authentication panelinden oluşturun.
-- İlk yöneticiyi SQL ile atayın, örneğin:
-- update public.profiles set role = 'admin' where id = '<auth user uuid>';
-- Kurye rolü de yalnızca yönetici tarafından atanır (self-signup kapalı).

