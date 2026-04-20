-- Migration: Hyper-Scale Hardening
-- Purpose: Implement Outbox Pattern, Partitioning Infrastructure, and advanced data protection.
-- Date: 2026-04-21

-- ── 1. Transaction Outbox Table (Reliability/Saga) ────────────────────
-- Captures events that MUST happen after a transaction (like emails, syncs).
CREATE TABLE IF NOT EXISTS transaction_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON transaction_outbox(status) WHERE status = 'pending';

-- ── 2. Audit Logs Partitioning Preparation ──────────────────────────
-- For hyper-scale, we prepare audit_logs to be partition-friendly.
-- Since we can't easily partition an existing table with data without downtime, 
-- we'll create a partitioned version of audit_logs for the future or ensure current indexes are optimized.
-- For now, we add a BRIN index which is much more efficient for timestamp-heavy large tables.
CREATE INDEX IF NOT EXISTS idx_audit_logs_brin_created ON audit_logs USING BRIN (created_at);

-- ── 3. Phishing Pattern Registry ──────────────────────────────────────
-- Store regex patterns for server-side masking if needed as a config.
CREATE TABLE IF NOT EXISTS security_blacklist_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name TEXT NOT NULL UNIQUE,
  regex_pattern TEXT NOT NULL,
  action TEXT DEFAULT 'mask' CHECK (action IN ('mask', 'block', 'flag')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO security_blacklist_patterns (pattern_name, regex_pattern, action)
VALUES 
  ('iban', 'TR\d{24}|TR \d{4} \d{4} \d{4} \d{4} \d{4} \d{4} \d{2}', 'mask'),
  ('phone', '(\+90|0)?\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}', 'mask'),
  ('url', '(https?:\/\/[^\s]+)', 'mask')
ON CONFLICT (pattern_name) DO UPDATE SET regex_pattern = EXCLUDED.regex_pattern;

-- ── 4. Storage Usage Quotas (Storage Cost Control) ──────────────────
-- Track per-user storage usage in bytes for stricter quotas.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS storage_usage_bytes BIGINT DEFAULT 0;

-- ── 5. Locked Until field for Soft Reservations (Redundance check) ─────
-- Issue 9 optimization
ALTER TABLE listings ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_listings_locked_until ON listings(locked_until) WHERE locked_until IS NOT NULL;
