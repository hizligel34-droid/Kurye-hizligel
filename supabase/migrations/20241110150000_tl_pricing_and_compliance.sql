-- TL tarife (açılış 600 + km 50), vitrin modu, kurye pano redaksiyonu,
-- tahmin edilemeyen takip kodu, sipariş teyit kuyruğu.
-- Döviz / kur hesabı kaldırılır (32 sayılı Karar).

alter table public.pricing_settings add column if not exists base_try numeric(10, 2) not null default 600;
alter table public.pricing_settings add column if not exists per_km_try numeric(10, 2) not null default 50;
alter table public.pricing_settings add column if not exists showcase_mode boolean not null default false;

update public.pricing_settings
set base_try = 600, per_km_try = 50
where id = 1;

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

alter table public.orders drop column if exists price_usd;
alter table public.pricing_settings drop column if exists base_usd;
alter table public.pricing_settings drop column if exists per_km_usd;
alter table public.pricing_settings drop column if exists usd_to_try;

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select to authenticated
  using (
    public.is_admin()
    or customer_id = auth.uid()
    or courier_id = auth.uid()
  );

create or replace function public.list_courier_open_jobs()
returns table (
  id uuid,
  tracking_code text,
  status public.order_status,
  pickup_district text,
  dropoff_district text,
  bolge text,
  distance_km numeric,
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
           o.distance_km, o.total_price_tl, o.weight_kg, o.created_at
    from public.orders o
    where o.status = 'pending' and o.courier_id is null
    order by o.created_at desc;
end;
$$;

grant execute on function public.list_courier_open_jobs() to authenticated;

create or replace function public.track_order_public(p_code text)
returns table (
  tracking_code text,
  status public.order_status,
  bolge text,
  pickup_district text,
  dropoff_district text,
  distance_km numeric,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select o.tracking_code, o.status, o.bolge, o.pickup_district, o.dropoff_district,
         o.distance_km, o.created_at, o.updated_at
  from public.orders o
  where o.tracking_code = p_code;
$$;

grant execute on function public.track_order_public(text) to anon, authenticated;

create table if not exists public.outbound_mail (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  to_email text not null,
  subject text not null,
  body text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.outbound_mail enable row level security;

drop policy if exists outbound_mail_insert_own on public.outbound_mail;
create policy outbound_mail_insert_own on public.outbound_mail
  for insert to authenticated
  with check (public.current_role() in ('customer', 'admin'));

drop policy if exists outbound_mail_select_admin on public.outbound_mail;
create policy outbound_mail_select_admin on public.outbound_mail
  for select to authenticated
  using (public.is_admin());

create or replace function public.queue_order_confirmation(
  p_to_email text,
  p_subject text,
  p_body text,
  p_payload jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  mail_id uuid;
begin
  if p_to_email is null or length(trim(p_to_email)) < 5 then
    raise exception 'E-posta gerekli';
  end if;
  insert into public.outbound_mail (kind, to_email, subject, body, payload)
  values ('order_confirmation', trim(p_to_email), p_subject, p_body, p_payload)
  returning id into mail_id;
  return mail_id;
end;
$$;

grant execute on function public.queue_order_confirmation(text, text, text, jsonb) to authenticated;
