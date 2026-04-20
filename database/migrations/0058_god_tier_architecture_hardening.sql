-- Migration: God-Tier Ecosystem Hardening
-- Purpose: Out-of-Order Protection, Anti-Deletion Triggers, and Price Analytics.
-- Date: 2026-04-21

-- ── 1. Out-of-Order Protection (Issue 4) ──────────────────────────────
-- Every status-bearing table should track the last event timestamp.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_synced_at TIMESTAMPTZ DEFAULT NOW();

-- ── 2. "Immortal" Trigger Guard (Issue 8 - Blast Radius) ───────────────
-- Prevents bulk deletions even by service_role on critical tables.
-- Deletions must pass an 'confirm_bulk_delete' setting.
CREATE OR REPLACE FUNCTION protect_critical_table() 
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT current_setting('app.confirm_bulk_delete', true)) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Bulk deletion on this critical table is forbidden. Set app.confirm_bulk_delete = true first.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply to user_quotas (Protecting the money/limits)
DO $$
BEGIN
  CREATE TRIGGER trigger_protect_quotas
  BEFORE DELETE ON user_quotas
  FOR EACH ROW EXECUTE FUNCTION protect_critical_table();
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- ── 3. Price Outlier Tracking (Issue 1) ────────────────────────────────
-- Store realized prices for better fair-market-value calculations.
CREATE TABLE IF NOT EXISTS realized_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  category_id UUID NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  sale_price DECIMAL(15,2) NOT NULL,
  sold_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_realized_sales_lookup ON realized_sales(category_id, brand, model, year);
