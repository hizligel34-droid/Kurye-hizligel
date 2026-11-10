-- Sürüş (yol) mesafesine göre TL fiyat + 30 kg üst sınırı
-- Kuş uçuşu kullanılmaz; distance_km OSRM/ORS sürüş rotasından gelir.
-- Ücret dövize endeksli değildir (32 sayılı Karar).

alter table public.pricing_settings add column if not exists base_try numeric(10, 2) not null default 600;
alter table public.pricing_settings add column if not exists per_km_try numeric(10, 2) not null default 50;
alter table public.pricing_settings add column if not exists rounding_decimals int not null default 2;
alter table public.pricing_settings add column if not exists routing_provider text not null default 'osrm';
alter table public.pricing_settings add column if not exists routing_url text not null default 'https://router.project-osrm.org';
alter table public.pricing_settings add column if not exists geocoder text not null default 'nominatim';

alter table public.pricing_settings drop constraint if exists pricing_rounding_check;
alter table public.pricing_settings
  add constraint pricing_rounding_check check (rounding_decimals between 0 and 6);

alter table public.orders add column if not exists weight_kg numeric(6, 2) not null default 1;
alter table public.orders add column if not exists pickup_lat numeric(10, 7);
alter table public.orders add column if not exists pickup_lng numeric(10, 7);
alter table public.orders add column if not exists dropoff_lat numeric(10, 7);
alter table public.orders add column if not exists dropoff_lng numeric(10, 7);
alter table public.orders add column if not exists route_geojson text;

update public.orders set weight_kg = 1 where weight_kg is null or weight_kg <= 0;

alter table public.orders drop constraint if exists orders_weight_kg_check;
alter table public.orders
  add constraint orders_weight_kg_check check (weight_kg > 0 and weight_kg <= 30);

create or replace function public.enforce_weight_limit()
returns trigger
language plpgsql
as $$
begin
  if new.weight_kg > 30 then
    raise exception 'Maksimum taşıma sınırı 30 kg';
  end if;
  if new.weight_kg <= 0 then
    raise exception 'Paket ağırlığı 0 kg’dan büyük olmalıdır';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_weight_limit on public.orders;
create trigger orders_weight_limit
before insert or update of weight_kg
on public.orders
for each row execute function public.enforce_weight_limit();

create or replace function public.recalculate_order_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  settings public.pricing_settings%rowtype;
  raw numeric;
  digits int;
begin
  select * into settings from public.pricing_settings where id = 1;
  digits := coalesce(settings.rounding_decimals, 2);
  raw := coalesce(settings.base_try, 600) + coalesce(settings.per_km_try, 50) * greatest(coalesce(new.distance_km, 0), 0);
  new.total_price_tl := round(raw, digits);
  new.company_revenue_tl := round(new.total_price_tl * coalesce(settings.commission_rate, 0.2), 2);
  new.courier_earning_tl := round(new.total_price_tl - new.company_revenue_tl, 2);
  return new;
end;
$$;

drop trigger if exists orders_recalculate_price on public.orders;
create trigger orders_recalculate_price
before insert or update of distance_km, weight_kg
on public.orders
for each row execute function public.recalculate_order_price();

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
  );
