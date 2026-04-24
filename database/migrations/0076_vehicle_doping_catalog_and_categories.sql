-- Vehicle-only Sahibinden-style doping catalog at roughly 1/10 Vasıta prices.
-- Keeps the marketplace car-focused while adding Vasıta-like subcategories.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'otomobil',
  ADD COLUMN IF NOT EXISTS small_photo_until timestamptz,
  ADD COLUMN IF NOT EXISTS homepage_showcase_until timestamptz,
  ADD COLUMN IF NOT EXISTS category_showcase_until timestamptz,
  ADD COLUMN IF NOT EXISTS top_rank_until timestamptz,
  ADD COLUMN IF NOT EXISTS detailed_search_showcase_until timestamptz,
  ADD COLUMN IF NOT EXISTS bold_frame_until timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listings_vehicle_category_check'
      AND conrelid = 'public.listings'::regclass
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_vehicle_category_check
      CHECK (
        category IN (
          'otomobil',
          'arazi_suv_pickup',
          'elektrikli_arac',
          'minivan_panelvan',
          'ticari_arac',
          'klasik_arac',
          'hasarli_arac'
        )
      ) NOT VALID;
  END IF;
END;
$$;

ALTER TABLE public.listings VALIDATE CONSTRAINT listings_vehicle_category_check;

UPDATE public.doping_packages
SET is_active = false
WHERE slug IN ('on_planda', 'acil', 'renkli_cerceve', 'galeri', 'bump');

INSERT INTO public.doping_packages (slug, name, price, duration_days, type, features, is_active, sort_order)
VALUES
  ('kucuk_fotograf', 'Küçük Fotoğraf', 39, 7, 'small_photo', '["Liste görünümünde fotoğrafı öne çıkar", "Daha güçlü ilk izlenim", "7 gün aktif"]'::jsonb, true, 1),
  ('acil_acil', 'Acil Acil', 182, 7, 'urgent', '["\"Acil\" rozeti", "Acil ilan vurgusu", "7 gün boyunca aktif"]'::jsonb, true, 2),
  ('anasayfa_vitrini', 'Anasayfa Vitrini', 760, 7, 'homepage_showcase', '["Anasayfa vitrin alanında görünür", "En yüksek görünürlük", "7 gün aktif"]'::jsonb, true, 3),
  ('kategori_vitrini', 'Kategori Vitrini', 230, 7, 'category_showcase', '["Seçili araç kategorisinde öne çıkar", "İlgili alıcıya daha görünür", "7 gün aktif"]'::jsonb, true, 4),
  ('ust_siradayim', 'Üst Sıradayım', 660, 7, 'top_rank', '["Arama sonuçlarında üst sıra önceliği", "Liste görünürlüğünü artırır", "7 gün aktif"]'::jsonb, true, 5),
  ('detayli_arama_vitrini', 'Detaylı Arama Vitrini', 90, 7, 'detailed_search_showcase', '["Detaylı filtre sonuçlarında öne çıkar", "Niyetli alıcıya görünür", "7 gün aktif"]'::jsonb, true, 6),
  ('kalin_yazi_renkli_cerceve', 'Kalın Yazı & Renkli Çerçeve', 61, 7, 'bold_frame', '["Kalın başlık", "Renkli çerçeve", "7 gün boyunca dikkat çeker"]'::jsonb, true, 7),
  ('guncelim', 'Güncelim', 88, 0, 'bump', '["İlan tarihini günceller", "Tek kullanım", "Aynı ilan için 24 saat sonra tekrar alınabilir"]'::jsonb, true, 8)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  duration_days = EXCLUDED.duration_days,
  type = EXCLUDED.type,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

CREATE OR REPLACE FUNCTION public.activate_doping(
  p_user_id uuid,
  p_listing_id uuid,
  p_package_id uuid,
  p_payment_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_package record;
  v_listing record;
  v_payment record;
  v_purchase_id uuid;
  v_starts_at timestamptz;
  v_expires_at timestamptz;
BEGIN
  SELECT status INTO v_payment
  FROM payments
  WHERE id = p_payment_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ödeme kaydı bulunamadı.');
  END IF;

  IF v_payment.status != 'success' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ödeme onaylanmadığı için doping aktif edilemedi.');
  END IF;

  SELECT id INTO v_purchase_id
  FROM doping_purchases
  WHERE payment_id = p_payment_id;

  IF FOUND THEN
    SELECT expires_at INTO v_expires_at FROM doping_purchases WHERE id = v_purchase_id;
    RETURN jsonb_build_object(
      'success', true,
      'purchaseId', v_purchase_id,
      'expiresAt', v_expires_at,
      'message', 'Bu ödeme zaten işlenmiş.'
    );
  END IF;

  SELECT * INTO v_package
  FROM doping_packages
  WHERE id = p_package_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geçersiz doping paketi.');
  END IF;

  SELECT * INTO v_listing
  FROM listings
  WHERE id = p_listing_id AND seller_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'İlan bulunamadı veya size ait değil.');
  END IF;

  v_starts_at := timezone('utc', now());

  IF v_package.type = 'bump' AND v_listing.bumped_at IS NOT NULL AND v_listing.bumped_at > v_starts_at - interval '24 hours' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Güncelim aynı ilan için 24 saat sonra tekrar alınabilir.');
  END IF;

  IF v_package.duration_days > 0 THEN
    v_expires_at := v_starts_at + (v_package.duration_days || ' days')::interval;
  ELSE
    v_expires_at := NULL;
  END IF;

  INSERT INTO doping_purchases (
    user_id,
    listing_id,
    package_id,
    payment_id,
    status,
    starts_at,
    expires_at
  ) VALUES (
    p_user_id,
    p_listing_id,
    p_package_id,
    p_payment_id,
    'active',
    v_starts_at,
    v_expires_at
  ) RETURNING id INTO v_purchase_id;

  CASE v_package.type
    WHEN 'small_photo' THEN
      UPDATE listings
      SET small_photo_until = v_expires_at, updated_at = v_starts_at
      WHERE id = p_listing_id;
    WHEN 'urgent' THEN
      UPDATE listings
      SET is_urgent = true, urgent_until = v_expires_at, updated_at = v_starts_at
      WHERE id = p_listing_id;
    WHEN 'homepage_showcase' THEN
      UPDATE listings
      SET
        featured = true,
        is_featured = true,
        featured_until = v_expires_at,
        homepage_showcase_until = v_expires_at,
        gallery_priority = GREATEST(COALESCE(gallery_priority, 0), 20),
        updated_at = v_starts_at
      WHERE id = p_listing_id;
    WHEN 'category_showcase' THEN
      UPDATE listings
      SET
        category_showcase_until = v_expires_at,
        gallery_priority = GREATEST(COALESCE(gallery_priority, 0), 12),
        updated_at = v_starts_at
      WHERE id = p_listing_id;
    WHEN 'top_rank' THEN
      UPDATE listings
      SET top_rank_until = v_expires_at, updated_at = v_starts_at
      WHERE id = p_listing_id;
    WHEN 'detailed_search_showcase' THEN
      UPDATE listings
      SET detailed_search_showcase_until = v_expires_at, updated_at = v_starts_at
      WHERE id = p_listing_id;
    WHEN 'bold_frame' THEN
      UPDATE listings
      SET
        highlighted_until = v_expires_at,
        bold_frame_until = v_expires_at,
        frame_color = 'orange',
        updated_at = v_starts_at
      WHERE id = p_listing_id;
    WHEN 'bump' THEN
      UPDATE listings
      SET bumped_at = v_starts_at, updated_at = v_starts_at
      WHERE id = p_listing_id;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Bilinmeyen doping tipi.');
  END CASE;

  UPDATE payments SET fulfilled_at = v_starts_at WHERE id = p_payment_id;

  RETURN jsonb_build_object(
    'success', true,
    'purchaseId', v_purchase_id,
    'expiresAt', v_expires_at
  );
END;
$$;

CREATE INDEX IF NOT EXISTS idx_listings_category_approved
  ON public.listings (category)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_listings_top_rank_active
  ON public.listings (top_rank_until DESC)
  WHERE top_rank_until IS NOT NULL AND status = 'approved';

CREATE INDEX IF NOT EXISTS idx_listings_showcase_active
  ON public.listings (homepage_showcase_until DESC, category_showcase_until DESC, detailed_search_showcase_until DESC)
  WHERE status = 'approved';

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
  v_small_photo_count int;
  v_homepage_showcase_count int;
  v_category_showcase_count int;
  v_top_rank_count int;
  v_detailed_search_count int;
  v_bold_frame_count int;
  v_purchases_count int;
BEGIN
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
      AND (homepage_showcase_until IS NULL OR homepage_showcase_until < v_now)
    RETURNING id
  ) SELECT count(*) INTO v_featured_count FROM expired;

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

  WITH expired AS (
    UPDATE listings
    SET
      highlighted_until = NULL,
      frame_color = NULL,
      updated_at = v_now
    WHERE highlighted_until IS NOT NULL
      AND highlighted_until < v_now
      AND (bold_frame_until IS NULL OR bold_frame_until < v_now)
    RETURNING id
  ) SELECT count(*) INTO v_highlighted_count FROM expired;

  WITH expired AS (
    UPDATE listings
    SET small_photo_until = NULL, updated_at = v_now
    WHERE small_photo_until IS NOT NULL
      AND small_photo_until < v_now
    RETURNING id
  ) SELECT count(*) INTO v_small_photo_count FROM expired;

  WITH expired AS (
    UPDATE listings
    SET
      homepage_showcase_until = NULL,
      featured = false,
      is_featured = false,
      featured_until = NULL,
      gallery_priority = CASE
        WHEN category_showcase_until IS NOT NULL AND category_showcase_until >= v_now THEN GREATEST(COALESCE(gallery_priority, 0), 12)
        ELSE 0
      END,
      updated_at = v_now
    WHERE homepage_showcase_until IS NOT NULL
      AND homepage_showcase_until < v_now
    RETURNING id
  ) SELECT count(*) INTO v_homepage_showcase_count FROM expired;

  WITH expired AS (
    UPDATE listings
    SET
      category_showcase_until = NULL,
      gallery_priority = CASE
        WHEN homepage_showcase_until IS NOT NULL AND homepage_showcase_until >= v_now THEN GREATEST(COALESCE(gallery_priority, 0), 20)
        ELSE 0
      END,
      updated_at = v_now
    WHERE category_showcase_until IS NOT NULL
      AND category_showcase_until < v_now
    RETURNING id
  ) SELECT count(*) INTO v_category_showcase_count FROM expired;

  WITH expired AS (
    UPDATE listings
    SET top_rank_until = NULL, updated_at = v_now
    WHERE top_rank_until IS NOT NULL
      AND top_rank_until < v_now
    RETURNING id
  ) SELECT count(*) INTO v_top_rank_count FROM expired;

  WITH expired AS (
    UPDATE listings
    SET detailed_search_showcase_until = NULL, updated_at = v_now
    WHERE detailed_search_showcase_until IS NOT NULL
      AND detailed_search_showcase_until < v_now
    RETURNING id
  ) SELECT count(*) INTO v_detailed_search_count FROM expired;

  WITH expired AS (
    UPDATE listings
    SET
      bold_frame_until = NULL,
      highlighted_until = NULL,
      frame_color = NULL,
      updated_at = v_now
    WHERE bold_frame_until IS NOT NULL
      AND bold_frame_until < v_now
    RETURNING id
  ) SELECT count(*) INTO v_bold_frame_count FROM expired;

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
      'smallPhoto', v_small_photo_count,
      'homepageShowcase', v_homepage_showcase_count,
      'categoryShowcase', v_category_showcase_count,
      'topRank', v_top_rank_count,
      'detailedSearchShowcase', v_detailed_search_count,
      'boldFrame', v_bold_frame_count,
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

GRANT EXECUTE ON FUNCTION public.expire_dopings_atomic() TO service_role;
