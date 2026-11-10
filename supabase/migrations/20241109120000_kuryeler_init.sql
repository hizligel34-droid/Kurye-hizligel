-- kuryeler.tr — çekirdek şema, RLS ve güvenlik tanımlı işlevler
-- Supabase SQL Editor veya `supabase db push` ile uygulanır.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('customer', 'courier', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_status as enum (
    'pending', 'assigned', 'picked_up', 'en_route', 'delivered', 'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.package_type as enum ('evrak', 'kucuk', 'orta', 'buyuk', 'gida');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text not null default '',
  phone text not null default '',
  is_online boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_settings (
  id int primary key default 1 check (id = 1),
  base_fee_tl numeric(10, 2) not null default 150,
  per_km_tl numeric(10, 2) not null default 25,
  commission_rate numeric(5, 4) not null default 0.2000,
  use_zones boolean not null default true,
  cross_side_surcharge_tl numeric(10, 2) not null default 40,
  package_evrak_tl numeric(10, 2) not null default 0,
  package_kucuk_tl numeric(10, 2) not null default 0,
  package_orta_tl numeric(10, 2) not null default 25,
  package_buyuk_tl numeric(10, 2) not null default 50,
  package_gida_tl numeric(10, 2) not null default 20,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

insert into public.pricing_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.pricing_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  side text not null check (side in ('avrupa', 'anadolu')),
  districts text[] not null default '{}',
  surcharge_tl numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  customer_id uuid not null references public.profiles (id),
  courier_id uuid references public.profiles (id),
  status public.order_status not null default 'pending',
  pickup_address text not null,
  pickup_district text not null,
  pickup_neighborhood text not null default '',
  pickup_street text not null default '',
  pickup_note text not null default '',
  dropoff_address text not null,
  dropoff_district text not null,
  dropoff_neighborhood text not null default '',
  dropoff_street text not null default '',
  dropoff_note text not null default '',
  package_type public.package_type not null default 'kucuk',
  notes text not null default '',
  contact_phone text not null,
  distance_km numeric(8, 2) not null default 0,
  total_price_tl numeric(10, 2) not null default 0,
  courier_earning_tl numeric(10, 2) not null default 0,
  company_revenue_tl numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists orders_customer_idx on public.orders (customer_id, created_at desc);
create index if not exists orders_courier_idx on public.orders (courier_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_tracking_idx on public.orders (tracking_code);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.package_fee(p public.package_type, s public.pricing_settings)
returns numeric
language sql
immutable
as $$
  select case p
    when 'evrak' then s.package_evrak_tl
    when 'kucuk' then s.package_kucuk_tl
    when 'orta' then s.package_orta_tl
    when 'buyuk' then s.package_buyuk_tl
    when 'gida' then s.package_gida_tl
  end;
$$;

create or replace function public.recalculate_order_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  settings public.pricing_settings%rowtype;
  pkg numeric;
  distance_fee numeric;
  zone_fee numeric := 0;
  pickup_side text;
  dropoff_side text;
  total numeric;
begin
  select * into settings from public.pricing_settings where id = 1;
  pkg := public.package_fee(new.package_type, settings);
  distance_fee := greatest(new.distance_km, 0) * settings.per_km_tl;

  if settings.use_zones then
    select side into pickup_side from public.pricing_zones
      where new.pickup_district = any (districts) limit 1;
    select side into dropoff_side from public.pricing_zones
      where new.dropoff_district = any (districts) limit 1;
    if pickup_side is not null and dropoff_side is not null and pickup_side <> dropoff_side then
      zone_fee := settings.cross_side_surcharge_tl;
    end if;
  end if;

  total := greatest(settings.base_fee_tl, settings.base_fee_tl + distance_fee + pkg + zone_fee);
  new.total_price_tl := round(total, 2);
  new.company_revenue_tl := round(total * settings.commission_rate, 2);
  new.courier_earning_tl := round(total - new.company_revenue_tl, 2);
  return new;
end;
$$;

drop trigger if exists orders_recalculate_price on public.orders;
create trigger orders_recalculate_price
before insert or update of distance_km, package_type, pickup_district, dropoff_district
on public.orders
for each row execute function public.recalculate_order_price();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text;
  assigned public.user_role := 'customer';
begin
  requested := coalesce(new.raw_user_meta_data->>'role', 'customer');
  if requested = 'courier' then
    assigned := 'courier';
  elsif requested = 'admin' then
    assigned := 'customer'; -- admin yalnızca SQL / mevcut yönetici ile atanır
  end if;

  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    assigned,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.can_transition_status(from_status public.order_status, to_status public.order_status)
returns boolean
language sql
immutable
as $$
  select case
    when from_status = to_status then true
    when from_status = 'pending' then to_status in ('assigned', 'cancelled')
    when from_status = 'assigned' then to_status in ('picked_up', 'cancelled')
    when from_status = 'picked_up' then to_status in ('en_route', 'cancelled')
    when from_status = 'en_route' then to_status in ('delivered', 'cancelled')
    else false
  end;
$$;

create or replace function public.accept_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.orders;
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Giriş yapmalısınız';
  end if;
  if (select role from public.profiles where id = me) <> 'courier' then
    raise exception 'Yalnızca kuryeler iş kabul edebilir';
  end if;

  update public.orders
     set courier_id = me,
         status = 'assigned',
         assigned_at = now()
   where id = p_order_id
     and status = 'pending'
     and courier_id is null
  returning * into rec;

  if rec.id is null then
    raise exception 'İş artık müsait değil';
  end if;
  return rec;
end;
$$;

create or replace function public.advance_order_status(p_order_id uuid, p_status public.order_status)
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
         picked_up_at = case when p_status = 'picked_up' then now() else picked_up_at end,
         delivered_at = case when p_status = 'delivered' then now() else delivered_at end,
         cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end
   where id = p_order_id
  returning * into rec;
  return rec;
end;
$$;

create or replace function public.assign_order(p_order_id uuid, p_courier_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.orders;
begin
  if not public.is_admin() then
    raise exception 'Yalnızca yönetici atama yapabilir';
  end if;
  if (select role from public.profiles where id = p_courier_id) <> 'courier' then
    raise exception 'Hedef kullanıcı kurye değil';
  end if;

  update public.orders
     set courier_id = p_courier_id,
         status = case when status in ('pending', 'assigned') then 'assigned'::public.order_status else status end,
         assigned_at = now(),
         cancelled_at = null
   where id = p_order_id
     and status not in ('delivered', 'cancelled')
  returning * into rec;

  if rec.id is null then
    raise exception 'Sipariş atanamadı';
  end if;
  return rec;
end;
$$;

create or replace function public.track_order_public(p_code text)
returns table (
  tracking_code text,
  status public.order_status,
  pickup_district text,
  dropoff_district text,
  package_type public.package_type,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select o.tracking_code, o.status, o.pickup_district, o.dropoff_district, o.package_type, o.created_at, o.updated_at
  from public.orders o
  where o.tracking_code = p_code;
$$;

grant execute on function public.accept_order(uuid) to authenticated;
grant execute on function public.advance_order_status(uuid, public.order_status) to authenticated;
grant execute on function public.assign_order(uuid, uuid) to authenticated;
grant execute on function public.track_order_public(text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.pricing_settings enable row level security;
alter table public.pricing_zones enable row level security;
alter table public.orders enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (
    (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()))
    or public.is_admin()
  );

drop policy if exists pricing_select on public.pricing_settings;
create policy pricing_select on public.pricing_settings
  for select to anon, authenticated
  using (true);

drop policy if exists pricing_update_admin on public.pricing_settings;
create policy pricing_update_admin on public.pricing_settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists zones_select on public.pricing_zones;
create policy zones_select on public.pricing_zones
  for select to anon, authenticated
  using (true);

drop policy if exists zones_admin on public.pricing_zones;
create policy zones_admin on public.pricing_zones
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select to authenticated
  using (
    public.is_admin()
    or customer_id = auth.uid()
    or courier_id = auth.uid()
    or (status = 'pending' and public.current_role() = 'courier')
  );

drop policy if exists orders_insert_customer on public.orders;
create policy orders_insert_customer on public.orders
  for insert to authenticated
  with check (
    customer_id = auth.uid()
    and courier_id is null
    and status = 'pending'
    and public.current_role() in ('customer', 'admin')
  );

drop policy if exists orders_update_limited on public.orders;
create policy orders_update_limited on public.orders
  for update to authenticated
  using (public.is_admin() or courier_id = auth.uid() or customer_id = auth.uid())
  with check (public.is_admin() or courier_id = auth.uid() or customer_id = auth.uid());

do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;
