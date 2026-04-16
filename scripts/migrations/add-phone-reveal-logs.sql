-- Phone Reveal Audit Log
-- Tracks every time a user or guest reveals a phone number on a listing.
-- Used for: scraping detection, seller analytics, abuse investigations.
--
-- Run once against your Supabase project.

CREATE TABLE IF NOT EXISTS public.phone_reveal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewer_ip text,
  revealed_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Index for scraping pattern detection (many reveals from same IP)
CREATE INDEX IF NOT EXISTS idx_phone_reveal_logs_ip
  ON public.phone_reveal_logs (viewer_ip, revealed_at DESC)
  WHERE viewer_ip IS NOT NULL;

-- Index for seller analytics (how many times their listing phone was revealed)
CREATE INDEX IF NOT EXISTS idx_phone_reveal_logs_listing
  ON public.phone_reveal_logs (listing_id, revealed_at DESC);

-- Index for per-user reveal history
CREATE INDEX IF NOT EXISTS idx_phone_reveal_logs_user
  ON public.phone_reveal_logs (user_id, revealed_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.phone_reveal_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and listing owners can view the logs
CREATE POLICY "phone_reveal_logs_select_owner_or_admin"
  ON public.phone_reveal_logs
  FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = phone_reveal_logs.listing_id
        AND listings.seller_id = (SELECT auth.uid())
    )
  );

-- Anyone (including anonymous) can insert (controlled by RLS + rate limiting in app layer)
CREATE POLICY "phone_reveal_logs_insert_anyone"
  ON public.phone_reveal_logs
  FOR INSERT
  WITH CHECK (true);
