-- Migration: Payment State Machine & Financial Security
-- Purpose: Implement secure payment lifecycle with idempotent operations
-- Issues Fixed:
--   1. Payment/doping coupling - separate concerns
--   2. Race conditions in payment processing
--   3. Missing immutable audit trail
--   4. No payment state machine
-- Date: 2026-04-19

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Payment State Machine - Add Status Constraints
-- ══════════════════════════════════════════════════════════════════════════════

-- Add payment lifecycle states if not exists
DO $$ 
BEGIN
  -- Check if status column exists and has proper constraints
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'status'
  ) THEN
    -- Drop existing constraint if any
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
    
    -- Add new constraint with full state machine
    ALTER TABLE payments ADD CONSTRAINT payments_status_check 
      CHECK (status IN ('pending', 'processing', 'success', 'failure', 'refunded', 'cancelled'));
  END IF;
END $$;

-- Add payment processing metadata
ALTER TABLE payments 
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS webhook_attempts INTEGER DEFAULT 0;

-- Create index for idempotency checks
CREATE INDEX IF NOT EXISTS idx_payments_idempotency_key 
  ON payments(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Create index for webhook processing
CREATE INDEX IF NOT EXISTS idx_payments_iyzico_token 
  ON payments(iyzico_token) WHERE iyzico_token IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Immutable Credit Ledger - Ensure Append-Only
-- ══════════════════════════════════════════════════════════════════════════════

-- Prevent updates to credit_transactions (append-only ledger)
CREATE OR REPLACE FUNCTION prevent_credit_transaction_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow INSERT, block UPDATE and DELETE
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Credit transactions are immutable. Cannot update transaction %.', OLD.id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Credit transactions are immutable. Cannot delete transaction %.', OLD.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS prevent_credit_transaction_modifications ON credit_transactions;

CREATE TRIGGER prevent_credit_transaction_modifications
  BEFORE UPDATE OR DELETE ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_credit_transaction_updates();

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. Atomic Payment Processing with State Transitions
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION process_payment_success(
  p_payment_id UUID,
  p_iyzico_payment_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_credits_added INTEGER;
  v_transaction_id UUID;
BEGIN
  -- 1. Lock payment record for update (prevent race conditions)
  SELECT * INTO v_payment
  FROM payments
  WHERE id = p_payment_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found: %', p_payment_id;
  END IF;
  
  -- 2. Idempotency check - if already processed, return success
  IF v_payment.status = 'success' AND v_payment.fulfilled_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'message', 'Payment already processed',
      'payment_id', p_payment_id
    );
  END IF;
  
  -- 3. Validate state transition (only pending/processing can become success)
  IF v_payment.status NOT IN ('pending', 'processing') THEN
    RAISE EXCEPTION 'Invalid state transition: % -> success', v_payment.status;
  END IF;
  
  -- 4. Update payment status
  UPDATE payments
  SET 
    status = 'success',
    processed_at = NOW(),
    iyzico_payment_id = COALESCE(p_iyzico_payment_id, iyzico_payment_id),
    updated_at = NOW()
  WHERE id = p_payment_id;
  
  -- 5. Process based on payment type
  IF (v_payment.metadata->>'type') = 'plan_purchase' THEN
    -- Credit purchase - add credits to user balance
    v_credits_added := (v_payment.metadata->>'credits')::INTEGER;
    
    IF v_credits_added IS NULL OR v_credits_added <= 0 THEN
      RAISE EXCEPTION 'Invalid credits amount in payment metadata';
    END IF;
    
    -- Log credit transaction (immutable audit trail)
    INSERT INTO credit_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      reference_id,
      metadata
    )
    VALUES (
      v_payment.user_id,
      v_credits_added,
      'purchase',
      'Plan purchase: ' || COALESCE(v_payment.plan_name, 'Unknown'),
      p_payment_id::TEXT,
      jsonb_build_object(
        'payment_id', p_payment_id,
        'plan_id', v_payment.plan_id,
        'plan_name', v_payment.plan_name
      )
    )
    RETURNING id INTO v_transaction_id;
    
    -- Update user balance (atomic)
    PERFORM increment_user_credits(v_payment.user_id, v_credits_added);
    
  ELSIF (v_payment.metadata->>'type') = 'doping' THEN
    -- Doping purchase - will be applied separately by doping service
    -- Just mark as fulfilled, actual doping application happens in service layer
    v_credits_added := 0;
  ELSE
    RAISE EXCEPTION 'Unknown payment type: %', v_payment.metadata->>'type';
  END IF;
  
  -- 6. Mark as fulfilled
  UPDATE payments
  SET fulfilled_at = NOW()
  WHERE id = p_payment_id;
  
  -- 7. Return success
  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'message', 'Payment processed successfully',
    'payment_id', p_payment_id,
    'credits_added', v_credits_added,
    'transaction_id', v_transaction_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Payment processing failed: %', SQLERRM;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Secure Doping Application (Separate from Payment)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION apply_listing_doping(
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
  -- 1. Verify listing ownership
  SELECT * INTO v_listing
  FROM listings
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
        -- Only apply if not already active
        IF v_listing.featured_until IS NULL OR v_listing.featured_until < NOW() THEN
          UPDATE listings
          SET 
            featured = true,
            featured_until = v_expires_at,
            updated_at = NOW()
          WHERE id = p_listing_id;
          
          v_applied_count := v_applied_count + 1;
        END IF;
        
      WHEN 'urgent' THEN
        IF v_listing.urgent_until IS NULL OR v_listing.urgent_until < NOW() THEN
          UPDATE listings
          SET 
            urgent_until = v_expires_at,
            updated_at = NOW()
          WHERE id = p_listing_id;
          
          v_applied_count := v_applied_count + 1;
        END IF;
        
      WHEN 'highlighted' THEN
        IF v_listing.highlighted_until IS NULL OR v_listing.highlighted_until < NOW() THEN
          UPDATE listings
          SET 
            highlighted_until = v_expires_at,
            updated_at = NOW()
          WHERE id = p_listing_id;
          
          v_applied_count := v_applied_count + 1;
        END IF;
        
      ELSE
        RAISE EXCEPTION 'Unknown doping type: %', v_doping_type;
    END CASE;
    
    -- 4. Log doping application (audit trail)
    INSERT INTO doping_applications (
      listing_id,
      user_id,
      doping_type,
      duration_days,
      expires_at,
      payment_id,
      metadata
    )
    VALUES (
      p_listing_id,
      p_user_id,
      v_doping_type,
      p_duration_days,
      v_expires_at,
      p_payment_id,
      jsonb_build_object(
        'applied_at', NOW(),
        'expires_at', v_expires_at
      )
    );
  END LOOP;
  
  -- 5. Return result
  RETURN jsonb_build_object(
    'success', true,
    'listing_id', p_listing_id,
    'applied_count', v_applied_count,
    'expires_at', v_expires_at
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Doping application failed: %', SQLERRM;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. Idempotent Webhook Processing
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION process_payment_webhook(
  p_iyzico_token TEXT,
  p_status TEXT,
  p_iyzico_payment_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_result JSONB;
BEGIN
  -- 1. Find payment by iyzico token (idempotency key)
  SELECT * INTO v_payment
  FROM payments
  WHERE iyzico_token = p_iyzico_token
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Webhook arrived before payment record - create orphan record
    INSERT INTO payments (
      iyzico_token,
      iyzico_payment_id,
      status,
      amount,
      currency,
      provider,
      description,
      metadata
    )
    VALUES (
      p_iyzico_token,
      p_iyzico_payment_id,
      CASE WHEN p_status = 'SUCCESS' THEN 'success' ELSE 'failure' END,
      0,
      'TRY',
      'iyzico',
      'Webhook orphan - payment record not found',
      jsonb_build_object('orphan', true, 'webhook_status', p_status)
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'orphan', true,
      'message', 'Orphan payment record created'
    );
  END IF;
  
  -- 2. Increment webhook attempt counter
  UPDATE payments
  SET webhook_attempts = COALESCE(webhook_attempts, 0) + 1
  WHERE id = v_payment.id;
  
  -- 3. Idempotency check
  IF v_payment.status = 'success' AND v_payment.fulfilled_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'message', 'Webhook already processed'
    );
  END IF;
  
  -- 4. Process based on status
  IF p_status = 'SUCCESS' THEN
    -- Process successful payment
    v_result := process_payment_success(v_payment.id, p_iyzico_payment_id);
    
    -- Mark as notified
    UPDATE payments
    SET notified_at = NOW()
    WHERE id = v_payment.id;
    
    RETURN v_result;
    
  ELSE
    -- Mark as failed
    UPDATE payments
    SET 
      status = 'failure',
      processed_at = NOW(),
      iyzico_payment_id = COALESCE(p_iyzico_payment_id, iyzico_payment_id),
      updated_at = NOW()
    WHERE id = v_payment.id;
    
    RETURN jsonb_build_object(
      'success', true,
      'payment_failed', true,
      'message', 'Payment marked as failed'
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Webhook processing failed: %', SQLERRM;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. Grant Permissions
-- ══════════════════════════════════════════════════════════════════════════════

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION process_payment_success TO authenticated;
GRANT EXECUTE ON FUNCTION apply_listing_doping TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_webhook TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_webhook TO anon; -- Webhook endpoint needs this

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. Comments for Documentation
-- ══════════════════════════════════════════════════════════════════════════════

COMMENT ON FUNCTION process_payment_success IS 
'Atomically processes a successful payment with idempotency guarantees. 
Handles credit purchases and marks doping payments as ready for application.';

COMMENT ON FUNCTION apply_listing_doping IS 
'Securely applies doping effects to a listing after payment verification.
Separate from payment processing to maintain clear boundaries.';

COMMENT ON FUNCTION process_payment_webhook IS 
'Idempotent webhook processor for Iyzico payment notifications.
Uses iyzico_token as idempotency key to prevent double-processing.';

COMMENT ON TRIGGER prevent_credit_transaction_modifications ON credit_transactions IS 
'Enforces immutability of credit_transactions table (append-only ledger).';
