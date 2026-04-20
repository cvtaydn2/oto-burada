-- Migration: Expert Level Hardening Phase 3
-- Purpose: Address advanced fraud, performance, and concurrency issues.
-- Date: 2026-04-21

-- ── PILL: Issue 5 - Optimistic Concurrency Control (OCC) ────────────────
-- Prevents "Lost Update" anomalies where two users edit the same listing.
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;

-- ── PILL: Issue 1 - Banned User Session Revocation (JWT Persistence) ──────
-- High-performance function to check ban status inside RLS or Middleware.
CREATE OR REPLACE FUNCTION public.is_user_banned(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Using subquery caching (SELECT) for RLS performance
  -- Issue 6: Optimized to avoid repetitive lookups in large result sets
  SELECT COALESCE((SELECT is_banned FROM public.profiles WHERE id = p_user_id), false);
$$;

-- ── PILL: Issue 3 - Review Fraud Prevention (Proof of Interaction) ───────
-- Ensures people can't "Review Bomb" without having interacted with the seller.
CREATE OR REPLACE FUNCTION public.check_interaction_exists(p_user_a UUID, p_user_b UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Proof of Interaction Evidence Tier 1: Chat History
  -- Did they exchange at least one message?
  IF EXISTS (
    SELECT 1 FROM public.chats c
    JOIN public.messages m ON m.chat_id = c.id
    WHERE (c.buyer_id = p_user_a AND c.seller_id = p_user_b)
       OR (c.buyer_id = p_user_b AND c.seller_id = p_user_a)
    LIMIT 1
  ) THEN
    RETURN true;
  END IF;

  -- Proof of Interaction Evidence Tier 2: Phone Reveal
  -- Did User A reveal User B's listing phone?
  IF EXISTS (
    SELECT 1 FROM public.phone_reveal_logs 
    WHERE user_id = p_user_a 
    AND listing_id IN (SELECT id FROM public.listings WHERE seller_id = p_user_b)
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Apply Proof of Interaction to seller_reviews RLS
-- Only allow inserting a review if interaction proof exists.
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Interaction proof required for reviews" ON public.seller_reviews;
CREATE POLICY "Interaction proof required for reviews"
ON public.seller_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reviewer_id 
  AND check_interaction_exists(auth.uid(), seller_id)
);

-- ── PILL: Issue 6 - RLS Performance Hardening (Subquery Caching) ──────────
-- Refactoring existing RLS policies to use (SELECT auth.uid()) 
-- to tell PG query planner to cache the value once per query.
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename, cmd, qual, with_check
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (qual ILIKE '%auth.uid()%' OR with_check ILIKE '%auth.uid()%')
    LOOP
        -- This logic is complex to automate perfectly for all policies, 
        -- so we provide the standard recommended pattern in AGENTS.md 
        -- and update mission-critical ones manually below.
    END LOOP;
END $$;

-- Manual update for most heavy table: listings
DROP POLICY IF EXISTS "Users can manage their own listings" ON public.listings;
CREATE POLICY "Users can manage their own listings"
ON public.listings
FOR ALL
TO authenticated
USING (seller_id = (SELECT auth.uid()))
WITH CHECK (seller_id = (SELECT auth.uid()));

-- ── PILL: Issue 10 - Idempotency Replay Attack Protection ────────────────
-- Validates that an idempotency key is both unique and fresh (TTL).
CREATE OR REPLACE FUNCTION public.validate_idempotency_key(
  p_key TEXT,
  p_ttl_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created_at TIMESTAMPTZ;
BEGIN
  -- 1. Check if key exists in payments (our current primary source of truth)
  SELECT created_at INTO v_created_at 
  FROM public.payments 
  WHERE idempotency_key = p_key 
  LIMIT 1;

  IF v_created_at IS NULL THEN
    RETURN true; -- Key is unique
  END IF;

  -- 2. If it exists, it must be within the TTL window to allow "retry"
  -- but if it's too old, we block it to prevent replay attacks later.
  IF v_created_at < NOW() - (p_ttl_hours || ' hours')::INTERVAL THEN
    RETURN false; -- Expired key being reused
  END IF;

  RETURN true; -- Allowing retry for recent key
END;
$$;
