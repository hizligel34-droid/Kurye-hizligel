-- Hedef teslim kademeleri (yol km). Canlıya uygulamayın; yalnızca dosya.
-- Varsayılan: 5→60 dk, 20→2 saat, 40→3 saat, 100→4 saat, üzeri aynı gün.

alter table public.pricing_settings
  add column if not exists delivery_target_tiers jsonb not null default '[
    {"maxKm": 5, "label": "60 dakika"},
    {"maxKm": 20, "label": "2 saat"},
    {"maxKm": 40, "label": "3 saat"},
    {"maxKm": 100, "label": "4 saat"},
    {"maxKm": null, "label": "aynı gün"}
  ]'::jsonb;

update public.pricing_settings
set delivery_target_tiers = '[
    {"maxKm": 5, "label": "60 dakika"},
    {"maxKm": 20, "label": "2 saat"},
    {"maxKm": 40, "label": "3 saat"},
    {"maxKm": 100, "label": "4 saat"},
    {"maxKm": null, "label": "aynı gün"}
  ]'::jsonb
where id = 1
  and (
    delivery_target_tiers is null
    or jsonb_typeof(delivery_target_tiers) <> 'array'
    or jsonb_array_length(delivery_target_tiers) = 0
  );
