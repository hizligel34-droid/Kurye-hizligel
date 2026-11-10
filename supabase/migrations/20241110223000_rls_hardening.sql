-- kuryeler.tr — RLS ve RPC sıkılaştırma (canlıya uygulamayın; yalnızca dosya)
-- Hedef: müşteri/kurye sipariş satırını doğrudan güncelleyemesin; fiyat/durum
-- yalnızca SECURITY DEFINER RPC’lerden değişsin. Eski 2 argümanlı
-- advance_order_status (fotoğraf/imza atlanabilir) kaldırılır.

-- Eski imza: kanıt zorunluluğunu baypas eder.
drop function if exists public.advance_order_status(uuid, public.order_status);

create or replace function public.haversine_km(
  lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric
)
returns numeric
language sql
immutable
as $$
  select case
    when lat1 is null or lng1 is null or lat2 is null or lng2 is null then null
    else 2 * 6371 * asin(sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2)
      + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
    ))
  end;
$$;

create or replace function public.enforce_route_plausible()
returns trigger
language plpgsql
as $$
declare
  straight numeric;
begin
  if new.pickup_lat is null or new.dropoff_lat is null
     or new.pickup_lng is null or new.dropoff_lng is null then
    return new;
  end if;
  straight := public.haversine_km(new.pickup_lat, new.pickup_lng, new.dropoff_lat, new.dropoff_lng);
  if straight is null then
    return new;
  end if;
  if new.distance_km + 0.2 < straight * 0.5 then
    raise exception 'Sürüş mesafesi kuş uçuşundan kısa olamaz';
  end if;
  if new.distance_km > greatest(100, straight * 8 + 10) then
    raise exception 'Sürüş mesafesi bu noktalar için makul değil';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_route_plausible on public.orders;
create trigger orders_route_plausible
before insert or update of distance_km, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng
on public.orders
for each row execute function public.enforce_route_plausible();

create or replace function public.ensure_tracking_code()
returns trigger
language plpgsql
as $$
begin
  if new.tracking_code is null
     or btrim(new.tracking_code) = ''
     or new.tracking_code !~ '^KY-[A-Z0-9]{6,14}$' then
    new.tracking_code := 'KY-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  else
    new.tracking_code := upper(btrim(new.tracking_code));
  end if;
  return new;
end;
$$;

drop trigger if exists orders_ensure_tracking_code on public.orders;
create trigger orders_ensure_tracking_code
before insert on public.orders
for each row execute function public.ensure_tracking_code();

-- Doğrudan UPDATE: müşteri fiyatı/durumu/kuryeyi değiştirebiliyordu.
drop policy if exists orders_update_limited on public.orders;

-- INSERT sıkılaştırma (ödeme ödendi, foto, kurye atanmış satır açılamaz)
drop policy if exists orders_insert_customer on public.orders;
create policy orders_insert_customer on public.orders
  for insert to authenticated
  with check (
    customer_id = auth.uid()
    and courier_id is null
    and status = 'pending'
    and public.current_role() in ('customer', 'admin')
    and weight_kg > 0
    and weight_kg <= 30
    and distance_km >= 0
    and payment_status = 'bekliyor'
    and pickup_photo is null
    and delivery_photo is null
    and signature_data is null
  );

-- Tablo yetkileri: SELECT/INSERT kalsın, UPDATE/DELETE yalnızca RPC (sahip / service_role)
revoke all on table public.orders from anon;
revoke update, delete on table public.orders from authenticated;
grant select, insert on table public.orders to authenticated;

revoke all on table public.profiles from anon;
grant select, update on table public.profiles to authenticated;

revoke all on table public.pricing_settings from anon;
grant select on table public.pricing_settings to authenticated;
grant update on table public.pricing_settings to authenticated;

revoke all on table public.pricing_zones from anon;
grant select, insert, update, delete on table public.pricing_zones to authenticated;

revoke all on table public.district_prices from anon;
grant select, insert, update, delete on table public.district_prices to authenticated;

-- SECURITY DEFINER fonksiyonlarını PUBLIC/anon’dan çek
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
  end loop;
end $$;

grant execute on function public.accept_order(uuid) to authenticated;
grant execute on function public.advance_order_status(uuid, public.order_status, text, text, text) to authenticated;
grant execute on function public.assign_order(uuid, uuid) to authenticated;
grant execute on function public.set_payment_status(uuid, public.payment_status) to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_admin() to authenticated;

create or replace function public.track_order_public(p_code text)
returns table (
  tracking_code text,
  status public.order_status,
  bolge text,
  pickup_district text,
  dropoff_district text,
  product text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_code is null or length(btrim(p_code)) < 6 then
    return;
  end if;
  return query
    select o.tracking_code, o.status, o.bolge, o.pickup_district, o.dropoff_district,
           o.product, o.created_at, o.updated_at
    from public.orders o
    where o.tracking_code = upper(btrim(p_code));
end;
$$;

revoke all on function public.track_order_public(text) from public;
grant execute on function public.track_order_public(text) to anon, authenticated;
