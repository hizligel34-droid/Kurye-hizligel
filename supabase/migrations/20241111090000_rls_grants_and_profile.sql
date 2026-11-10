-- kuryeler.tr — PR #4 RLS hardening üzerine takip (canlıya uygulamayın; yalnızca dosya)
-- A#7 / A#8 / A#15-16 / profil rol kilidi
-- orders doğrudan UPDATE kalkar; kurye açık iş RPC; kamu takipte ürün yok;
-- kurye self-signup kapalı (Şerif açarsa allow_courier_self_signup true).

drop policy if exists orders_update_limited on public.orders;
revoke all on table public.orders from anon;
revoke update, delete on table public.orders from authenticated;
grant select, insert on table public.orders to authenticated;

-- Profil: kullanıcı kendi rolünü yükseltemez (sütun + tetikleyici).
create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Rol yalnızca yönetici tarafından değiştirilebilir';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_self_role on public.profiles;
create trigger profiles_prevent_self_role
before update of role on public.profiles
for each row execute function public.prevent_self_role_escalation();

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (
    (
      id = auth.uid()
      and role = public.current_role()
      and public.current_role() is not null
    )
    or public.is_admin()
  );

revoke update on table public.profiles from authenticated;
grant update (full_name, phone, is_online) on table public.profiles to authenticated;

create or replace function public.set_user_role(p_user_id uuid, p_role public.user_role)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Yalnızca yönetici rol atayabilir';
  end if;
  update public.profiles
     set role = p_role
   where id = p_user_id
  returning * into rec;
  if rec.id is null then
    raise exception 'Kullanıcı bulunamadı';
  end if;
  return rec;
end;
$$;

revoke all on function public.set_user_role(uuid, public.user_role) from public, anon;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;

-- Şerif kararı: kurye kendi kaydı kapalı. Açmak için true dönün.
create or replace function public.allow_courier_self_signup()
returns boolean
language sql
immutable
as $$
  select false;
$$;

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
  if requested = 'courier' and public.allow_courier_self_signup() then
    assigned := 'courier';
  else
    assigned := 'customer';
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

alter table public.orders add column if not exists duration_min numeric(8, 2) not null default 0;

drop function if exists public.track_order_public(text);
create function public.track_order_public(p_code text)
returns table (
  tracking_code text,
  status public.order_status,
  bolge text,
  pickup_district text,
  dropoff_district text,
  pickup_address text,
  dropoff_address text,
  distance_km numeric,
  duration_min numeric,
  created_at timestamptz,
  updated_at timestamptz,
  delivered_at timestamptz,
  delivery_photo text
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
           o.pickup_address, o.dropoff_address, o.distance_km, o.duration_min,
           o.created_at, o.updated_at, o.delivered_at, o.delivery_photo
    from public.orders o
    where o.tracking_code = upper(btrim(p_code));
end;
$$;

revoke all on function public.track_order_public(text) from public;
grant execute on function public.track_order_public(text) to anon, authenticated;

drop function if exists public.list_courier_open_jobs();
create function public.list_courier_open_jobs()
returns table (
  id uuid,
  tracking_code text,
  status public.order_status,
  pickup_district text,
  dropoff_district text,
  bolge text,
  distance_km numeric,
  duration_min numeric,
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
           o.distance_km, o.duration_min, o.net_price_tl, o.vat_tl, o.total_price_tl, o.weight_kg, o.created_at
    from public.orders o
    where o.status = 'pending' and o.courier_id is null
    order by o.created_at desc;
end;
$$;

revoke all on function public.list_courier_open_jobs() from public, anon;
grant execute on function public.list_courier_open_jobs() to authenticated;

create table if not exists public.outbound_mail_queue (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  recipient_email text not null,
  template text not null default 'order_confirmation',
  body text not null default '',
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.outbound_mail_queue enable row level security;

drop policy if exists outbound_mail_select_own on public.outbound_mail_queue;
create policy outbound_mail_select_own on public.outbound_mail_queue
  for select to authenticated
  using (recipient_user_id = auth.uid() or public.is_admin());

revoke all on table public.outbound_mail_queue from anon, authenticated;
grant select on table public.outbound_mail_queue to authenticated;

drop function if exists public.queue_order_confirmation(text, text, text, jsonb);
drop function if exists public.queue_order_confirmation(uuid);
create function public.queue_order_confirmation(p_order_id uuid)
returns public.outbound_mail_queue
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.orders;
  mail public.outbound_mail_queue;
  own_email text;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapmalısınız';
  end if;
  select * into rec from public.orders where id = p_order_id;
  if rec.id is null then
    raise exception 'Sipariş bulunamadı';
  end if;
  if rec.customer_id is distinct from auth.uid() then
    raise exception 'Onay kuyruğu yalnızca sipariş sahibine yazılır';
  end if;
  select email into own_email from auth.users where id = auth.uid();
  if own_email is null or btrim(own_email) = '' then
    raise exception 'Hesap e-postası bulunamadı';
  end if;
  insert into public.outbound_mail_queue (
    order_id, recipient_user_id, recipient_email, template, body
  ) values (
    rec.id,
    rec.customer_id,
    lower(btrim(own_email)),
    'order_confirmation',
    'Sipariş alındı · ' || rec.tracking_code
  )
  returning * into mail;
  return mail;
end;
$$;

revoke all on function public.queue_order_confirmation(uuid) from public, anon;
grant execute on function public.queue_order_confirmation(uuid) to authenticated;
