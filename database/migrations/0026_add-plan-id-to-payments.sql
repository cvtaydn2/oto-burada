-- Migration: payments tablosuna plan_id ve plan_name kolonları ekle
-- Description: Ödeme sistemi için paket ID ve isim alanları ekleniyor.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.pricing_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan_name TEXT;

COMMENT ON COLUMN public.payments.plan_id IS 'Satın alınan paket ID (ödeme sistemi aktif olduğunda doldurulur)';
COMMENT ON COLUMN public.payments.plan_name IS 'Satın alınan paket adı (snapshot)';
