-- Migration: 0071_atomic_doping_expiry.sql
-- Goal: Ensure doping expiry is atomic to prevent race conditions during purchase/expiry overlaps.

-- ══════════════════════════════════════════════════════════════════════════════
-- PART 1: Atomic Expiry Function
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.expire_dopings_atomic()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := timezone('utc', now());
  v_featured_count int;
  v_urgent_count int;
  v_highlighted_count int;
  v_purchases_count int;
BEGIN
  -- 1. Expire featured dopings
  WITH expired AS (
    UPDATE listings
    SET 
      featured = false,
      is_featured = false,
      featured_until = NULL,
      updated_at = v_now
    WHERE featured = true
      AND featured_until IS NOT NULL
      AND featured_until < v_now
    RETURNING id
  ) SELECT count(*) INTO v_featured_count FROM expired;

  -- 2. Expire urgent dopings
  WITH expired AS (
    UPDATE listings
    SET 
      is_urgent = false,
      urgent_until = NULL,
      updated_at = v_now
    WHERE is_urgent = true
      AND urgent_until IS NOT NULL
      AND urgent_until < v_now
    RETURNING id
  ) SELECT count(*) INTO v_urgent_count FROM expired;

  -- 3. Expire highlighted dopings
  WITH expired AS (
    UPDATE listings
    SET 
      highlighted_until = NULL,
      frame_color = NULL,
      updated_at = v_now
    WHERE highlighted_until IS NOT NULL
      AND highlighted_until < v_now
    RETURNING id
  ) SELECT count(*) INTO v_highlighted_count FROM expired;

  -- 4. Mark doping purchases as expired
  WITH expired AS (
    UPDATE doping_purchases
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at < v_now
    RETURNING id
  ) SELECT count(*) INTO v_purchases_count FROM expired;

  RETURN jsonb_build_object(
    'success', true,
    'timestamp', v_now,
    'counts', jsonb_build_object(
      'featured', v_featured_count,
      'urgent', v_urgent_count,
      'highlighted', v_highlighted_count,
      'purchases', v_purchases_count
    )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.expire_dopings_atomic() TO service_role;

-- ══════════════════════════════════════════════════════════════════════════════
-- PART 2: Update pg_cron to use the atomic function
-- ══════════════════════════════════════════════════════════════════════════════

-- Unschedule old cron
SELECT cron.unschedule('expire-dopings-v2') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'expire-dopings-v2'
);

-- Schedule new atomic cron
SELECT cron.schedule(
  'expire-dopings-atomic',
  '0 * * * *', -- Every hour
  $$ SELECT public.expire_dopings_atomic(); $$
);
