-- expand_listing_status_and_runtime_contracts
-- UP

ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'pending_ai_review';
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'flagged';

ALTER TABLE public.market_stats
  ADD COLUMN IF NOT EXISTS min_price bigint,
  ADD COLUMN IF NOT EXISTS max_price bigint;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false NOT NULL;

CREATE TABLE IF NOT EXISTS public.listing_dopings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  doping_type text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_listing_dopings_listing_active
  ON public.listing_dopings (listing_id, is_active, expires_at);

ALTER TABLE public.listing_dopings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listing_dopings_owner_or_admin_select ON public.listing_dopings;
CREATE POLICY listing_dopings_owner_or_admin_select
  ON public.listing_dopings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.id = listing_dopings.listing_id
        AND (
          l.seller_id = (SELECT auth.uid())
          OR public.is_admin()
        )
    )
  );

DROP POLICY IF EXISTS listing_dopings_admin_write ON public.listing_dopings;
CREATE POLICY listing_dopings_admin_write
  ON public.listing_dopings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.get_user_listing_stats(
  p_user_id uuid,
  p_start_of_month timestamptz,
  p_start_of_year timestamptz
)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'monthly', COUNT(*) FILTER (WHERE created_at >= p_start_of_month),
    'yearly', COUNT(*) FILTER (WHERE created_at >= p_start_of_year),
    'total', COUNT(*)
  )
  FROM public.listings
  WHERE seller_id = p_user_id
    AND status <> 'archived';
$$;

CREATE OR REPLACE FUNCTION public.increment_listing_view_buffered(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listings
  SET view_count = COALESCE(view_count, 0) + 1,
      updated_at = timezone('utc', now())
  WHERE id = p_listing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_listing_stats(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_listing_view_buffered(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_listing_view_buffered(uuid) TO service_role;

-- DOWN
-- PostgreSQL enum values cannot be removed safely in-place.
-- Down migration intentionally only removes additive runtime objects and columns.

REVOKE EXECUTE ON FUNCTION public.increment_listing_view_buffered(uuid) FROM service_role;
REVOKE EXECUTE ON FUNCTION public.increment_listing_view_buffered(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_listing_stats(uuid, timestamptz, timestamptz) FROM authenticated;

DROP FUNCTION IF EXISTS public.increment_listing_view_buffered(uuid);
DROP FUNCTION IF EXISTS public.get_user_listing_stats(uuid, timestamptz, timestamptz);

DROP POLICY IF EXISTS listing_dopings_admin_write ON public.listing_dopings;
DROP POLICY IF EXISTS listing_dopings_owner_or_admin_select ON public.listing_dopings;
DROP INDEX IF EXISTS public.idx_listing_dopings_listing_active;
DROP TABLE IF EXISTS public.listing_dopings;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS verification_reviewed_by,
  DROP COLUMN IF EXISTS verification_reviewed_at,
  DROP COLUMN IF EXISTS email_verified;

ALTER TABLE public.market_stats
  DROP COLUMN IF EXISTS min_price,
  DROP COLUMN IF EXISTS max_price;