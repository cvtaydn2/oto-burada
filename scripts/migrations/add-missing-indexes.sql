-- Migration: Add missing indexes for filter performance
-- Supabase SQL Editor'da çalıştırın

-- 1. car_trim index (filtreleme için kullanılıyor)
CREATE INDEX IF NOT EXISTS idx_listings_car_trim
  ON public.listings (car_trim)
  WHERE car_trim IS NOT NULL;

-- 2. tramer_amount index (maxTramer filtresi için)
CREATE INDEX IF NOT EXISTS idx_listings_tramer_amount
  ON public.listings (tramer_amount)
  WHERE tramer_amount IS NOT NULL;

-- 3. expert_inspection JSONB GIN index (hasExpertReport filtresi için)
CREATE INDEX IF NOT EXISTS idx_listings_expert_inspection_gin
  ON public.listings USING GIN (expert_inspection)
  WHERE expert_inspection IS NOT NULL;

-- 4. Composite index: status + created_at (en sık kullanılan sorgu)
CREATE INDEX IF NOT EXISTS idx_listings_status_created
  ON public.listings (status, created_at DESC);

-- 5. Composite index: status + bumped_at (öne çıkarma sıralaması için)
CREATE INDEX IF NOT EXISTS idx_listings_status_bumped
  ON public.listings (status, bumped_at DESC NULLS LAST);

-- 6. seller_id + status composite (dashboard listings için)
CREATE INDEX IF NOT EXISTS idx_listings_seller_status
  ON public.listings (seller_id, status);

-- Doğrulama
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE tablename = 'listings'
ORDER BY indexname;
