-- Migration: Add unique constraint on payment_webhook_logs.token for idempotency
-- Date: 2025-04-27
-- Purpose: Prevent duplicate webhook log entries during Iyzico webhook retries

-- Add unique constraint on token column
-- This ensures that each webhook with the same token is logged only once
ALTER TABLE payment_webhook_logs
ADD CONSTRAINT payment_webhook_logs_token_unique UNIQUE (token);

-- Add index for faster token lookups (if not already covered by unique constraint)
-- Note: Unique constraints automatically create an index, so this is optional
-- CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_token ON payment_webhook_logs(token);

-- Add comment for documentation
COMMENT ON CONSTRAINT payment_webhook_logs_token_unique ON payment_webhook_logs IS 
'Ensures idempotency for Iyzico webhook processing - prevents duplicate logs on retry';
