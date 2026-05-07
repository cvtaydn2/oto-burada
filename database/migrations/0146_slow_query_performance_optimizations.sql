-- Migration: 0146_slow_query_performance_optimizations.sql
-- Applied: 2026-05-07
-- Purpose:
--   1. Create partial index on active profiles to bypass low-cardinality boolean indexing issues.
--   2. Create partial composite sort index on listings to accelerate homepage ranking queries.
--   3. Create composite lookup index on listing_images for optimized lateral joins.
--   4. Create index on api_rate_limits(reset_at) to accelerate per-minute pg_cron cleanups.
--   5. Re-schedule pg_cron cleanup to run every minute instead of every 10 minutes to avoid table bloat.

-- 1. Profiles active partial index
CREATE INDEX IF NOT EXISTS idx_profiles_active 
  ON public.profiles(id) 
  WHERE is_banned = false;

-- 2. Listings marketplace composite sort index
CREATE INDEX IF NOT EXISTS idx_listings_marketplace_active_sort
  ON public.listings (top_rank_until DESC NULLS LAST, homepage_showcase_until DESC NULLS LAST, created_at DESC)
  WHERE status = 'approved';

-- 3. Listing images lookup index
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_order
  ON public.listing_images (listing_id, sort_order ASC, id ASC);

-- 4. Rate limit cleanup index
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_reset_at
  ON public.api_rate_limits (reset_at);

-- 5. Re-schedule pg_cron cleanup every minute
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule previous 10-minute job if exists
    BEGIN
      PERFORM cron.unschedule('cleanup-rate-limits');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    -- Schedule new 1-minute job
    PERFORM cron.schedule(
      'cleanup-rate-limits',
      '* * * * *',
      'SELECT public.cleanup_expired_rate_limits()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
