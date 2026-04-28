-- Migration: 0116_add_listing_quota_to_pricing_plans
-- Purpose: Add listing_quota column to pricing_plans for consistent quota display.

ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS listing_quota integer NOT NULL DEFAULT 3;

UPDATE public.pricing_plans
SET listing_quota =
  CASE
    WHEN name ILIKE '%kurumsal%' OR name ILIKE '%corporate%' OR name ILIKE '%filo%' THEN 200
    WHEN name ILIKE '%pro%' OR name ILIKE '%profesyonel%' OR name ILIKE '%professional%' THEN 50
    ELSE 3
  END
WHERE listing_quota = 3 AND (
  name ILIKE '%kurumsal%' OR name ILIKE '%corporate%' OR name ILIKE '%filo%' OR
  name ILIKE '%pro%' OR name ILIKE '%profesyonel%' OR name ILIKE '%professional%'
);

ALTER TABLE public.pricing_plans
  ALTER COLUMN listing_quota SET DEFAULT 3;