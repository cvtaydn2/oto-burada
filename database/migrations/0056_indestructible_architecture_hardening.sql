-- Migration: Indestructible Architecture Hardening
-- Purpose: Poison Pill Isolation, Sticky Master Tracking, and FinOps Deadlines.
-- Date: 2026-04-21

-- ── 1. Outbox Hardening (Issue 2 & 8) ──────────────────────────────────
-- Add poison pill tracking and hard deadlines to outbox.
ALTER TABLE transaction_outbox ADD COLUMN IF NOT EXISTS is_poison_pill BOOLEAN DEFAULT FALSE;
ALTER TABLE transaction_outbox ADD COLUMN IF NOT EXISTS hard_deadline TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours');

ALTER TABLE compensating_actions ADD COLUMN IF NOT EXISTS is_poison_pill BOOLEAN DEFAULT FALSE;
ALTER TABLE compensating_actions ADD COLUMN IF NOT EXISTS hard_deadline TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours');

-- ── 2. Sticky Master Support (Issue 1) ──────────────────────────────────
-- While cookies handle this client-side, we can track "Last Write" for critical users
-- to enforce master-read on the server-side as well for a specific duration.
CREATE TABLE IF NOT EXISTS user_read_writes_tracker (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_write_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. High-Traffic Canonical Search (Issue 7) ──────────────────────────
-- Store canonical versions of popular search queries to minimize DB hits.
CREATE TABLE IF NOT EXISTS canonical_search_cache (
  query_hash TEXT PRIMARY KEY,
  query_string TEXT NOT NULL,
  results_count INTEGER,
  last_checked_at TIMESTAMPTZ DEFAULT NOW()
);
