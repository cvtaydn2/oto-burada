-- Migration: Add next_attempt_at to transaction_outbox
-- Purpose: Fix runtime error in outbox-processor.ts and enable scheduled retries.
-- Date: 2026-04-27

ALTER TABLE public.transaction_outbox 
ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ DEFAULT NOW();

-- Index for performance (used by outbox-processor)
CREATE INDEX IF NOT EXISTS idx_outbox_next_attempt 
ON public.transaction_outbox(next_attempt_at) 
WHERE status = 'pending';

-- Documentation of change
COMMENT ON COLUMN public.transaction_outbox.next_attempt_at IS 'Scheduled time for the next processing attempt. Used for backoff retries.';
