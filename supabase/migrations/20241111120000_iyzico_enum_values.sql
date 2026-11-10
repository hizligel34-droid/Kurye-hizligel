-- iyzico: enum değerleri (aynı işlemde kullanılamaz; sonraki migration kullanır)

alter type public.order_status add value if not exists 'confirmed';
alter type public.payment_method add value if not exists 'iyzico';
