-- Migration: 0042_listing_quota_atomic_check
-- Purpose: Atomic listing quota check using advisory lock to prevent race conditions.
--
-- Problem: The previous "check then insert" pattern in listing-limits.ts allowed
-- two concurrent requests to both pass the quota check before either inserted a row.
--
-- Solution: Use pg_try_advisory_xact_lock() to serialize quota checks per user.
-- The lock is automatically released at transaction end.

CREATE OR REPLACE FUNCTION check_listing_quota_atomic(
  p_user_id     UUID,
  p_monthly_limit INT DEFAULT 2,
  p_yearly_limit  INT DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_monthly_count INT;
  v_yearly_count  INT;
  v_start_of_month TIMESTAMPTZ;
  v_start_of_year  TIMESTAMPTZ;
  v_lock_key       BIGINT;
BEGIN
  -- Derive a stable per-user advisory lock key from the UUID
  v_lock_key := ('x' || substr(p_user_id::text, 1, 16))::bit(64)::bigint;

  -- Acquire an exclusive advisory lock for this user for the duration of the transaction.
  -- This serializes concurrent quota checks for the same user.
  PERFORM pg_advisory_xact_lock(v_lock_key);

  v_start_of_month := date_trunc('month', now() AT TIME ZONE 'UTC');
  v_start_of_year  := date_trunc('year',  now() AT TIME ZONE 'UTC');

  SELECT COUNT(*)
    INTO v_monthly_count
    FROM listings
   WHERE seller_id = p_user_id
     AND status    <> 'archived'
     AND created_at >= v_start_of_month;

  SELECT COUNT(*)
    INTO v_yearly_count
    FROM listings
   WHERE seller_id = p_user_id
     AND status    <> 'archived'
     AND created_at >= v_start_of_year;

  IF v_monthly_count >= p_monthly_limit THEN
    RETURN json_build_object(
      'allowed',        false,
      'reason',         format('Bu ay zaten %s ilan verdin. Gelecek ay tekrar deneyebilirsin.', p_monthly_limit),
      'monthly_count',  v_monthly_count,
      'yearly_count',   v_yearly_count
    );
  END IF;

  IF v_yearly_count >= p_yearly_limit THEN
    RETURN json_build_object(
      'allowed',        false,
      'reason',         format('Bu yıl zaten %s ilan verdin. Gelecek yıl tekrar deneyebilirsin.', p_yearly_limit),
      'monthly_count',  v_monthly_count,
      'yearly_count',   v_yearly_count
    );
  END IF;

  RETURN json_build_object(
    'allowed',        true,
    'reason',         null,
    'monthly_count',  v_monthly_count,
    'yearly_count',   v_yearly_count
  );
END;
$$;

-- Grant execute to the service_role (used by admin client)
GRANT EXECUTE ON FUNCTION check_listing_quota_atomic(UUID, INT, INT) TO service_role;

COMMENT ON FUNCTION check_listing_quota_atomic IS
  'Atomically checks listing quota for a user using an advisory lock. '
  'Prevents race conditions where two concurrent requests both pass the quota check.';
