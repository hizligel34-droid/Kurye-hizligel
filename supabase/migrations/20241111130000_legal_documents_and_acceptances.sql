-- Avukat taslak metinleri: sürüm tablosu, kabul kaydı, rıza. TCKN sütunu yoktur.
-- Teslim süresi tablosu müşteriye kapalı (delivery_targets_public varsayılan false).

alter table public.pricing_settings
  add column if not exists delivery_targets_public boolean not null default false;

update public.pricing_settings
set delivery_targets_public = false
where id = 1;

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  doc_key text not null,
  version text not null default '?',
  title text not null,
  body_markdown text not null,
  content_sha256 text not null,
  locale text not null default 'tr',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (doc_key, version)
);

create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  doc_id uuid references public.legal_documents (id) on delete set null,
  doc_key text not null,
  version text not null,
  content_sha256 text not null,
  checkbox_key text not null,
  ui_locale text not null default 'tr',
  accepted_at timestamptz not null default now()
);

create index if not exists legal_acceptances_user_idx on public.legal_acceptances (user_id, accepted_at desc);
create index if not exists legal_acceptances_order_idx on public.legal_acceptances (order_id);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  purpose text not null,
  granted boolean not null default false,
  source text not null default 'web',
  granted_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists consents_user_idx on public.consents (user_id, purpose);

insert into public.legal_documents (doc_key, version, title, body_markdown, content_sha256, published_at)
values
  ('kunye', '?', 'Künye / Bilgilendirme', 'TASLAK – yayına alınmadı. Gövde: shared/legalTexts.ts', 'taslak', null),
  ('kvkk', '?', 'KVKK Aydınlatma Metni', 'TASLAK – yayına alınmadı. Gövde: shared/legalTexts.ts', 'taslak', null),
  ('cerez', '?', 'Çerez ve yerel depolama', 'TASLAK – yayına alınmadı. Gövde: shared/legalTexts.ts', 'taslak', null),
  ('on_bilgi', '?', 'Ön Bilgilendirme Formu', 'TASLAK – yayına alınmadı. Gövde: shared/legalTexts.ts', 'taslak', null),
  ('mesafeli', '?', 'Mesafeli Hizmet Sözleşmesi', 'TASLAK – yayına alınmadı. Gövde: shared/legalTexts.ts', 'taslak', null),
  ('kosullar', '?', 'Kullanım Koşulları', 'TASLAK – yayına alınmadı. Gövde: shared/legalTexts.ts', 'taslak', null),
  ('kurye_soz', '?', 'Kurye Kullanıcı Sözleşmesi', 'TASLAK – yayına alınmadı. Gövde: shared/legalTexts.ts', 'taslak', null),
  ('gonderici_soz', '?', 'Gönderici / İşletmeci Sözleşmesi', 'TASLAK – yayına alınmadı. Gövde: shared/legalTexts.ts', 'taslak', null),
  ('aracilik', '?', 'Aracılık ve şikâyet', 'TASLAK – yayına alınmadı. Gövde: shared/legalTexts.ts', 'taslak', null),
  ('odeme', '?', 'Ödeme bilgisi', 'TASLAK – yayına alınmadı. Gövde: shared/legalTexts.ts', 'taslak', null),
  ('islem_rehberi', '?', 'İşlem rehberi', 'TASLAK – yayına alınmadı. Gövde: shared/legalTexts.ts', 'taslak', null)
on conflict (doc_key, version) do nothing;

alter table public.legal_documents enable row level security;
alter table public.legal_acceptances enable row level security;
alter table public.consents enable row level security;

drop policy if exists legal_documents_select on public.legal_documents;
create policy legal_documents_select on public.legal_documents
  for select to anon, authenticated
  using (true);

drop policy if exists legal_documents_admin_write on public.legal_documents;
create policy legal_documents_admin_write on public.legal_documents
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists legal_acceptances_select_own on public.legal_acceptances;
create policy legal_acceptances_select_own on public.legal_acceptances
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists legal_acceptances_insert_own on public.legal_acceptances;
create policy legal_acceptances_insert_own on public.legal_acceptances
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists consents_select_own on public.consents;
create policy consents_select_own on public.consents
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists consents_insert_own on public.consents;
create policy consents_insert_own on public.consents
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists consents_update_own on public.consents;
create policy consents_update_own on public.consents
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

revoke all on table public.legal_documents from public, anon, authenticated;
grant select on table public.legal_documents to anon, authenticated;

revoke all on table public.legal_acceptances from public, anon, authenticated;
grant select, insert on table public.legal_acceptances to authenticated;

revoke all on table public.consents from public, anon, authenticated;
grant select, insert, update on table public.consents to authenticated;

create or replace function public.record_legal_acceptance(
  p_doc_key text,
  p_version text,
  p_content_sha256 text,
  p_checkbox_key text,
  p_order_id uuid default null,
  p_ui_locale text default 'tr'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_doc_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Giriş gerekli';
  end if;
  select id into v_doc_id
  from public.legal_documents
  where doc_key = p_doc_key and version = p_version
  order by created_at desc
  limit 1;
  insert into public.legal_acceptances (
    user_id, order_id, doc_id, doc_key, version, content_sha256, checkbox_key, ui_locale
  ) values (
    auth.uid(), p_order_id, v_doc_id, p_doc_key, p_version, p_content_sha256, p_checkbox_key, coalesce(p_ui_locale, 'tr')
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.record_legal_acceptance(text, text, text, text, uuid, text) from public, anon;
grant execute on function public.record_legal_acceptance(text, text, text, text, uuid, text) to authenticated;
