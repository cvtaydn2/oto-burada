-- ============================================================
-- Migration: Fix Supabase Security Advisor Warnings
-- Supabase SQL Editor'da çalıştırın
-- ============================================================

-- ============================================================
-- 1. FUNCTION SEARCH_PATH MUTABLE
-- Her fonksiyona SET search_path = '' ekleniyor.
-- Body'ler değiştirilmiyor — sadece güvenlik parametresi ekleniyor.
-- ============================================================

-- is_admin (security_definer: false → true yapıyoruz, search_path ekliyoruz)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false);
$$;

-- set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- update_listing_search_vector
CREATE OR REPLACE FUNCTION public.update_listing_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.brand, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.model, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.city, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.district, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$;

-- update_chat_last_message_at
CREATE OR REPLACE FUNCTION public.update_chat_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.chats
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

-- increment_listing_view (parametreler korunuyor)
CREATE OR REPLACE FUNCTION public.increment_listing_view(
  target_listing_id uuid,
  target_viewer_id uuid DEFAULT NULL,
  target_viewer_ip text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  last_view_time timestamptz;
BEGIN
  IF target_viewer_id IS NOT NULL THEN
    SELECT created_at INTO last_view_time
    FROM public.listing_views
    WHERE listing_id = target_listing_id AND viewer_id = target_viewer_id
    LIMIT 1;
  ELSE
    SELECT created_at INTO last_view_time
    FROM public.listing_views
    WHERE listing_id = target_listing_id AND viewer_ip = target_viewer_ip AND viewer_id IS NULL
    LIMIT 1;
  END IF;

  IF last_view_time IS NULL OR last_view_time < now() - interval '24 hours' THEN
    INSERT INTO public.listing_views (listing_id, viewer_id, viewer_ip)
    VALUES (target_listing_id, target_viewer_id, target_viewer_ip);

    UPDATE public.listings
    SET view_count = view_count + 1
    WHERE id = target_listing_id;
  END IF;
END;
$$;

-- track_listing_price_change (trigger function — body korunuyor)
CREATE OR REPLACE FUNCTION public.track_listing_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.price IS DISTINCT FROM NEW.price) THEN
    INSERT INTO public.listing_price_history (listing_id, price)
    VALUES (NEW.id, NEW.price);
  END IF;
  RETURN NEW;
END;
$$;

-- record_listing_price_change (trigger function — body korunuyor)
CREATE OR REPLACE FUNCTION public.record_listing_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.listing_price_history (listing_id, old_price, new_price)
    VALUES (NEW.id, NULL, NEW.price);
  ELSIF (OLD.price <> NEW.price) THEN
    INSERT INTO public.listing_price_history (listing_id, old_price, new_price)
    VALUES (NEW.id, OLD.price, NEW.price);
  END IF;
  RETURN NEW;
END;
$$;

-- update_listing_price_indices (parametreler korunuyor)
CREATE OR REPLACE FUNCTION public.update_listing_price_indices(
  p_brand text,
  p_model text,
  p_year integer,
  p_avg_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.listings
  SET market_price_index = price / p_avg_price,
      updated_at = now()
  WHERE brand = p_brand
    AND model = p_model
    AND year = p_year
    AND status = 'approved';
END;
$$;

-- recalibrate_all_market_stats
CREATE OR REPLACE FUNCTION public.recalibrate_all_market_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT brand, model, year, AVG(price) AS avg_price, COUNT(*) AS listing_count
    FROM public.listings
    WHERE status = 'approved'
    GROUP BY brand, model, year
  ) LOOP
    INSERT INTO public.market_stats (brand, model, year, avg_price, listing_count, calculated_at)
    VALUES (r.brand, r.model, r.year, r.avg_price, r.listing_count, now())
    ON CONFLICT (brand, model, year)
    DO UPDATE SET
      avg_price = EXCLUDED.avg_price,
      listing_count = EXCLUDED.listing_count,
      calculated_at = EXCLUDED.calculated_at;

    UPDATE public.listings
    SET market_price_index = price / r.avg_price,
        updated_at = now()
    WHERE brand = r.brand
      AND model = r.model
      AND year = r.year
      AND status = 'approved';
  END LOOP;
END;
$$;

-- check_api_rate_limit (body korunuyor)
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_key text,
  p_limit integer,
  p_window_ms bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := now();
  v_count int;
  v_reset_at timestamptz;
  v_window_interval interval := (p_window_ms || ' milliseconds')::interval;
BEGIN
  SELECT count, reset_at INTO v_count, v_reset_at
  FROM public.api_rate_limits
  WHERE key = p_key;

  IF v_count IS NULL OR v_reset_at <= v_now THEN
    v_count := 1;
    v_reset_at := v_now + v_window_interval;
    INSERT INTO public.api_rate_limits (key, count, reset_at)
    VALUES (p_key, v_count, v_reset_at)
    ON CONFLICT (key) DO UPDATE
    SET count = v_count, reset_at = v_reset_at;
  ELSIF v_count < p_limit THEN
    v_count := v_count + 1;
    UPDATE public.api_rate_limits
    SET count = v_count
    WHERE key = p_key;
  ELSE
    RETURN json_build_object(
      'allowed', false,
      'limit', p_limit,
      'remaining', 0,
      'resetAt', floor(extract(epoch from v_reset_at) * 1000)
    );
  END IF;

  RETURN json_build_object(
    'allowed', true,
    'limit', p_limit,
    'remaining', p_limit - v_count,
    'resetAt', floor(extract(epoch from v_reset_at) * 1000)
  );
END;
$$;

-- ============================================================
-- 2. RLS POLICY ALWAYS TRUE — listing_views INSERT
-- Herkes insert yapabilir ama listing_id geçerli olmalı
-- ============================================================

DROP POLICY IF EXISTS "listing_views_insert_anyone" ON public.listing_views;

CREATE POLICY "listing_views_insert_controlled"
  ON public.listing_views
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id
        AND status = 'approved'
    )
  );

-- ============================================================
-- 3. PUBLIC BUCKET ALLOWS LISTING — listing-images
-- Bu ayar Supabase Dashboard'dan yapılır:
-- Storage → Policies → listing-images bucket
-- "Public Read Access" policy'sini sil
-- Yerine sadece object URL erişimine izin veren policy ekle:
--   Name: "Public Read Objects Only"
--   Allowed operation: SELECT
--   Policy definition: bucket_id = 'listing-images'
-- SQL ile storage.policies tablosuna erişim yok.
-- ============================================================

-- ============================================================
-- 4. AUTH LEAKED PASSWORD PROTECTION
-- Bu ayar Supabase Dashboard'dan yapılır:
-- Authentication → Providers → Email → Password Security
-- "Enable leaked password protection" toggle'ını aç
-- SQL ile yapılamaz.
-- ============================================================

-- ============================================================
-- Doğrulama: search_path ayarlandı mı?
-- ============================================================
SELECT
  proname AS function_name,
  prosecdef AS security_definer,
  proconfig AS config
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'is_admin', 'set_updated_at', 'update_listing_search_vector',
    'update_chat_last_message_at', 'increment_listing_view',
    'track_listing_price_change', 'record_listing_price_change',
    'update_listing_price_indices', 'recalibrate_all_market_stats',
    'check_api_rate_limit'
  )
ORDER BY proname;
