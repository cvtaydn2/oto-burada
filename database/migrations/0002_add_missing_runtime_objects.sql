-- add_missing_runtime_objects
-- UP

CREATE TABLE IF NOT EXISTS public.storage_cleanup_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_name text NOT NULL,
  file_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT storage_cleanup_queue_status_check CHECK (
    status = ANY (ARRAY['pending'::text, 'failed'::text, 'deleted'::text])
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_storage_cleanup_queue_unique_pending
  ON public.storage_cleanup_queue (bucket_name, file_path, status);

CREATE INDEX IF NOT EXISTS idx_storage_cleanup_queue_status_created_at
  ON public.storage_cleanup_queue (status, created_at);

ALTER TABLE public.storage_cleanup_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS storage_cleanup_queue_service_role_only ON public.storage_cleanup_queue;
CREATE POLICY storage_cleanup_queue_service_role_only
  ON public.storage_cleanup_queue
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created_at
  ON public.audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON public.audit_logs (resource_type, resource_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_service_role_only ON public.audit_logs;
CREATE POLICY audit_logs_service_role_only
  ON public.audit_logs
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.get_revenue_stats(
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE(total_amount numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount)::numeric, 0) AS total_amount
  FROM public.payments
  WHERE status = 'success'
    AND created_at >= p_start_date
    AND created_at < p_end_date;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_listing_trend(p_days integer)
RETURNS TABLE(day date, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    date_trunc('day', created_at)::date AS day,
    COUNT(*)::bigint AS count
  FROM public.listings
  WHERE created_at >= timezone('utc', now()) - make_interval(days => GREATEST(p_days, 1))
  GROUP BY 1
  ORDER BY 1 ASC;
$$;

CREATE OR REPLACE FUNCTION public.sync_listing_views_buffer()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count integer := 0;
BEGIN
  WITH aggregated AS (
    SELECT listing_id, COUNT(*)::integer AS total_views
    FROM public.listing_views
    GROUP BY listing_id
  ),
  updated AS (
    UPDATE public.listings l
    SET view_count = a.total_views,
        updated_at = timezone('utc', now())
    FROM aggregated a
    WHERE l.id = a.listing_id
      AND COALESCE(l.view_count, 0) IS DISTINCT FROM a.total_views
    RETURNING l.id
  )
  SELECT COUNT(*)::integer INTO v_updated_count FROM updated;

  RETURN v_updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_revenue_stats(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_listing_trend(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_listing_views_buffer() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_listing_views_buffer() TO authenticated;

-- DOWN

REVOKE EXECUTE ON FUNCTION public.sync_listing_views_buffer() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_listing_views_buffer() FROM service_role;
REVOKE EXECUTE ON FUNCTION public.get_daily_listing_trend(integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_revenue_stats(timestamptz, timestamptz) FROM authenticated;

DROP FUNCTION IF EXISTS public.sync_listing_views_buffer();
DROP FUNCTION IF EXISTS public.get_daily_listing_trend(integer);
DROP FUNCTION IF EXISTS public.get_revenue_stats(timestamptz, timestamptz);

DROP POLICY IF EXISTS audit_logs_service_role_only ON public.audit_logs;
DROP INDEX IF EXISTS public.idx_audit_logs_resource;
DROP INDEX IF EXISTS public.idx_audit_logs_user_created_at;
DROP TABLE IF EXISTS public.audit_logs;

DROP POLICY IF EXISTS storage_cleanup_queue_service_role_only ON public.storage_cleanup_queue;
DROP INDEX IF EXISTS public.idx_storage_cleanup_queue_status_created_at;
DROP INDEX IF EXISTS public.idx_storage_cleanup_queue_unique_pending;
DROP TABLE IF EXISTS public.storage_cleanup_queue;