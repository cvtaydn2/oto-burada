-- Migration: Payment Webhook Audit Hardening
-- Purpose: Create immutable audit trail for all incoming payment webhooks

-- 1. Create Webhook Logging Table
CREATE TABLE IF NOT EXISTS public.payment_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'iyzico',
  token text, -- iyzico token
  payload jsonb NOT NULL,
  headers jsonb NOT NULL,
  status text NOT NULL, -- 'received', 'processed', 'invalid_signature', 'error'
  error_message text,
  processing_ms integer,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Index for debugging/lookup
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_token ON public.payment_webhook_logs(token) WHERE token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_created_at ON public.payment_webhook_logs(created_at DESC);

-- 2. RLS Policies (Admin Only)
ALTER TABLE public.payment_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_webhook_logs" ON public.payment_webhook_logs
  FOR ALL USING (public.is_admin());

-- 3. Comments
COMMENT ON TABLE public.payment_webhook_logs IS 'Immutable audit trail for all incoming payment webhooks for debugging and failure analysis.';
