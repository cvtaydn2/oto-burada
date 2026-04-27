-- Phase 48: Ensure listing doping/showcase columns exist on drifted environments.
-- Safe to run multiple times (idempotent) and designed for free-tier environments
-- where earlier migrations may have been skipped.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS small_photo_until timestamptz,
  ADD COLUMN IF NOT EXISTS homepage_showcase_until timestamptz,
  ADD COLUMN IF NOT EXISTS category_showcase_until timestamptz,
  ADD COLUMN IF NOT EXISTS top_rank_until timestamptz,
  ADD COLUMN IF NOT EXISTS detailed_search_showcase_until timestamptz,
  ADD COLUMN IF NOT EXISTS bold_frame_until timestamptz;

-- Keep read paths fast if these columns are used for ordering/filtering.
CREATE INDEX IF NOT EXISTS idx_listings_small_photo_until
  ON public.listings (small_photo_until DESC)
  WHERE small_photo_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_homepage_showcase_until
  ON public.listings (homepage_showcase_until DESC)
  WHERE homepage_showcase_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_top_rank_until
  ON public.listings (top_rank_until DESC)
  WHERE top_rank_until IS NOT NULL;
