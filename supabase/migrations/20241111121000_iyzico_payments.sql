-- iyzico ödemeleri, teslimde fatura kaydı, esnaf künye (business_profile)
-- Kart PAN/CVV saklanmaz. TCKN sütunu yoktur. VKN loglanmaz.

create table if not exists public.business_profile (
  id int primary key default 1 check (id = 1),
  legal_name text not null,
  owner_name text not null default '?',
  trader_kind text not null default 'esnaf' check (trader_kind in ('esnaf', 'tacir')),
  tax_office text not null default '?',
  tax_id text not null default '?',
  mersis text not null default '?',
  trade_registry_no text not null default '?',
  address text not null,
  phone text not null,
  email text not null default '?',
  kep text not null default '?',
  chamber text not null default '?',
  trademark_note text not null default 'Marka: kuryeler.tr (başvuru no 2026/088618 – tescil süreci devam ediyor)',
  kvkk_effective text not null default '[TARİH]',
  retention_orders_years text not null default '[X]',
  retention_photo_months text not null default '[X]',
  updated_at timestamptz not null default now()
);

insert into public.business_profile (
  id, legal_name, owner_name, trader_kind, tax_office, tax_id, mersis,
  address, phone, email, kep, chamber
) values (
  1,
  'Canan Tekin Organizasyon ve Kurye Hizmetleri',
  'Canan Tekin',
  'esnaf',
  '?',
  '?',
  '?',
  'Büyük Beşiktaş Çarşısı, Ortabahçe Caddesi No: 10, Kat 1, No: 143, Beşiktaş/İstanbul',
  '0532 474 67 45',
  '?',
  '?',
  '?'
)
on conflict (id) do update set
  legal_name = excluded.legal_name,
  owner_name = excluded.owner_name,
  trader_kind = excluded.trader_kind,
  address = excluded.address,
  phone = excluded.phone;

alter table public.business_profile enable row level security;

drop policy if exists business_profile_select on public.business_profile;
create policy business_profile_select on public.business_profile
  for select to anon, authenticated
  using (true);

revoke all on table public.business_profile from public, anon, authenticated;
grant select on table public.business_profile to anon, authenticated;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  amount_kurus integer not null check (amount_kurus > 0),
  net_kurus integer not null check (net_kurus >= 0),
  vat_kurus integer not null check (vat_kurus >= 0),
  currency text not null default 'TRY' check (currency = 'TRY'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  iyzico_payment_id text,
  iyzico_token text,
  conversation_id text not null,
  payment_group text not null default 'LISTING',
  iyzi_commission_rate_amount_kurus integer,
  iyzi_commission_fee_kurus integer,
  iyzi_commission_total_kurus integer,
  -- TODO(pazar-yeri): sub_merchant_key, sub_merchant_price_kurus, withholding_tax_kurus
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_idx on public.payments (order_id, created_at desc);
create index if not exists payments_token_idx on public.payments (iyzico_token);
create unique index if not exists payments_conversation_idx on public.payments (conversation_id);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = payments.order_id
        and (o.customer_id = auth.uid() or public.current_role() = 'admin')
    )
  );

revoke all on table public.payments from public, anon, authenticated;
grant select on table public.payments to authenticated;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  payment_id uuid references public.payments (id),
  fatura_no text,
  uuid text,
  tur text check (tur in ('e_arsiv', 'e_fatura')),
  kesim_zamani timestamptz,
  durum text not null default 'kesilecek' check (durum in ('kesilecek', 'kesildi', 'iptal', 'duzeltme_gerekli')),
  delivered_at timestamptz not null,
  alarm_at timestamptz not null,
  deadline_at timestamptz not null,
  refund_admin_required boolean not null default false,
  invoice_cancel_window_days integer not null default 8,
  accounting_correction_required boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists invoices_order_idx on public.invoices (order_id);
create index if not exists invoices_alarm_idx on public.invoices (durum, alarm_at);
create index if not exists invoices_deadline_idx on public.invoices (durum, deadline_at);

alter table public.invoices enable row level security;

drop policy if exists invoices_select_own on public.invoices;
create policy invoices_select_own on public.invoices
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = invoices.order_id
        and (o.customer_id = auth.uid() or public.current_role() = 'admin')
    )
  );

revoke all on table public.invoices from public, anon, authenticated;
grant select on table public.invoices to authenticated;

create or replace function public.can_transition_status(from_status public.order_status, to_status public.order_status)
returns boolean
language sql
immutable
as $$
  select case
    when from_status = to_status then true
    when from_status = 'pending' then to_status in ('confirmed', 'assigned', 'cancelled')
    when from_status = 'confirmed' then to_status in ('assigned', 'cancelled')
    when from_status = 'assigned' then to_status in ('picked_up', 'cancelled')
    when from_status = 'picked_up' then to_status in ('en_route', 'cancelled')
    when from_status = 'en_route' then to_status in ('delivered', 'cancelled')
    else false
  end;
$$;

create or replace function public.queue_invoice_on_delivered()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'delivered' and (old.status is distinct from 'delivered') then
    insert into public.invoices (
      order_id, payment_id, durum, delivered_at, alarm_at, deadline_at
    )
    select
      new.id,
      (
        select p.id from public.payments p
        where p.order_id = new.id and p.status = 'paid'
        order by p.created_at desc
        limit 1
      ),
      'kesilecek',
      coalesce(new.delivered_at, now()),
      coalesce(new.delivered_at, now()) + interval '5 days',
      coalesce(new.delivered_at, now()) + interval '7 days'
    on conflict (order_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_queue_invoice on public.orders;
create trigger orders_queue_invoice
after update of status on public.orders
for each row execute function public.queue_invoice_on_delivered();

create or replace function public.list_invoice_alerts()
returns table (
  invoice_id uuid,
  order_id uuid,
  tracking_code text,
  durum text,
  delivered_at timestamptz,
  alarm_at timestamptz,
  deadline_at timestamptz,
  past_alarm boolean,
  past_deadline boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.current_role() <> 'admin' then
    raise exception 'Yetkisiz';
  end if;
  return query
    select
      i.id,
      i.order_id,
      o.tracking_code,
      i.durum,
      i.delivered_at,
      i.alarm_at,
      i.deadline_at,
      (i.durum = 'kesilecek' and now() >= i.alarm_at) as past_alarm,
      (i.durum = 'kesilecek' and now() >= i.deadline_at) as past_deadline
    from public.invoices i
    join public.orders o on o.id = i.order_id
    where i.durum = 'kesilecek'
      and now() >= i.alarm_at
    order by i.deadline_at asc;
end;
$$;

revoke all on function public.list_invoice_alerts() from public, anon;
grant execute on function public.list_invoice_alerts() to authenticated;

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
    where o.courier_id is null
      and (
        (o.payment_method = 'iyzico' and o.status = 'confirmed' and o.payment_status = 'odendi')
        or (o.payment_method <> 'iyzico' and o.status = 'pending')
      )
    order by o.created_at desc;
end;
$$;

revoke all on function public.list_courier_open_jobs() from public, anon;
grant execute on function public.list_courier_open_jobs() to authenticated;

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
     and courier_id is null
     and (
       (status = 'confirmed' and payment_method = 'iyzico' and payment_status = 'odendi')
       or (status = 'pending' and payment_method <> 'iyzico')
     )
  returning * into rec;

  if rec.id is null then
    raise exception 'İş artık müsait değil';
  end if;
  return rec;
end;
$$;

create or replace function public.mark_iyzico_payment_result(
  p_payment_id uuid,
  p_status text,
  p_iyzico_payment_id text,
  p_commission_rate_kurus integer,
  p_commission_fee_kurus integer
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.payments;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role'
     and coalesce(auth.role(), '') <> 'service_role' then
    if auth.uid() is null then
      null;
    end if;
  end if;

  update public.payments
     set status = p_status,
         iyzico_payment_id = coalesce(p_iyzico_payment_id, iyzico_payment_id),
         iyzi_commission_rate_amount_kurus = p_commission_rate_kurus,
         iyzi_commission_fee_kurus = p_commission_fee_kurus,
         iyzi_commission_total_kurus = coalesce(p_commission_rate_kurus, 0) + coalesce(p_commission_fee_kurus, 0)
   where id = p_payment_id
  returning * into rec;

  if rec.id is null then
    raise exception 'Ödeme bulunamadı';
  end if;

  if p_status = 'paid' then
    update public.orders
       set status = 'confirmed',
           payment_status = 'odendi',
           payment_method = 'iyzico'
     where id = rec.order_id
       and status = 'pending';
  end if;

  return rec;
end;
$$;

revoke all on function public.mark_iyzico_payment_result(uuid, text, text, integer, integer) from public, anon, authenticated;

create or replace function public.request_payment_refund(p_order_id uuid)
returns table (
  action text,
  admin_required boolean,
  accounting_correction_required boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invoices;
  me uuid := auth.uid();
  my_role public.user_role;
begin
  if me is null then
    raise exception 'Giriş yapmalısınız';
  end if;
  select role into my_role from public.profiles where id = me;
  if my_role not in ('customer', 'admin') then
    raise exception 'Yetkisiz';
  end if;
  if my_role = 'customer' and not exists (
    select 1 from public.orders o where o.id = p_order_id and o.customer_id = me
  ) then
    raise exception 'Yalnızca kendi siparişiniz';
  end if;

  select * into inv from public.invoices where order_id = p_order_id;

  if inv.id is null then
    return query select 'cancel_or_refund'::text, false, false;
    return;
  end if;

  if inv.kesim_zamani is not null and now() > inv.kesim_zamani + (inv.invoice_cancel_window_days || ' days')::interval then
    update public.invoices
       set refund_admin_required = true,
           accounting_correction_required = true,
           durum = 'duzeltme_gerekli'
     where id = inv.id;
    return query select 'admin_accounting_correction'::text, true, true;
    return;
  end if;

  update public.invoices
     set refund_admin_required = true
   where id = inv.id;
  return query select 'admin_invoice_cancel'::text, true, false;
end;
$$;

revoke all on function public.request_payment_refund(uuid) from public, anon;
grant execute on function public.request_payment_refund(uuid) to authenticated;
