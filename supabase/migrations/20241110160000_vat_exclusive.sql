-- Tarife KDV hariçtir; üstüne yönetilebilir KDV (varsayılan %20) eklenir.

alter table public.pricing_settings add column if not exists vat_rate numeric(6, 4) not null default 0.2000;
alter table public.orders add column if not exists net_price_tl numeric(12, 2) not null default 0;
alter table public.orders add column if not exists vat_tl numeric(12, 2) not null default 0;

update public.pricing_settings set vat_rate = 0.2000 where id = 1;

create or replace function public.recalculate_order_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  settings public.pricing_settings%rowtype;
  net numeric;
  vat numeric;
  digits int;
  vat_rate numeric;
begin
  select * into settings from public.pricing_settings where id = 1;
  digits := coalesce(settings.rounding_decimals, 2);
  vat_rate := coalesce(settings.vat_rate, 0.20);
  net := round(
    coalesce(settings.base_try, 600) + coalesce(settings.per_km_try, 50) * greatest(coalesce(new.distance_km, 0), 0),
    digits
  );
  vat := round(net * vat_rate, digits);
  new.net_price_tl := net;
  new.vat_tl := vat;
  new.total_price_tl := round(net + vat, digits);
  new.company_revenue_tl := round(net * coalesce(settings.commission_rate, 0.2), 2);
  new.courier_earning_tl := round(net - new.company_revenue_tl, 2);
  return new;
end;
$$;

drop trigger if exists orders_recalculate_price on public.orders;
create trigger orders_recalculate_price
before insert or update of distance_km, weight_kg
on public.orders
for each row execute function public.recalculate_order_price();

update public.orders set distance_km = distance_km;

drop function if exists public.list_courier_open_jobs();
create or replace function public.list_courier_open_jobs()
returns table (
  id uuid,
  tracking_code text,
  status public.order_status,
  pickup_district text,
  dropoff_district text,
  bolge text,
  distance_km numeric,
  net_price_tl numeric,
  vat_tl numeric,
  total_price_tl numeric,
  weight_kg numeric,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.current_role() not in ('courier', 'admin') then
    raise exception 'Yetkisiz';
  end if;
  return query
    select o.id, o.tracking_code, o.status, o.pickup_district, o.dropoff_district, o.bolge,
           o.distance_km, o.net_price_tl, o.vat_tl, o.total_price_tl, o.weight_kg, o.created_at
    from public.orders o
    where o.status = 'pending' and o.courier_id is null
    order by o.created_at desc;
end;
$$;

grant execute on function public.list_courier_open_jobs() to authenticated;
