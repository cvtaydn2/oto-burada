-- Migration: add-price-history-and-market-features.sql
-- Applied: 2026-04-17
-- Idempotent — safe to run multiple times.

-- ── 1. listing_price_history ─────────────────────────────────────────────────
-- Önceki başarısız migration'lardan kalan tabloyu temizle ve doğru şemayla yeniden oluştur.
-- Tablo boş olduğu için DROP güvenli.

DROP TABLE IF EXISTS public.listing_price_history CASCADE;

CREATE TABLE public.listing_price_history (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid        NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  price      bigint      NOT NULL CHECK (price > 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.listing_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "price_history_select_owner_or_admin" ON public.listing_price_history;
CREATE POLICY "price_history_select_owner_or_admin"
  ON public.listing_price_history FOR SELECT
  USING (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = listing_price_history.listing_id
        AND listings.seller_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "price_history_insert_service" ON public.listing_price_history;
CREATE POLICY "price_history_insert_service"
  ON public.listing_price_history FOR INSERT
  WITH CHECK ((SELECT public.is_admin()));

-- Index: created_at kolonu eklendikten SONRA oluştur
DROP INDEX IF EXISTS idx_price_history_listing_created;
CREATE INDEX idx_price_history_listing_created
  ON public.listing_price_history (listing_id, created_at ASC);

-- Trigger function
CREATE OR REPLACE FUNCTION public.track_listing_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO public.listing_price_history (listing_id, price)
    VALUES (NEW.id, NEW.price);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_track_price_change ON public.listings;
CREATE TRIGGER listings_track_price_change
  AFTER UPDATE OF price ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.track_listing_price_change();

-- Backfill: sadece tablo boşsa çalışır
INSERT INTO public.listing_price_history (listing_id, price)
SELECT id, price
FROM public.listings
WHERE status IN ('approved', 'pending')
  AND NOT EXISTS (SELECT 1 FROM public.listing_price_history LIMIT 1);

-- ── 2. market_stats ──────────────────────────────────────────────────────────

ALTER TABLE public.market_stats
  ADD COLUMN IF NOT EXISTS car_trim text;

ALTER TABLE public.market_stats
  DROP CONSTRAINT IF EXISTS market_stats_brand_model_year_key;

DROP INDEX IF EXISTS market_stats_brand_model_year_idx;
CREATE UNIQUE INDEX market_stats_brand_model_year_idx
  ON public.market_stats (brand, model, year)
  WHERE car_trim IS NULL;

-- ── 3. update_listing_price_indices RPC ──────────────────────────────────────

DROP FUNCTION IF EXISTS public.update_listing_price_indices(text, text, integer, numeric);

CREATE OR REPLACE FUNCTION public.update_listing_price_indices(
  p_brand     text,
  p_model     text,
  p_year      integer,
  p_avg_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.listings
  SET market_price_index = ROUND((price::numeric / p_avg_price)::numeric, 4),
      updated_at = timezone('utc', now())
  WHERE brand = p_brand
    AND model = p_model
    AND year  = p_year
    AND status = 'approved'
    AND p_avg_price > 0;
END;
$$;

-- ── 4. notification_preferences ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id              uuid        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  notify_favorite      boolean     NOT NULL DEFAULT true,
  notify_moderation    boolean     NOT NULL DEFAULT true,
  notify_message       boolean     NOT NULL DEFAULT true,
  notify_price_drop    boolean     NOT NULL DEFAULT true,
  notify_saved_search  boolean     NOT NULL DEFAULT true,
  email_moderation     boolean     NOT NULL DEFAULT true,
  email_expiry_warning boolean     NOT NULL DEFAULT true,
  email_saved_search   boolean     NOT NULL DEFAULT false,
  updated_at           timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_prefs_own" ON public.notification_preferences;
CREATE POLICY "notif_prefs_own"
  ON public.notification_preferences FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ── 5. gallery_views ─────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.gallery_views CASCADE;

CREATE TABLE public.gallery_views (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_ip  text,
  viewer_id  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_on  date        NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

DROP INDEX IF EXISTS gallery_views_ip_daily_idx;
CREATE UNIQUE INDEX gallery_views_ip_daily_idx
  ON public.gallery_views (seller_id, viewer_ip, viewed_on)
  WHERE viewer_ip IS NOT NULL AND viewer_id IS NULL;

DROP INDEX IF EXISTS gallery_views_user_daily_idx;
CREATE UNIQUE INDEX gallery_views_user_daily_idx
  ON public.gallery_views (seller_id, viewer_id, viewed_on)
  WHERE viewer_id IS NOT NULL;

-- created_at kolonu eklendikten SONRA bu index oluşturulur
DROP INDEX IF EXISTS gallery_views_seller_idx;
CREATE INDEX gallery_views_seller_idx
  ON public.gallery_views (seller_id, created_at DESC);

ALTER TABLE public.gallery_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gallery_views_insert_anyone" ON public.gallery_views;
CREATE POLICY "gallery_views_insert_anyone"
  ON public.gallery_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "gallery_views_select_owner_or_admin" ON public.gallery_views;
CREATE POLICY "gallery_views_select_owner_or_admin"
  ON public.gallery_views FOR SELECT
  USING (
    (SELECT public.is_admin())
    OR seller_id = (SELECT auth.uid())
  );

-- ── Rollback ─────────────────────────────────────────────────────────────────
-- DROP TRIGGER IF EXISTS listings_track_price_change ON public.listings;
-- DROP FUNCTION IF EXISTS public.track_listing_price_change();
-- DROP FUNCTION IF EXISTS public.update_listing_price_indices(text,text,integer,numeric);
-- DROP TABLE IF EXISTS public.listing_price_history;
-- DROP TABLE IF EXISTS public.notification_preferences;
-- DROP TABLE IF EXISTS public.gallery_views;
-- ALTER TABLE public.market_stats DROP COLUMN IF EXISTS car_trim;
