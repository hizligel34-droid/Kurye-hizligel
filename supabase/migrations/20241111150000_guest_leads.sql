-- Üyeliksiz kısa kurye talebi. TCKN sütunu yoktur. Anonim yalnızca INSERT.
-- Honeypot: website boş olmalı. Telefon başına 10 dakikada en fazla 3 kayıt.

create table if not exists public.guest_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  pickup_address text not null,
  dropoff_address text not null,
  distance_km numeric,
  product text not null default 'Kurye gönderisi',
  website text not null default '',
  pre_info_ok boolean not null default false,
  withdraw_ok boolean not null default false,
  created_at timestamptz not null default now(),
  constraint guest_leads_name_len check (char_length(btrim(full_name)) between 2 and 80),
  constraint guest_leads_phone_len check (char_length(btrim(phone)) between 10 and 16),
  constraint guest_leads_pickup_len check (char_length(btrim(pickup_address)) between 4 and 240),
  constraint guest_leads_dropoff_len check (char_length(btrim(dropoff_address)) between 4 and 240),
  constraint guest_leads_product_len check (char_length(product) between 1 and 120),
  constraint guest_leads_website_empty check (website = ''),
  constraint guest_leads_legal check (pre_info_ok and withdraw_ok)
);

create index if not exists guest_leads_phone_created_idx
  on public.guest_leads (phone, created_at desc);

alter table public.guest_leads enable row level security;

revoke all on table public.guest_leads from public, anon, authenticated;
grant insert (full_name, phone, pickup_address, dropoff_address, distance_km, product, website, pre_info_ok, withdraw_ok)
  on table public.guest_leads to anon, authenticated;
grant select on table public.guest_leads to authenticated;

drop policy if exists guest_leads_insert_anon on public.guest_leads;
create policy guest_leads_insert_anon on public.guest_leads
  for insert to anon, authenticated
  with check (
    website = ''
    and pre_info_ok is true
    and withdraw_ok is true
    and char_length(btrim(full_name)) >= 2
    and char_length(btrim(pickup_address)) >= 4
    and char_length(btrim(dropoff_address)) >= 4
  );

drop policy if exists guest_leads_admin_select on public.guest_leads;
create policy guest_leads_admin_select on public.guest_leads
  for select to authenticated
  using (public.is_admin());

create or replace function public.guest_lead_guard()
returns trigger
language plpgsql
as $$
declare
  recent int;
begin
  if new.website is not null and btrim(new.website) <> '' then
    raise exception 'Geçersiz istek';
  end if;
  new.website := '';
  new.full_name := left(btrim(new.full_name), 80);
  new.phone := left(btrim(new.phone), 16);
  new.pickup_address := left(btrim(new.pickup_address), 240);
  new.dropoff_address := left(btrim(new.dropoff_address), 240);
  new.product := left(coalesce(nullif(btrim(new.product), ''), 'Kurye gönderisi'), 120);
  if new.pre_info_ok is not true or new.withdraw_ok is not true then
    raise exception 'Yasal onaylar zorunludur';
  end if;
  select count(*) into recent
    from public.guest_leads
   where phone = new.phone
     and created_at > now() - interval '10 minutes';
  if recent >= 3 then
    raise exception 'Çok sık istek. Lütfen birkaç dakika bekleyin.';
  end if;
  return new;
end;
$$;

drop trigger if exists guest_leads_guard on public.guest_leads;
create trigger guest_leads_guard
before insert on public.guest_leads
for each row execute function public.guest_lead_guard();
