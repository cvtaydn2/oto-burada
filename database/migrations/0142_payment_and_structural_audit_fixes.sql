-- Migration: 0142_payment_and_structural_audit_fixes
-- Purpose: Centralize all payment fulfillment logic, fix unique constraint and uuid mismatch, implement exception-safe chat creation, clean up generated column triggers, and enforce atomic listing quota limits.

BEGIN;

-- ==========================================================================
-- 1. FIX ITEM 4: Payment Unique Webhook Log & package_id Mismatch & Job Consolidation
-- ==========================================================================

-- First, clean any existing duplicate webhook tokens before adding unique constraint
WITH dups AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY token ORDER BY created_at DESC) as rn
  FROM public.payment_webhook_logs
  WHERE token IS NOT NULL
)
DELETE FROM public.payment_webhook_logs
WHERE id IN (SELECT id FROM dups WHERE rn > 1);

-- Add the unique constraint to webhook logs
ALTER TABLE public.payment_webhook_logs 
ADD CONSTRAINT payment_webhook_logs_token_key UNIQUE (token);

-- Alter payments.package_id from TEXT to UUID
ALTER TABLE public.payments 
ALTER COLUMN package_id TYPE uuid USING package_id::uuid;

-- Centralize all fulfillment logic into trigger_create_fulfillment_jobs
CREATE OR REPLACE FUNCTION public.trigger_create_fulfillment_jobs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta JSONB;
BEGIN
  -- React ONLY on status transitions to 'success'
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    v_meta := NEW.metadata;
    
    -- Scenario A: Credit / Plan Purchase
    IF v_meta->>'type' = 'plan_purchase' THEN
      PERFORM public.create_fulfillment_job(
        NEW.id,
        'credit_add',
        jsonb_build_object('credits', v_meta->'credits')
      );
      
      PERFORM public.create_fulfillment_job(
        NEW.id,
        'notification_send',
        jsonb_build_object('notification', jsonb_build_object(
          'type', 'system',
          'title', 'Paket satın alındı',
          'message', (COALESCE(NEW.plan_name, 'Paket') || ' başarıyla aktifleştirildi. ' || COALESCE(v_meta->>'credits', '0') || ' kredi hesabınıza eklendi.'),
          'href', '/dashboard/pricing'
        ))
      );
    END IF;

    -- Scenario B: Doping via Metadata
    IF v_meta->>'type' = 'doping' THEN
      PERFORM public.create_fulfillment_job(
        NEW.id,
        'doping_apply',
        jsonb_build_object(
          'dopingTypes', v_meta->'dopingTypes',
          'durationDays', COALESCE(v_meta->'durationDays', '7')
        )
      );
      
      PERFORM public.create_fulfillment_job(
        NEW.id,
        'notification_send',
        jsonb_build_object('notification', jsonb_build_object(
          'type', 'system',
          'title', 'Doping aktifleştirildi',
          'message', 'İlanınız öne çıkarıldı.',
          'href', '/dashboard/listings'
        ))
      );
    END IF;

    -- Scenario C: Direct Doping Columns (Consolidated from RPC functions to prevent duplicate producer races)
    IF NEW.listing_id IS NOT NULL AND NEW.package_id IS NOT NULL THEN
      PERFORM public.create_fulfillment_job(
        NEW.id,
        'doping_apply',
        jsonb_build_object(
          'listing_id', NEW.listing_id,
          'package_id', NEW.package_id,
          'user_id', NEW.user_id
        )
      );
      
      PERFORM public.create_fulfillment_job(
        NEW.id,
        'notification_send',
        jsonb_build_object('notification', jsonb_build_object(
          'type', 'system',
          'title', 'Doping aktifleştirildi',
          'message', 'İlanınız öne çıkarıldı.',
          'href', '/dashboard/listings'
        ))
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Clean RPC Function: confirm_payment_success (Removes duplicate manual job queuing)
CREATE OR REPLACE FUNCTION public.confirm_payment_success(
  p_iyzico_token text, 
  p_user_id uuid, 
  p_iyzico_payment_id text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment record;
BEGIN
  -- SECURITY: Enforce user ownership if not called by service_role
  IF (SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) <> p_user_id THEN
    RAISE EXCEPTION 'Ownership violation: You can only confirm your own payments.';
  END IF;

  -- 1. Atomic Update: Transitions from pending -> success
  -- This will automatically trigger the CENTRALIZED public.trigger_create_fulfillment_jobs()
  UPDATE public.payments
  SET status               = 'success',
      iyzico_payment_id    = p_iyzico_payment_id,
      processed_at         = now(),
      webhook_processed_at = now(),
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

  RETURN jsonb_build_object(
    'updated',    true,
    'status',     'confirmed',
    'id',         v_payment.id,
    'listing_id', v_payment.listing_id,
    'package_id', v_payment.package_id,
    'job_id',     NULL -- Managed asynchronously by DB trigger
  );
END;
$$;

-- Clean RPC Function: process_payment_webhook (Removes duplicate manual job queuing)
CREATE OR REPLACE FUNCTION public.process_payment_webhook(
  p_token text, 
  p_status text, 
  p_iyzico_payment_id text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
BEGIN
  -- 1. Atomic lock: Only one worker can set webhook_processed_at to non-null
  -- Transitioning status to 'success' will natively trigger public.trigger_create_fulfillment_jobs()
  UPDATE public.payments
  SET 
    status = p_status,
    iyzico_payment_id = p_iyzico_payment_id,
    processed_at = now(),
    webhook_processed_at = now(),
    updated_at = now()
  WHERE iyzico_token = p_token
    AND webhook_processed_at IS NULL
  RETURNING id, user_id, listing_id, package_id INTO v_payment;

  -- 2. If no payment was updated (either not found or already processed)
  IF NOT FOUND THEN
    SELECT id INTO v_payment FROM public.payments WHERE iyzico_token = p_token AND webhook_processed_at IS NOT NULL;
    IF FOUND THEN
      RETURN jsonb_build_object('success', true, 'status', 'already_processed', 'payment_id', v_payment.id);
    ELSE
      RETURN jsonb_build_object('success', false, 'status', 'not_found');
    END IF;
  END IF;

  -- 3. Increment webhook attempts
  UPDATE public.payments
  SET webhook_attempts = COALESCE(webhook_attempts, 0) + 1
  WHERE iyzico_token = p_token;

  -- 4. Mark log as processed (the audit trail)
  UPDATE public.payment_webhook_logs
  SET status = 'processed'
  WHERE payload->>'token' = p_token;

  RETURN jsonb_build_object(
    'success', true, 
    'status', 'processed',
    'payment_id', v_payment.id, 
    'job_id', NULL -- Managed asynchronously by DB trigger
  );
END;
$$;


-- ==========================================================================
-- 2. FIX ITEM 3: Exception-Safe Atomic Chat Creation & Redundant Triggers
-- ==========================================================================

-- Drop duplicate trigger from messages table
DROP TRIGGER IF EXISTS messages_touch_chat_last_message_at ON public.messages;

-- Rewrite create_chat_atomic to handle concurrency exceptions safely via unique_violation
CREATE OR REPLACE FUNCTION public.create_chat_atomic(
  p_listing_id uuid, 
  p_buyer_id uuid, 
  p_seller_id uuid, 
  p_system_message text DEFAULT 'Chat başlatıldı.'::text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chat_id uuid;
BEGIN
  -- Check if already exists
  SELECT id INTO v_chat_id
  FROM public.chats
  WHERE listing_id = p_listing_id
    AND buyer_id = p_buyer_id
    AND seller_id = p_seller_id;
    
  IF v_chat_id IS NOT NULL THEN
    RETURN v_chat_id;
  END IF;

  -- Use subblock to trap potential concurrent insertion collision
  BEGIN
    -- Create chat
    INSERT INTO public.chats (listing_id, buyer_id, seller_id, status)
    VALUES (p_listing_id, p_buyer_id, p_seller_id, 'active')
    RETURNING id INTO v_chat_id;

    -- Create initial message
    INSERT INTO public.messages (chat_id, sender_id, content, message_type, is_read)
    VALUES (v_chat_id, p_buyer_id, p_system_message, 'system', true);
  EXCEPTION WHEN unique_violation THEN
    -- Concurrent session successfully created it, select the created chat
    SELECT id INTO v_chat_id
    FROM public.chats
    WHERE listing_id = p_listing_id
      AND buyer_id = p_buyer_id
      AND seller_id = p_seller_id;
  END;

  RETURN v_chat_id;
END;
$$;


-- ==========================================================================
-- 3. FIX ITEM 5: Drop Conflicting Search Vector Trigger
-- ==========================================================================

-- Drop conflicting search vector trigger because search_vector is GENERATED ALWAYS AS STORED
DROP TRIGGER IF EXISTS trg_listings_search_vector ON public.listings;
DROP FUNCTION IF EXISTS public.update_listing_search_vector();


-- ==========================================================================
-- 4. FIX ITEM 2: Database-Level Atomic Quota Validation
-- ==========================================================================

-- Function to enforce the listing limit atomically inside insertion transaction
CREATE OR REPLACE FUNCTION public.trigger_validate_listing_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call locking validator logic. If it returns false, abort insert transaction
  IF NOT public.check_and_reserve_listing_quota(NEW.seller_id) THEN
    RAISE EXCEPTION 'Quota exceeded: User reached maximum allowed active listings.' 
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Bind the trigger before insert
DROP TRIGGER IF EXISTS trigger_enforce_listing_quota ON public.listings;
CREATE TRIGGER trigger_enforce_listing_quota
BEFORE INSERT ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.trigger_validate_listing_quota();

COMMIT;
