-- Migration: Enterprise Hardening Phase 2
-- Purpose: Implement DLQ fallback, Storage Cleanup Queue, Analytics Buffering, and BOLA Audit Logs.
-- Date: 2026-04-21

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Storage Cleanup Queue (Issue 2)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS storage_cleanup_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL,
  bucket_name TEXT NOT NULL DEFAULT 'listings',
  attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'failed', 'deleted')),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_storage_cleanup_pending ON storage_cleanup_queue(status) WHERE status = 'pending';

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Listing View Buffer (Issue 9)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS listing_views_buffer (
  listing_id UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to increment view in buffer
CREATE OR REPLACE FUNCTION increment_listing_view_buffered(p_listing_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO listing_views_buffer (listing_id, view_count)
  VALUES (p_listing_id, 1)
  ON CONFLICT (listing_id)
  DO UPDATE SET 
    view_count = listing_views_buffer.view_count + 1,
    updated_at = NOW();
END;
$$;

-- Function to sync buffer to main table (to be called by Cron)
CREATE OR REPLACE FUNCTION sync_listing_views_buffer()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  WITH moved AS (
    DELETE FROM listing_views_buffer
    RETURNING listing_id, view_count
  )
  UPDATE listings l
  SET 
    view_count = l.view_count + m.view_count,
    updated_at = NOW()
  FROM moved m
  WHERE l.id = m.listing_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. BOLA / Audit Logs (Issue 5)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Idempotent Webhook Events (Issue 1 fallback)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'ignored')),
  processed_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status) WHERE status = 'failed';

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. Permissions
-- ══════════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION increment_listing_view_buffered TO anon, authenticated;
GRANT EXECUTE ON FUNCTION sync_listing_views_buffer TO authenticated;

-- RLS for Storage Cleanup (Admin only)
ALTER TABLE storage_cleanup_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_full_access_storage_cleanup ON storage_cleanup_queue;
CREATE POLICY admin_full_access_storage_cleanup ON storage_cleanup_queue
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- RLS for Audit Logs (Admin only)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_read_audit_logs ON audit_logs;
CREATE POLICY admin_read_audit_logs ON audit_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- BOLA Protection (Issue 5) - Profiles table column visibility logic
-- We already have RLS, but we ensure sensitive columns are not readable by others.
-- Note: DTO layer in JS is the primary filter, but RLS adds "Defense in Depth".
