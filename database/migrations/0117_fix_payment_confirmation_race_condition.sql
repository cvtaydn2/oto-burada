-- =============================================================================
-- Migration 0117: Fix Payment Confirmation Race Condition & Idempotency
-- =============================================================================

-- 1. Ensure idempotency for fulfillment jobs
-- This prevents duplicate fulfillment if both callback and webhook trigger simultaneously
DO $$ 
BEGIN
    -- Cleanup any existing duplicates before adding constraint (safe approach)
    DELETE FROM public.fulfillment_jobs a USING (
      SELECT MIN(ctid) as ctid, payment_id, job_type
      FROM public.fulfillment_jobs 
      GROUP BY payment_id, job_type HAVING COUNT(*) > 1
    ) b
    WHERE a.payment_id = b.payment_id 
      AND a.job_type = b.job_type 
      AND a.ctid <> b.ctid;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_payment_job'
    ) THEN
        ALTER TABLE public.fulfillment_jobs 
        ADD CONSTRAINT unique_payment_job UNIQUE (payment_id, job_type);
    END IF;
END $$;

-- 2. Update confirm_payment_success to be more robust
-- Now it also sets webhook_processed_at and queues fulfillment
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
  -- 1. Atomic Update: Transitions from pending -> success
  -- We ALSO set webhook_processed_at to 'claim' it, so the webhook knows it is done.
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
