-- Migration: Analytics Performance Optimization RPCs
-- Purpose: Offload heavy counting and summing logic from Node.js memory to Postgres.

-- 1. Sum successful payments in range
CREATE OR REPLACE FUNCTION public.get_revenue_stats(p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS TABLE(total_amount NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.payments
  WHERE status = 'success'
    AND created_at >= p_start_date
    AND created_at < p_end_date;
$$;

-- 2. Daily listing creation trend
CREATE OR REPLACE FUNCTION public.get_daily_listing_trend(p_days INTEGER)
RETURNS TABLE(day DATE, count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT created_at::DATE as day, COUNT(*) as count
  FROM public.listings
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY day
  ORDER BY day DESC;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_revenue_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_daily_listing_trend(INTEGER) TO authenticated, service_role;
