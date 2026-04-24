-- =============================================================================
-- Migration 0084: Fix payment schema gaps + sync doping packages + add missing RPCs
-- =============================================================================

-- 1. Add missing columns to payments table
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS package_id text,
  ADD COLUMN IF NOT EXISTS webhook_processed_at timestamptz;

-- Index for idempotency lock check
CREATE INDEX IF NOT EXISTS idx_payments_webhook_processed_at
  ON public.payments (webhook_processed_at)
  WHERE webhook_processed_at IS NULL;

-- 2. Sync doping_packages with code constants (0076 migration may not have applied)
-- Deactivate old slugs
UPDATE public.doping_packages
SET is_active = false
WHERE slug IN ('on_planda', 'acil', 'bump', 'renkli_cerceve', 'galeri');

-- Upsert all 8 packages matching code constants
INSERT INTO public.doping_packages (slug, name, price, duration_days, type, features, is_active, sort_order)
VALUES
  ('kucuk_fotograf',           'Küçük Fotoğraf',              39,  7, 'small_photo',              '["Liste görünümünde fotoğrafı öne çıkar","Daha güçlü ilk izlenim","7 gün aktif"]'::jsonb,                                          true, 1),
  ('acil_acil',                'Acil Acil',                  182, 7, 'urgent',                   '["\"Acil\" rozeti","Acil ilan vurgusu","7 gün boyunca aktif"]'::jsonb,                                                             true, 2),
  ('anasayfa_vitrini',         'Anasayfa Vitrini',           760, 7, 'homepage_showcase',        '["Anasayfa vitrin alanında görünür","En yüksek görünürlük","7 gün aktif"]'::jsonb,                                                 true, 3),
  ('kategori_vitrini',         'Kategori Vitrini',           230, 7, 'category_showcase',        '["Seçili araç kategorisinde öne çıkar","İlgili alıcıya daha görünür","7 gün aktif"]'::jsonb,                                       true, 4),
  ('ust_siradayim',            'Üst Sıradayım',              660, 7, 'top_rank',                 '["Arama sonuçlarında üst sıra önceliği","Liste görünürlüğünü artırır","7 gün aktif"]'::jsonb,                                      true, 5),
  ('detayli_arama_vitrini',    'Detaylı Arama Vitrini',       90, 7, 'detailed_search_showcase', '["Detaylı filtre sonuçlarında öne çıkar","Niyetli alıcıya görünür","7 gün aktif"]'::jsonb,                                         true, 6),
  ('kalin_yazi_renkli_cerceve','Kalın Yazı & Renkli Çerçeve', 61, 7, 'bold_frame',              '["Kalın başlık","Renkli çerçeve","7 gün boyunca dikkat çeker"]'::jsonb,                                                            true, 7),
  ('guncelim',                 'Güncelim',                    88, 0, 'bump',                     '["İlan tarihini günceller","Tek kullanım","Aynı ilan için 24 saat sonra tekrar alınabilir"]'::jsonb,                               true, 8)
ON CONFLICT (slug) DO UPDATE
  SET name          = EXCLUDED.name,
      price         = EXCLUDED.price,
      duration_days = EXCLUDED.duration_days,
      type          = EXCLUDED.type,
      features      = EXCLUDED.features,
      is_active     = EXCLUDED.is_active,
      sort_order    = EXCLUDED.sort_order;

-- 3. Create increment_webhook_attempts RPC (was missing from DB)
CREATE OR REPLACE FUNCTION public.increment_webhook_attempts(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.payments
  SET webhook_attempts = COALESCE(webhook_attempts, 0) + 1,
      updated_at       = now()
  WHERE iyzico_token = p_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_webhook_attempts(text) TO service_role;

-- 4. Atomic payment confirmation RPC (prevents callback/webhook race condition)
CREATE OR REPLACE FUNCTION public.confirm_payment_success(
  p_iyzico_token      text,
  p_user_id           uuid,
  p_iyzico_payment_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment record;
BEGIN
  -- Only transition from pending -> success to prevent double-processing
  UPDATE public.payments
  SET status            = 'success',
      iyzico_payment_id = p_iyzico_payment_id,
      processed_at      = now(),
      updated_at        = now()
  WHERE iyzico_token = p_iyzico_token
    AND user_id      = p_user_id
    AND status       = 'pending'
  RETURNING id, listing_id, package_id INTO v_payment;

  IF NOT FOUND THEN
    SELECT id, listing_id, package_id INTO v_payment
    FROM public.payments
    WHERE iyzico_token = p_iyzico_token AND user_id = p_user_id;

    RETURN jsonb_build_object(
      'updated',    false,
      'id',         v_payment.id,
      'listing_id', v_payment.listing_id,
      'package_id', v_payment.package_id
    );
  END IF;

  RETURN jsonb_build_object(
    'updated',    true,
    'id',         v_payment.id,
    'listing_id', v_payment.listing_id,
    'package_id', v_payment.package_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_payment_success(text, uuid, text) TO service_role;
