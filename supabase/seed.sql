-- kuryeler.tr örnek / ilk kurulum verisi
-- 1) Bu dosyayı SQL Editor'de çalıştırın (pricing + bölgeler).
-- 2) Authentication > Users üzerinden hesap oluşturun VEYA aşağıdaki
--    auth.users eklerini (isteğe bağlı) kullanın, ardından yönetici rolünü atayın.

insert into public.pricing_settings (
  id, base_fee_tl, per_km_tl, commission_rate, use_zones, cross_side_surcharge_tl,
  package_evrak_tl, package_kucuk_tl, package_orta_tl, package_buyuk_tl, package_gida_tl
) values (
  1, 150, 25, 0.2000, true, 40, 0, 0, 25, 50, 20
)
on conflict (id) do update set
  base_fee_tl = excluded.base_fee_tl,
  per_km_tl = excluded.per_km_tl,
  commission_rate = excluded.commission_rate,
  use_zones = excluded.use_zones,
  cross_side_surcharge_tl = excluded.cross_side_surcharge_tl,
  package_evrak_tl = excluded.package_evrak_tl,
  package_kucuk_tl = excluded.package_kucuk_tl,
  package_orta_tl = excluded.package_orta_tl,
  package_buyuk_tl = excluded.package_buyuk_tl,
  package_gida_tl = excluded.package_gida_tl,
  updated_at = now();

insert into public.pricing_zones (name, side, districts, surcharge_tl)
select * from (
  values
    (
      'İstanbul Avrupa',
      'avrupa',
      array[
        'Arnavutköy','Avcılar','Bağcılar','Bahçelievler','Bakırköy','Başakşehir','Bayrampaşa',
        'Beşiktaş','Beylikdüzü','Beyoğlu','Büyükçekmece','Çatalca','Esenler','Esenyurt',
        'Eyüpsultan','Fatih','Gaziosmanpaşa','Güngören','Kağıthane','Küçükçekmece','Sarıyer',
        'Silivri','Sultangazi','Şişli','Zeytinburnu'
      ]::text[],
      0::numeric
    ),
    (
      'İstanbul Anadolu',
      'anadolu',
      array[
        'Adalar','Ataşehir','Beykoz','Çekmeköy','Kadıköy','Kartal','Maltepe','Pendik',
        'Sancaktepe','Sultanbeyli','Şile','Tuzla','Ümraniye','Üsküdar'
      ]::text[],
      0::numeric
    )
) as seed(name, side, districts, surcharge_tl)
where not exists (select 1 from public.pricing_zones z where z.name = seed.name);

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
    pickup_address, pickup_district, pickup_neighborhood, pickup_street, pickup_note,
    dropoff_address, dropoff_district, dropoff_neighborhood, dropoff_street, dropoff_note,
    package_type, notes, contact_phone, distance_km
  ) values
    (
      'KY-DEMO0001', customer_id, null, 'pending',
      'Caferağa, Moda Cad. No 12, Kadıköy, İstanbul', 'Kadıköy', 'Caferağa', 'Moda Caddesi', 'Kapıcıya bırakılabilir',
      'Levent, Büyükdere Cad. No 120, Beşiktaş, İstanbul', 'Beşiktaş', 'Levent', 'Büyükdere Caddesi', 'Resepsiyon',
      'evrak', 'Sözleşme evrakı', '05421110003', 9.5
    ),
    (
      'KY-DEMO0002', customer_id, courier_id, 'en_route',
      'Osmanağa, Bahariye Cad. No 45, Kadıköy, İstanbul', 'Kadıköy', 'Osmanağa', 'Bahariye Caddesi', '',
      'Acıbadem, Ataşehir, İstanbul', 'Ataşehir', 'Atatürk', 'Ataşehir Bulvarı', 'Daire 8',
      'orta', 'Hediyelik kutu', '05421110003', 7.2
    )
  on conflict (tracking_code) do nothing;
end $$;
