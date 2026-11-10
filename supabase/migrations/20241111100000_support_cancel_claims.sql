-- kuryeler.tr — destek sohbeti, iptal kaydı, hasar/şikayet, uygulama içi bildirim
-- Canlıya uygulamayın; yalnızca dosya. Bot entegrasyonu: support_messages.sender = 'bot'.

alter table public.orders add column if not exists recipient_phone text not null default '';
alter table public.orders add column if not exists duration_min numeric(8, 2) not null default 0;
alter table public.orders add column if not exists cancel_reason text not null default '';
alter table public.orders add column if not exists cancelled_by uuid references public.profiles (id);

do $$ begin
  create type public.support_ticket_kind as enum (
    'destek', 'siparis', 'hasar', 'kayip', 'sikayet', 'iptal'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.support_ticket_status as enum (
    'acik', 'cevap_bekliyor', 'yanitlandi', 'kapali'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.support_sender as enum ('customer', 'admin', 'bot');
exception when duplicate_object then null;
end $$;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id),
  order_id uuid references public.orders (id) on delete set null,
  tracking_code text not null default '',
  kind public.support_ticket_kind not null default 'destek',
  status public.support_ticket_status not null default 'acik',
  subject text not null default 'Destek',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  sender public.support_sender not null,
  sender_id uuid references public.profiles (id),
  body text not null,
  photo_url text,
  created_at timestamptz not null default now(),
  check (char_length(body) between 1 and 4000),
  check (photo_url is null or char_length(photo_url) < 600000)
);

create table if not exists public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  order_id uuid references public.orders (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_customer_idx on public.support_tickets (customer_id, created_at desc);
create index if not exists support_tickets_status_idx on public.support_tickets (status, created_at desc);
create index if not exists support_messages_ticket_idx on public.support_messages (ticket_id, created_at);
create index if not exists in_app_notifications_user_idx on public.in_app_notifications (user_id, created_at desc);

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.in_app_notifications enable row level security;

drop policy if exists support_tickets_select on public.support_tickets;
create policy support_tickets_select on public.support_tickets
  for select to authenticated
  using (customer_id = auth.uid() or public.is_admin());

drop policy if exists support_tickets_insert on public.support_tickets;
create policy support_tickets_insert on public.support_tickets
  for insert to authenticated
  with check (
    customer_id = auth.uid()
    and public.current_role() in ('customer', 'admin')
    and kind in ('destek', 'siparis', 'hasar', 'kayip', 'sikayet')
  );

drop policy if exists support_tickets_update_admin on public.support_tickets;
create policy support_tickets_update_admin on public.support_tickets
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists support_messages_select on public.support_messages;
create policy support_messages_select on public.support_messages
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.customer_id = auth.uid()
    )
  );

drop policy if exists support_messages_insert_customer on public.support_messages;
create policy support_messages_insert_customer on public.support_messages
  for insert to authenticated
  with check (
    sender = 'customer'
    and sender_id = auth.uid()
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id
        and t.customer_id = auth.uid()
        and t.status <> 'kapali'
    )
  );

drop policy if exists support_messages_insert_staff on public.support_messages;
create policy support_messages_insert_staff on public.support_messages
  for insert to authenticated
  with check (
    public.is_admin()
    and sender in ('admin', 'bot')
  );

drop policy if exists in_app_notifications_select on public.in_app_notifications;
create policy in_app_notifications_select on public.in_app_notifications
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists in_app_notifications_update on public.in_app_notifications;
create policy in_app_notifications_update on public.in_app_notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on table public.support_tickets from anon;
grant select, insert on table public.support_tickets to authenticated;
grant update on table public.support_tickets to authenticated;

revoke all on table public.support_messages from anon;
grant select, insert on table public.support_messages to authenticated;

revoke all on table public.in_app_notifications from anon;
grant select, update on table public.in_app_notifications to authenticated;

create or replace function public.notify_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  title text;
  body text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  if new.status = 'assigned' then
    title := 'Kurye atandı';
    body := 'Kurye atandı, alıma gidiyor.';
  elsif new.status = 'picked_up' then
    title := 'Paket alındı';
    body := 'Siparişiniz kurye tarafından alındı.';
  elsif new.status = 'en_route' then
    title := 'Yola çıktı';
    body := 'Siparişiniz yola çıktı. Tahmini süre trafiğe göre değişebilir.';
  elsif new.status = 'delivered' then
    title := 'Teslim edildi';
    body := 'Siparişiniz teslim edildi.';
  elsif new.status = 'cancelled' then
    title := 'İptal';
    body := 'Siparişiniz iptal edildi.';
  else
    return new;
  end if;
  insert into public.in_app_notifications (user_id, title, body, order_id)
  values (new.customer_id, title, body, new.id);
  return new;
end;
$$;

drop trigger if exists orders_notify_status on public.orders;
create trigger orders_notify_status
after update of status on public.orders
for each row execute function public.notify_order_status();

create or replace function public.cancel_own_order(p_order_id uuid, p_reason text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.orders;
  reason text := btrim(coalesce(p_reason, ''));
begin
  if auth.uid() is null then
    raise exception 'Giriş yapmalısınız';
  end if;
  select * into rec from public.orders where id = p_order_id;
  if rec.id is null then
    raise exception 'Sipariş bulunamadı';
  end if;
  if rec.customer_id is distinct from auth.uid() then
    raise exception 'Yalnızca kendi siparişinizi iptal edebilirsiniz';
  end if;
  if rec.status in ('delivered', 'cancelled') then
    raise exception 'Bu sipariş artık iptal edilemez';
  end if;
  if not public.can_transition_status(rec.status, 'cancelled') then
    raise exception 'Bu durum geçişi geçersiz';
  end if;
  if char_length(reason) > 1000 then
    reason := left(reason, 1000);
  end if;

  update public.orders
     set status = 'cancelled',
         cancelled_at = now(),
         cancel_reason = reason,
         cancelled_by = auth.uid()
   where id = p_order_id
  returning * into rec;

  insert into public.support_tickets (
    customer_id, order_id, tracking_code, kind, status, subject
  ) values (
    rec.customer_id, rec.id, rec.tracking_code, 'iptal', 'acik',
    'İptal · ' || rec.tracking_code
  );

  insert into public.support_messages (ticket_id, sender, sender_id, body)
  values (
    (select id from public.support_tickets where order_id = rec.id and kind = 'iptal' order by created_at desc limit 1),
    'customer',
    auth.uid(),
    case when reason = '' then 'Müşteri iptal talebi.' else reason end
  );

  return rec;
end;
$$;

revoke all on function public.cancel_own_order(uuid, text) from public, anon;
grant execute on function public.cancel_own_order(uuid, text) to authenticated;

create or replace function public.open_support_ticket(
  p_kind public.support_ticket_kind,
  p_body text,
  p_order_id uuid default null,
  p_tracking_code text default '',
  p_photo text default null
)
returns public.support_tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.support_tickets;
  own public.orders;
  code text := upper(btrim(coalesce(p_tracking_code, '')));
  kind public.support_ticket_kind := p_kind;
  body text := btrim(coalesce(p_body, ''));
begin
  if auth.uid() is null then
    raise exception 'Giriş yapmalısınız';
  end if;
  if public.current_role() not in ('customer', 'admin') then
    raise exception 'Yetkisiz';
  end if;
  if kind not in ('destek', 'siparis', 'hasar', 'kayip', 'sikayet') then
    raise exception 'Geçersiz kayıt türü';
  end if;
  if char_length(body) < 4 then
    raise exception 'Mesajınızı biraz daha ayrıntılı yazın.';
  end if;
  if p_order_id is not null then
    select * into own from public.orders where id = p_order_id and customer_id = auth.uid();
    if own.id is null then
      raise exception 'Bu sipariş size ait değil';
    end if;
    code := own.tracking_code;
  elsif code <> '' then
    select * into own from public.orders where tracking_code = code and customer_id = auth.uid();
    if own.id is null then
      raise exception 'Bu iş kodu size ait değil';
    end if;
    p_order_id := own.id;
  end if;
  if kind in ('hasar', 'kayip') and coalesce(p_photo, '') = '' then
    raise exception 'Hasar ve kayıp için fotoğraf ekleyin.';
  end if;

  insert into public.support_tickets (
    customer_id, order_id, tracking_code, kind, status, subject
  ) values (
    auth.uid(), p_order_id, code, kind, 'cevap_bekliyor',
    case
      when code <> '' then initcap(kind::text) || ' · ' || code
      else initcap(kind::text)
    end
  )
  returning * into rec;

  insert into public.support_messages (ticket_id, sender, sender_id, body, photo_url)
  values (rec.id, 'customer', auth.uid(), body, nullif(p_photo, ''));

  return rec;
end;
$$;

revoke all on function public.open_support_ticket(public.support_ticket_kind, text, uuid, text, text) from public, anon;
grant execute on function public.open_support_ticket(public.support_ticket_kind, text, uuid, text, text) to authenticated;

create or replace function public.touch_support_ticket_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sender = 'customer' then
    update public.support_tickets
       set status = 'cevap_bekliyor'
     where id = new.ticket_id and status <> 'kapali';
  else
    update public.support_tickets
       set status = 'yanitlandi'
     where id = new.ticket_id and status <> 'kapali';
  end if;
  return new;
end;
$$;

drop trigger if exists support_messages_touch_ticket on public.support_messages;
create trigger support_messages_touch_ticket
after insert on public.support_messages
for each row execute function public.touch_support_ticket_on_message();

do $$ begin
  alter publication supabase_realtime add table public.support_tickets;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.support_messages;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.in_app_notifications;
exception when duplicate_object then null;
end $$;
