CREATE INDEX IF NOT EXISTS idx_payments_stale_cleanup
  ON public.payments (status, created_at)
  WHERE fulfilled_at IS NULL
    AND status IN ('pending', 'processing');
