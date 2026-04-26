-- Migration: 0105_optimized_listing_stats
-- Purpose: Reduce DB round-trips for listing quota checks.

CREATE OR REPLACE FUNCTION public.get_user_listing_stats(
  p_user_id uuid,
  p_start_of_month timestamptz,
  p_start_of_year timestamptz
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*) FILTER (WHERE status <> 'archived'),
    'monthly', COUNT(*) FILTER (WHERE status <> 'archived' AND created_at >= p_start_of_month),
    'yearly', COUNT(*) FILTER (WHERE status <> 'archived' AND created_at >= p_start_of_year)
  ) INTO v_result
  FROM public.listings
  WHERE seller_id = p_user_id;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_listing_stats(uuid, timestamptz, timestamptz) TO authenticated, service_role;

COMMENT ON FUNCTION public.get_user_listing_stats IS 
  'Returns total, monthly, and yearly listing counts for a user in a single optimized DB round-trip.';
