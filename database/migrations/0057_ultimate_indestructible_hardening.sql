-- Migration: Ultimate "Indestructible" Hardening
-- Purpose: RPC Security, Compliance Vacuum, and Atomic Quotas.
-- Date: 2026-04-21

-- ── 1. RPC Search Path Hardening (Issue 8) ─────────────────────────────
-- Ensure all existing SECURITY DEFINER functions have a restricted search_path.
-- Note: This template needs to be applied to specific functions as they are created.
-- Example: 
-- CREATE OR REPLACE FUNCTION admin_perform_action(...) ... SECURITY DEFINER SET search_path = public;

-- ── 2. Compliance Vacuum / Hard Delete (Issue 9) ───────────────────────
-- Track deletion deadlines for archived content.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deletion_deadline TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_listings_deletion_deadline ON listings(deletion_deadline) WHERE deletion_deadline IS NOT NULL;

-- ── 3. Atomic Quotas (Issue 2) ─────────────────────────────────────────
-- Quotas should be decremented with a WHERE clause, never SELECT then UPDATE.
CREATE TABLE IF NOT EXISTS user_quotas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_credits INTEGER DEFAULT 3 CHECK (listing_credits >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Canonical IDs / Hashids (Issue 10) ──────────────────────────────
-- Sequential ID for listings that will be hashed for external use.
CREATE SEQUENCE IF NOT EXISTS listing_display_id_seq START 1000000;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS display_id BIGINT DEFAULT nextval('listing_display_id_seq');
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_display_id ON listings(display_id);
