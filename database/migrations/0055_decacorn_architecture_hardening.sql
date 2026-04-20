-- Migration: Decacorn Architecture Hardening
-- Purpose: Implement Crypto-Shredding, Compensating Actions, and Per-User Key Management.
-- Date: 2026-04-21

-- ── 1. User Encryption Keys (Crypto-Shredding / Issue 4) ────────────────
-- Stores per-user keys for encrypting PII. Deleting the key = shredding the data.
CREATE TABLE IF NOT EXISTS user_encryption_keys (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  encryption_key TEXT NOT NULL, -- Encrypted wrapping key or double-wrapped key
  algorithm TEXT DEFAULT 'aes-256-gcm',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Only service-role or specific functions can read these.
ALTER TABLE user_encryption_keys ENABLE ROW LEVEL SECURITY;

-- ── 2. Compensating Action Outbox (Refunds/Saga Reliability / Issue 9) ───
-- Specifically for events that MUST be retried until success (e.g. refunds).
CREATE TABLE IF NOT EXISTS compensating_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL, -- External ID like Iyzico paymentId
  action_type TEXT NOT NULL, -- e.g. 'refund', 'revert_listing'
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'manual_intervention_required')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 10,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_compensating_pending ON compensating_actions(next_attempt_at) WHERE status = 'pending';

-- ── 3. Negative Cache Monitoring (Issue 2) ──────────────────────────────
-- Track high-frequency non-existent queries for potential bloom filter tuning.
CREATE TABLE IF NOT EXISTS missing_resource_logs (
  id BIGSERIAL PRIMARY KEY,
  resource_type TEXT NOT NULL, -- e.g. 'listing_slug', 'search_query'
  resource_key TEXT NOT NULL,
  hit_count INTEGER DEFAULT 1,
  last_requested_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_missing_resource_key ON missing_resource_logs(resource_type, resource_key);

-- ── 4. Storage Lifecycle Tags (Issue 7) ─────────────────────────────────
ALTER TABLE storage_objects_registry ADD COLUMN IF NOT EXISTS lifecycle_tier TEXT DEFAULT 'hot' CHECK (lifecycle_tier IN ('hot', 'warm', 'cold', 'archived'));
ALTER TABLE storage_objects_registry ADD COLUMN IF NOT EXISTS tier_moved_at TIMESTAMPTZ;
