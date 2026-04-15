-- Migration: Add expert_inspection column + missing indexes
-- Supabase SQL Editor'da çalıştırın

-- 1. expert_inspection kolonu ekle (schema.sql'de tanımlı ama DB'de yok)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS expert_inspection jsonb;

-- 2. car_trim index (filtreleme için)
CREATE INDEX IF NOT EXISTS idx_listings_car_trim
  ON public.listings (car_trim)
  WHERE car_trim IS NOT NULL;

-- 3. tramer_amount index (maxTramer filtresi için)
CREATE INDEX IF NOT EXISTS idx_listings_tramer_amount
  ON public.listings (tramer_amount)
  WHERE tramer_amount IS NOT NULL;

-- 4. expert_inspection GIN index (hasExpertReport filtresi için)
CREATE INDEX IF NOT EXISTS idx_listings_expert_inspection_gin
  ON public.listings USING GIN (expert_inspection)
  WHERE expert_inspection IS NOT NULL;

-- 5. status + created_at composite (en sık kullanılan sorgu)
CREATE INDEX IF NOT EXISTS idx_listings_status_created
  ON public.listings (status, created_at DESC);

-- 6. status + bumped_at composite (öne çıkarma sıralaması için)
CREATE INDEX IF NOT EXISTS idx_listings_status_bumped
  ON public.listings (status, bumped_at DESC NULLS LAST);

-- 7. seller_id + status composite (dashboard listings için)
CREATE INDEX IF NOT EXISTS idx_listings_seller_status
  ON public.listings (seller_id, status);

-- Doğrulama
SELECT indexname FROM pg_indexes
WHERE tablename = 'listings'
ORDER BY indexname;
