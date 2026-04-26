-- =============================================================================
-- Migration 0103: Atomic Payment Webhook Processing
-- =============================================================================

DROP FUNCTION IF EXISTS public.process_payment_webhook(text, text, text);

CREATE OR REPLACE FUNCTION public.process_payment_webhook(
  p_token TEXT,
  p_status TEXT,
  p_iyzico_payment_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_job_id UUID;
BEGIN
  -- 1. Atomic lock: Only one worker can set webhook_processed_at to non-null
  UPDATE public.payments
  SET 
    status = p_status,
    iyzico_payment_id = p_iyzico_payment_id,
    processed_at = now(),
    webhook_processed_at = now(),
    updated_at = now()
  WHERE iyzico_token = p_token
    AND webhook_processed_at IS NULL -- Atomic check
  RETURNING id, user_id, listing_id, package_id INTO v_payment;

  -- 2. If no payment was updated (either not found or already processed)
  IF NOT FOUND THEN
    -- Check if it was already processed
    SELECT id INTO v_payment FROM public.payments WHERE iyzico_token = p_token AND webhook_processed_at IS NOT NULL;
    IF FOUND THEN
      RETURN jsonb_build_object('success', true, 'status', 'already_processed', 'payment_id', v_payment.id);
    ELSE
      RETURN jsonb_build_object('success', false, 'status', 'not_found');
    END IF;
  END IF;

  -- 3. Queue fulfillment job if success and meta exists
  IF p_status = 'success' AND v_payment.listing_id IS NOT NULL AND v_payment.package_id IS NOT NULL THEN
    -- Using the existing create_fulfillment_job logic
    INSERT INTO public.fulfillment_jobs (
      payment_id,
      job_type,
      metadata
    ) VALUES (
      v_payment.id,
      'doping_apply',
      jsonb_build_object(
        'listing_id', v_payment.listing_id,
        'package_id', v_payment.package_id,
        'user_id', v_payment.user_id
      )
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_job_id;
  END IF;

  -- 4. Increment webhook attempts
  UPDATE public.payments
  SET webhook_attempts = COALESCE(webhook_attempts, 0) + 1
  WHERE iyzico_token = p_token;

  -- 5. Mark log as processed (the audit trail)
  UPDATE public.payment_webhook_logs
  SET status = 'processed'
  WHERE payload->>'token' = p_token;

  RETURN jsonb_build_object(
    'success', true, 
    'status', 'processed',
    'payment_id', v_payment.id, 
    'job_id', v_job_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_payment_webhook(text, text, text) TO service_role;
