-- Migration: 0069_doping_activation_functions.sql
-- Phase 3.2: Doping Activation Logic & Expiry Automation

-- ══════════════════════════════════════════════════════════════════════════════
-- PART 1: Doping Activation RPC Function
-- ══════════════════════════════════════════════════════════════════════════════

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
  v_update_data jsonb;
BEGIN
  -- 1. Verify payment status
  SELECT status INTO v_payment
  FROM payments
  WHERE id = p_payment_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ödeme kaydı bulunamadı.'
    );
  END IF;

  IF v_payment.status != 'success' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ödeme onaylanmadığı için doping aktif edilemedi.'
    );
  END IF;

  -- 2. Get package details
  SELECT * INTO v_package
  FROM doping_packages
  WHERE id = p_package_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Geçersiz doping paketi.'
    );
  END IF;

  -- 3. Verify listing ownership
  SELECT * INTO v_listing
  FROM listings
  WHERE id = p_listing_id AND seller_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'İlan bulunamadı veya size ait değil.'
    );
  END IF;

  -- 4. Calculate expiry
  v_starts_at := timezone('utc', now());
  IF v_package.duration_days > 0 THEN
    v_expires_at := v_starts_at + (v_package.duration_days || ' days')::interval;
  ELSE
    v_expires_at := NULL;
  END IF;

  -- 5. Create doping purchase record
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

  -- 6. Update listing columns based on doping type
  v_update_data := jsonb_build_object('updated_at', v_starts_at);

  CASE v_package.type
    WHEN 'featured' THEN
      UPDATE listings
      SET 
        featured = true,
        is_featured = true,
        featured_until = v_expires_at,
        updated_at = v_starts_at
      WHERE id = p_listing_id;

    WHEN 'urgent' THEN
      UPDATE listings
      SET 
        is_urgent = true,
        urgent_until = v_expires_at,
        updated_at = v_starts_at
      WHERE id = p_listing_id;

    WHEN 'highlighted' THEN
      UPDATE listings
      SET 
        highlighted_until = v_expires_at,
        frame_color = 'orange',
        updated_at = v_starts_at
      WHERE id = p_listing_id;

    WHEN 'gallery' THEN
      UPDATE listings
      SET 
        gallery_priority = 10,
        updated_at = v_starts_at
      WHERE id = p_listing_id;

    WHEN 'bump' THEN
      UPDATE listings
      SET 
        bumped_at = v_starts_at,
        updated_at = v_starts_at
      WHERE id = p_listing_id;

    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Bilinmeyen doping tipi.'
      );
  END CASE;

  RETURN jsonb_build_object(
    'success', true,
    'purchaseId', v_purchase_id,
    'expiresAt', v_expires_at
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.activate_doping TO authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- PART 2: Doping Expiry Automation (pg_cron)
-- ══════════════════════════════════════════════════════════════════════════════

-- Drop existing cron job if it exists (from migration 0002)
SELECT cron.unschedule('expire-dopings') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'expire-dopings'
);

-- Create improved cron job that runs every hour
SELECT cron.schedule(
  'expire-dopings-v2',
  '0 * * * *', -- Every hour at minute 0
  $$
    -- Expire featured dopings
    UPDATE public.listings
    SET 
      featured = false,
      is_featured = false,
      featured_until = NULL,
      updated_at = timezone('utc', now())
    WHERE featured = true
      AND featured_until IS NOT NULL
      AND featured_until < timezone('utc', now());

    -- Expire urgent dopings
    UPDATE public.listings
    SET 
      is_urgent = false,
      urgent_until = NULL,
      updated_at = timezone('utc', now())
    WHERE is_urgent = true
      AND urgent_until IS NOT NULL
      AND urgent_until < timezone('utc', now());

    -- Expire highlighted dopings
    UPDATE public.listings
    SET 
      highlighted_until = NULL,
      frame_color = NULL,
      updated_at = timezone('utc', now())
    WHERE highlighted_until IS NOT NULL
      AND highlighted_until < timezone('utc', now());

    -- Mark doping purchases as expired
    UPDATE public.doping_purchases
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at < timezone('utc', now());
  $$
);

-- ══════════════════════════════════════════════════════════════════════════════
-- PART 3: Helper Function - Get Active Doping for Listing
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_active_dopings_for_listing(p_listing_id uuid)
RETURNS TABLE (
  doping_type text,
  expires_at timestamptz,
  package_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    dp.type as doping_type,
    dpu.expires_at,
    dp.name as package_name
  FROM doping_purchases dpu
  JOIN doping_packages dp ON dp.id = dpu.package_id
  WHERE dpu.listing_id = p_listing_id
    AND dpu.status = 'active'
    AND (dpu.expires_at IS NULL OR dpu.expires_at > timezone('utc', now()))
  ORDER BY dpu.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_dopings_for_listing TO authenticated, anon;

-- ══════════════════════════════════════════════════════════════════════════════
-- PART 4: Indexes for Performance
-- ══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_listings_gallery_priority 
  ON listings(gallery_priority DESC) 
  WHERE gallery_priority > 0 AND status = 'approved';

CREATE INDEX IF NOT EXISTS idx_listings_featured_active 
  ON listings(featured, featured_until) 
  WHERE featured = true AND status = 'approved';

CREATE INDEX IF NOT EXISTS idx_listings_urgent_active 
  ON listings(is_urgent, urgent_until) 
  WHERE is_urgent = true AND status = 'approved';

CREATE INDEX IF NOT EXISTS idx_doping_purchases_active 
  ON doping_purchases(listing_id, status, expires_at) 
  WHERE status = 'active';

COMMENT ON FUNCTION public.activate_doping IS 
  'Activates a doping package for a listing after successful payment. Updates listing columns based on doping type.';

COMMENT ON FUNCTION public.get_active_dopings_for_listing IS 
  'Returns all active doping packages for a given listing with expiry information.';
