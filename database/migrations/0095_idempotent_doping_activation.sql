-- Migration: 0073_idempotent_doping_activation.sql
-- Hardens activate_doping RPC to prevent double activation for the same payment.

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
  -- 1. SECURITY: Verify payment status and ownership
  SELECT status INTO v_payment
  FROM payments
  WHERE id = p_payment_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ödeme kaydı bulunamadı.');
  END IF;

  IF v_payment.status != 'success' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ödeme onaylanmadığı için doping aktif edilemedi.');
  END IF;

  -- 2. SECURITY: Check for existing fulfillment (IDEMPOTENCY)
  SELECT id INTO v_purchase_id
  FROM doping_purchases
  WHERE payment_id = p_payment_id;

  IF FOUND THEN
    -- Already fulfilled - return existing info instead of failing
    SELECT expires_at INTO v_expires_at FROM doping_purchases WHERE id = v_purchase_id;
    RETURN jsonb_build_object(
      'success', true,
      'purchaseId', v_purchase_id,
      'expiresAt', v_expires_at,
      'message', 'Bu ödeme zaten işlenmiş (Idempotent).'
    );
  END IF;

  -- 3. Get package details
  SELECT * INTO v_package
  FROM doping_packages
  WHERE id = p_package_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geçersiz doping paketi.');
  END IF;

  -- 4. Verify listing ownership
  SELECT * INTO v_listing
  FROM listings
  WHERE id = p_listing_id AND seller_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'İlan bulunamadı veya size ait değil.');
  END IF;

  -- 5. Calculate expiry
  v_starts_at := timezone('utc', now());
  IF v_package.duration_days > 0 THEN
    v_expires_at := v_starts_at + (v_package.duration_days || ' days')::interval;
  ELSE
    v_expires_at := NULL;
  END IF;

  -- 6. Create doping purchase record
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

  -- 7. Update listing columns based on doping type
  CASE v_package.type
    WHEN 'featured' THEN
      UPDATE listings SET featured = true, is_featured = true, featured_until = v_expires_at, updated_at = v_starts_at WHERE id = p_listing_id;
    WHEN 'urgent' THEN
      UPDATE listings SET is_urgent = true, urgent_until = v_expires_at, updated_at = v_starts_at WHERE id = p_listing_id;
    WHEN 'highlighted' THEN
      UPDATE listings SET highlighted_until = v_expires_at, frame_color = 'orange', updated_at = v_starts_at WHERE id = p_listing_id;
    WHEN 'gallery' THEN
      UPDATE listings SET gallery_priority = 10, updated_at = v_starts_at WHERE id = p_listing_id;
    WHEN 'bump' THEN
      UPDATE listings SET bumped_at = v_starts_at, updated_at = v_starts_at WHERE id = p_listing_id;
    ELSE
      -- Log unknown type but proceed if record was created
      NULL;
  END CASE;

  -- 8. Mark payment as fulfilled (Extra safety)
  UPDATE payments SET fulfilled_at = v_starts_at WHERE id = p_payment_id;

  RETURN jsonb_build_object(
    'success', true,
    'purchaseId', v_purchase_id,
    'expiresAt', v_expires_at
  );
END;
$$;
