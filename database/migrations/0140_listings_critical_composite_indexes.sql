-- 0140_listings_critical_composite_indexes.sql
-- P1 performance hardening for marketplace/listing moderation paths

CREATE INDEX IF NOT EXISTS idx_listings_marketplace_approved_created_at
ON public.listings (created_at DESC)
WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_listings_filter_approved_brand_model_year_price
ON public.listings (brand, model, year, price)
WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_listings_seller_status
ON public.listings (seller_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_vin_unique_active
ON public.listings (vin)
WHERE vin IS NOT NULL
  AND btrim(vin) <> ''
  AND status IN ('pending', 'pending_ai_review', 'approved', 'flagged');

CREATE INDEX IF NOT EXISTS idx_listings_plate_active
ON public.listings (license_plate)
WHERE license_plate IS NOT NULL
  AND btrim(license_plate) <> '';
