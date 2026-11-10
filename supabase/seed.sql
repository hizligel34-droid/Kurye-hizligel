-- kuryeler.tr örnek / ilk kurulum verisi
-- 1) Bu dosyayı SQL Editor'de çalıştırın (fiyat listesi + bölgeler).
-- 2) Authentication > Users üzerinden hesap oluşturun VEYA aşağıdaki
--    auth.users eklerini (isteğe bağlı) kullanın, ardından yönetici rolünü atayın.

insert into public.pricing_settings (
  id, base_fee_tl, per_km_tl, commission_rate, use_zones, cross_side_surcharge_tl,
  package_evrak_tl, package_kucuk_tl, package_orta_tl, package_buyuk_tl, package_gida_tl,
  base_usd, per_km_usd, rounding_decimals, usd_to_try, routing_provider, routing_url, geocoder
) values (
  1, 0, 0, 0.2000, false, 0, 0, 0, 0, 0, 0,
  1, 1, 2, 34.5, 'osrm', 'https://router.project-osrm.org', 'nominatim'
)
on conflict (id) do update set
  commission_rate = excluded.commission_rate,
  base_usd = excluded.base_usd,
  per_km_usd = excluded.per_km_usd,
  rounding_decimals = excluded.rounding_decimals,
  usd_to_try = excluded.usd_to_try,
  routing_provider = excluded.routing_provider,
  routing_url = excluded.routing_url,
  geocoder = excluded.geocoder,
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

-- ---------------------------------------------------------------------------
-- İsteğe bağlı demo hesapları (yalnızca geliştirme / ilk kurulum).
-- Canlıya almadan ÖNCE bu şifreleri değiştirin veya hesapları silin.
-- pgcrypto gerekir (migration içinde açılır).
-- ---------------------------------------------------------------------------

do $$
declare
  admin_id uuid := '00000000-0000-0000-0000-000000000001';
  courier_id uuid := '00000000-0000-0000-0000-000000000002';
  customer_id uuid := '00000000-0000-0000-0000-000000000003';
begin
  if exists (select 1 from auth.users where email = 'yonetici@kuryeler.tr') then
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values
    (
      '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
      'yonetici@kuryeler.tr', crypt('KuryelerYonetici1!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Şerif Yönetici","phone":"05421110001","role":"customer"}',
      now(), now(), '', '', '', ''
    ),
    (
      '00000000-0000-0000-0000-000000000000', courier_id, 'authenticated', 'authenticated',
      'kurye@kuryeler.tr', crypt('KuryelerKurye1!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Mehmet Kurye","phone":"05421110002","role":"courier"}',
      now(), now(), '', '', '', ''
    ),
    (
      '00000000-0000-0000-0000-000000000000', customer_id, 'authenticated', 'authenticated',
      'musteri@kuryeler.tr', crypt('KuryelerMusteri1!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Ayşe Müşteri","phone":"05421110003","role":"customer"}',
      now(), now(), '', '', '', ''
    )
  on conflict (id) do nothing;

  update public.profiles set role = 'admin', full_name = 'Şerif Yönetici', phone = '05421110001'
   where id = admin_id;
  update public.profiles set role = 'courier', full_name = 'Mehmet Kurye', phone = '05421110002', is_online = true
   where id = courier_id;
  update public.profiles set role = 'customer', full_name = 'Ayşe Müşteri', phone = '05421110003'
   where id = customer_id;

  insert into public.orders (
    tracking_code, customer_id, courier_id, status,
    product, pickup_address, pickup_district, dropoff_address, dropoff_district,
    bolge, recipient_name, scheduled_at, notes, contact_phone,
    payment_method, payment_status, package_type
  ) values
    (
      'KY-DEMO0001', customer_id, null, 'pending',
      'Sözleşme evrakı',
      'Caferağa, Moda Cad. No 12, Kadıköy, İstanbul', 'Kadıköy',
      'Levent, Büyükdere Cad. No 120, Beşiktaş, İstanbul', 'Beşiktaş',
      'Beşiktaş', 'Ayşe Demir', now() + interval '2 hours',
      'Resepsiyona teslim', '05421110003', 'nakit', 'bekliyor', 'evrak'
    ),
    (
      'KY-DEMO0002', customer_id, courier_id, 'en_route',
      'Hediyelik kutu',
      'Osmanağa, Bahariye Cad. No 45, Kadıköy, İstanbul', 'Kadıköy',
      'Ataşehir Bulvarı, Ataşehir, İstanbul', 'Ataşehir',
      'Ataşehir', 'Can Yılmaz', now() + interval '1 hour',
      'Daire 8', '05421110003', 'havale', 'bekliyor', 'orta'
    )
  on conflict (tracking_code) do nothing;
end $$;
