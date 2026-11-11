-- Şerif 11:21: teslim süreleri müşteriye açılsın. Önceki migration'a dokunulmaz.

alter table public.pricing_settings
  alter column delivery_targets_public set default true;

update public.pricing_settings
set delivery_targets_public = true
where id = 1;
