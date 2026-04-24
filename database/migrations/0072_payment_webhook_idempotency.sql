-- Add webhook_processed_at to payments for idempotency protection
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS webhook_processed_at timestamptz;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_payments_iyzico_token_webhook_processed ON public.payments (iyzico_token) WHERE webhook_processed_at IS NULL;

-- Atomic increment for webhook attempts
CREATE OR REPLACE FUNCTION public.increment_webhook_attempts(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.payments
  SET webhook_attempts = webhook_attempts + 1,
      updated_at = timezone('utc', now())
  WHERE iyzico_token = p_token;
END;
$$;
