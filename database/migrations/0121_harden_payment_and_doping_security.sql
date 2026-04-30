-- Migration 0121: Harden Payment and Doping Security
-- Resolves Critical Audit Findings: Proliferation of Admin Client & RLS Bypass

-- 1. Add missing RLS policies for payments
-- This allows moving away from service_role/admin client for initial creation
CREATE POLICY "payments_insert_self" ON public.payments 
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- 2. Restore EXECUTE permissions with safety checks
-- These functions are SECURITY DEFINER so they can bypass RLS, but we verify auth.uid()
GRANT EXECUTE ON FUNCTION public.confirm_payment_success(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_listing_doping(uuid, uuid, text[], integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_doping(uuid, uuid, uuid, uuid) TO authenticated;

-- 3. Update confirm_payment_success to enforce auth.uid() if not admin
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
  v_job_id uuid;
BEGIN
  -- SECURITY: Enforce user ownership if not called by service_role (implicitly checked via auth.uid())
  -- If auth.uid() is null, it means it's service_role or anonymous (e.g. from a background job if we ever do that)
  -- If auth.uid() is NOT null, it MUST match p_user_id.
  IF (SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) <> p_user_id THEN
    RAISE EXCEPTION 'Ownership violation: You can only confirm your own payments.';
  END IF;

  -- 1. Atomic Update: Transitions from pending -> success
  UPDATE public.payments
  SET status               = 'success',
      iyzico_payment_id    = p_iyzico_payment_id,
      processed_at         = now(),
      webhook_processed_at = now(), -- Atomic lock for webhook
      updated_at           = now()
  WHERE iyzico_token = p_iyzico_token
    AND user_id      = p_user_id
    AND status       = 'pending'
  RETURNING id, listing_id, package_id INTO v_payment;

  -- 2. If already success/processed, just return existing data
  IF NOT FOUND THEN
    SELECT id, listing_id, package_id INTO v_payment
    FROM public.payments
    WHERE iyzico_token = p_iyzico_token AND user_id = p_user_id;

    IF v_payment.id IS NULL THEN
        RETURN jsonb_build_object('updated', false, 'status', 'not_found');
    END IF;

    RETURN jsonb_build_object(
      'updated',    false,
      'status',     'already_confirmed',
      'id',         v_payment.id,
      'listing_id', v_payment.listing_id,
      'package_id', v_payment.package_id
    );
  END IF;

  -- 3. Queue fulfillment job immediately
  -- This ensures that even if the webhook is slow, the user's action starts the fulfillment
  IF v_payment.listing_id IS NOT NULL AND v_payment.package_id IS NOT NULL THEN
    -- create_fulfillment_job handles idempotency via unique_payment_job constraint
    SELECT public.create_fulfillment_job(
      v_payment.id,
      'doping_apply',
      jsonb_build_object(
        'listing_id', v_payment.listing_id,
        'package_id', v_payment.package_id,
        'user_id', p_user_id
      )
    ) INTO v_job_id;
  END IF;

  RETURN jsonb_build_object(
    'updated',    true,
    'status',     'confirmed',
    'id',         v_payment.id,
    'listing_id', v_payment.listing_id,
    'package_id', v_payment.package_id,
    'job_id',     v_job_id
  );
END;
$$;

-- 4. Update apply_listing_doping to enforce auth.uid() if not admin
CREATE OR REPLACE FUNCTION public.apply_listing_doping(
  p_listing_id UUID,
  p_user_id UUID,
  p_doping_types TEXT[],
  p_duration_days INTEGER DEFAULT 7,
  p_payment_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing RECORD;
  v_expires_at TIMESTAMPTZ;
  v_doping_type TEXT;
  v_applied_count INTEGER := 0;
BEGIN
  -- SECURITY: Enforce user ownership if not called by service_role
  IF (SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) <> p_user_id THEN
    RAISE EXCEPTION 'Ownership violation: You can only apply doping for your own listings.';
  END IF;

  -- 1. Verify listing ownership
  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found: %', p_listing_id;
  END IF;
  
  IF v_listing.seller_id != p_user_id THEN
    RAISE EXCEPTION 'User % does not own listing %', p_user_id, p_listing_id;
  END IF;
  
  -- 2. Calculate expiration
  v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;
  
  -- 3. Apply each doping type
  FOREACH v_doping_type IN ARRAY p_doping_types
  LOOP
    CASE v_doping_type
      WHEN 'featured' THEN
        IF v_listing.featured_until IS NULL OR v_listing.featured_until < NOW() THEN
          UPDATE public.listings
          SET 
            featured = true,
            featured_until = v_expires_at,
            updated_at = NOW()
          WHERE id = p_listing_id;
          v_applied_count := v_applied_count + 1;
        END IF;
      WHEN 'urgent' THEN
        IF v_listing.urgent_until IS NULL OR v_listing.urgent_until < NOW() THEN
          UPDATE public.listings SET urgent_until = v_expires_at, updated_at = NOW() WHERE id = p_listing_id;
          v_applied_count := v_applied_count + 1;
        END IF;
      WHEN 'highlighted' THEN
        IF v_listing.highlighted_until IS NULL OR v_listing.highlighted_until < NOW() THEN
          UPDATE public.listings SET highlighted_until = v_expires_at, updated_at = NOW() WHERE id = p_listing_id;
          v_applied_count := v_applied_count + 1;
        END IF;
      ELSE
        RAISE EXCEPTION 'Unknown doping type: %', v_doping_type;
    END CASE;
    
    -- 4. Log doping application
    INSERT INTO public.doping_applications (
      listing_id, user_id, doping_type, duration_days, expires_at, payment_id, metadata
    )
    VALUES (
      p_listing_id, p_user_id, v_doping_type, p_duration_days, v_expires_at, p_payment_id,
      jsonb_build_object('applied_at', NOW(), 'expires_at', v_expires_at)
    );
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'listing_id', p_listing_id, 'applied_count', v_applied_count, 'expires_at', v_expires_at);
END;
$$;

-- 5. Update activate_doping to enforce auth.uid() if not admin
CREATE OR REPLACE FUNCTION public.activate_doping(
  p_user_id UUID,
  p_listing_id UUID,
  p_package_id UUID,
  p_payment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing RECORD;
  v_package RECORD;
  v_payment RECORD;
  v_purchase_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- SECURITY: Enforce user ownership if not called by service_role
  IF (SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) <> p_user_id THEN
    RAISE EXCEPTION 'Ownership violation: You can only activate doping for your own account.';
  END IF;

  -- 1. Verify listing ownership
  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id;
  IF NOT FOUND OR v_listing.seller_id <> p_user_id THEN
    RAISE EXCEPTION 'Ownership violation: Listing not found or not owned by user.';
  END IF;

  -- 2. Verify payment status (must be success and belong to user)
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id;
  IF NOT FOUND OR v_payment.user_id <> p_user_id OR v_payment.status <> 'success' THEN
    RAISE EXCEPTION 'Payment violation: Valid successful payment required.';
  END IF;

  -- 3. Get package details
  SELECT * INTO v_package FROM public.doping_packages WHERE id = p_package_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid package.'; END IF;

  -- 4. Create purchase record
  v_expires_at := now() + (v_package.duration_days || ' days')::interval;
  
  INSERT INTO public.doping_purchases (
    user_id, listing_id, package_id, payment_id, status, expires_at
  ) VALUES (
    p_user_id, p_listing_id, p_package_id, p_payment_id, 'active', v_expires_at
  ) RETURNING id INTO v_purchase_id;

  -- 5. Apply effect (simple version, full logic is in apply_listing_doping but this is for direct activation)
  -- This part is usually handled by a job, but here we do basic updates
  IF v_package.type = 'featured' THEN
    UPDATE public.listings SET featured = true, featured_until = v_expires_at WHERE id = p_listing_id;
  ELSIF v_package.type = 'urgent' THEN
    UPDATE public.listings SET urgent_until = v_expires_at WHERE id = p_listing_id;
  ELSIF v_package.type = 'highlighted' THEN
    UPDATE public.listings SET highlighted_until = v_expires_at WHERE id = p_listing_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'purchaseId', v_purchase_id,
    'expiresAt', v_expires_at
  );
END;
$$;
