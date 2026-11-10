-- kuryeler.tr — ilçe/bölge fiyat listesi, sipariş alanları, foto/imza, ödeme
-- İlk migration’dan sonra çalıştırın.

do $$ begin
  create type public.payment_method as enum ('nakit', 'havale', 'kart_kapida');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('bekliyor', 'odendi');
exception when duplicate_object then null;
end $$;

create table if not exists public.district_prices (
  bolge text primary key,
  fiyat_tl numeric(10, 2) not null check (fiyat_tl >= 0),
  lat numeric(9, 6),
  lng numeric(9, 6),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists product text not null default '';
alter table public.orders add column if not exists bolge text not null default '';
alter table public.orders add column if not exists recipient_name text not null default '';
alter table public.orders add column if not exists scheduled_at timestamptz;
alter table public.orders add column if not exists payment_method public.payment_method not null default 'nakit';
alter table public.orders add column if not exists payment_status public.payment_status not null default 'bekliyor';
alter table public.orders add column if not exists pickup_photo text;
alter table public.orders add column if not exists delivery_photo text;
alter table public.orders add column if not exists signature_data text;

create index if not exists orders_bolge_idx on public.orders (bolge);
create index if not exists district_prices_fiyat_idx on public.district_prices (fiyat_tl);

-- Bölge fiyatına göre ücret (km formülünün yerini alır)
create or replace function public.recalculate_order_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  settings public.pricing_settings%rowtype;
  zone_fee numeric := 0;
  total numeric;
begin
  select * into settings from public.pricing_settings where id = 1;
  if coalesce(new.bolge, '') = '' then
    new.bolge := new.dropoff_district;
  end if;
  select fiyat_tl into zone_fee from public.district_prices where bolge = new.bolge;
  total := coalesce(zone_fee, 0);
  new.total_price_tl := round(total, 2);
  new.company_revenue_tl := round(total * coalesce(settings.commission_rate, 0.2), 2);
  new.courier_earning_tl := round(total - new.company_revenue_tl, 2);
  return new;
end;
$$;

drop trigger if exists orders_recalculate_price on public.orders;
create trigger orders_recalculate_price
before insert or update of bolge, dropoff_district
on public.orders
for each row execute function public.recalculate_order_price();

create or replace function public.advance_order_status(
  p_order_id uuid,
  p_status public.order_status,
  p_pickup_photo text default null,
  p_delivery_photo text default null,
  p_signature text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.orders;
  me uuid := auth.uid();
  my_role public.user_role;
begin
  if me is null then
    raise exception 'Giriş yapmalısınız';
  end if;
  select role into my_role from public.profiles where id = me;
  select * into rec from public.orders where id = p_order_id;
  if rec.id is null then
    raise exception 'Sipariş bulunamadı';
  end if;
  if not public.can_transition_status(rec.status, p_status) then
    raise exception 'Bu durum geçişi geçersiz';
  end if;

  if my_role = 'courier' then
    if rec.courier_id <> me then
      raise exception 'Bu sipariş size atanmamış';
    end if;
    if p_status not in ('picked_up', 'en_route', 'delivered', 'cancelled') then
      raise exception 'Kurye bu duruma geçemez';
    end if;
    if p_status = 'picked_up' and coalesce(p_pickup_photo, rec.pickup_photo, '') = '' then
      raise exception 'Alım için fotoğraf gereklidir';
    end if;
    if p_status = 'delivered' and (
      coalesce(p_delivery_photo, rec.delivery_photo, '') = ''
      or coalesce(p_signature, rec.signature_data, '') = ''
    ) then
      raise exception 'Teslim için fotoğraf ve imza gereklidir';
    end if;
  elsif my_role = 'admin' then
    null;
  elsif my_role = 'customer' then
    if rec.customer_id <> me or p_status <> 'cancelled' then
      raise exception 'Müşteri yalnızca kendi siparişini iptal edebilir';
    end if;
    if rec.status in ('delivered', 'cancelled') then
      raise exception 'Bu sipariş artık iptal edilemez';
    end if;
  else
    raise exception 'Yetkisiz';
  end if;

  update public.orders
     set status = p_status,
         pickup_photo = coalesce(p_pickup_photo, pickup_photo),
         delivery_photo = coalesce(p_delivery_photo, delivery_photo),
         signature_data = coalesce(p_signature, signature_data),
         picked_up_at = case when p_status = 'picked_up' then now() else picked_up_at end,
         delivered_at = case when p_status = 'delivered' then now() else delivered_at end,
         cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end
   where id = p_order_id
  returning * into rec;
  return rec;
end;
$$;

create or replace function public.set_payment_status(
  p_order_id uuid,
  p_status public.payment_status
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.orders;
  me uuid := auth.uid();
  my_role public.user_role;
begin
  if me is null then
    raise exception 'Giriş yapmalısınız';
  end if;
  select role into my_role from public.profiles where id = me;
  if my_role not in ('admin', 'courier') then
    raise exception 'Ödeme durumunu yalnızca kurye veya yönetici güncelleyebilir';
  end if;
  update public.orders
     set payment_status = p_status
   where id = p_order_id
     and (my_role = 'admin' or courier_id = me)
  returning * into rec;
  if rec.id is null then
    raise exception 'Ödeme güncellenemedi';
  end if;
  return rec;
end;
$$;

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
language sql
stable
security definer
set search_path = public
as $$
  select o.tracking_code, o.status, o.bolge, o.pickup_district, o.dropoff_district,
         o.product, o.created_at, o.updated_at
  from public.orders o
  where o.tracking_code = p_code;
$$;

grant execute on function public.advance_order_status(uuid, public.order_status, text, text, text) to authenticated;
grant execute on function public.set_payment_status(uuid, public.payment_status) to authenticated;
grant execute on function public.track_order_public(text) to anon, authenticated;

alter table public.district_prices enable row level security;

drop policy if exists district_prices_select on public.district_prices;
create policy district_prices_select on public.district_prices
  for select to anon, authenticated
  using (true);

drop policy if exists district_prices_admin on public.district_prices;
create policy district_prices_admin on public.district_prices
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

do $$ begin
  alter publication supabase_realtime add table public.district_prices;
exception when duplicate_object then null;
end $$;
