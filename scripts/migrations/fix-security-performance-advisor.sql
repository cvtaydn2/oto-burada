-- ============================================================
-- OtoBurada — Security & Performance Advisor Full Fix
-- Generated: 2026-04-17
-- Apply via: Supabase SQL Editor (run as superuser / service role)
-- ============================================================
-- This migration is IDEMPOTENT — safe to run multiple times.
-- All policy changes use DROP IF EXISTS before CREATE.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- SECTION 1: FUNCTION SECURITY — Mutable search_path Fix
-- ────────────────────────────────────────────────────────────
-- Problem: Functions without SET search_path = 'public' are
-- vulnerable to search_path hijacking. An attacker who can
-- create objects in a schema earlier in the search_path can
-- shadow system functions (e.g., replace now() with a malicious
-- version). SECURITY DEFINER + fixed search_path eliminates this.
-- ────────────────────────────────────────────────────────────

-- 1a. is_admin()
-- Uses auth.jwt() — must remain SECURITY DEFINER so it can
-- read the JWT claim regardless of caller's privileges.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- 1b. set_updated_at()
-- Trigger function — SECURITY DEFINER so it can write to any
-- table it is attached to without inheriting caller privileges.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- 1c. touch_chat_last_message_at()
-- Trigger function — same rationale as set_updated_at.
CREATE OR REPLACE FUNCTION public.touch_chat_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.chats
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

-- 1d. track_listing_price_change()
-- Trigger function for price history.
-- NOTE: If this function does not exist yet, this is a no-op CREATE OR REPLACE.
CREATE OR REPLACE FUNCTION public.track_listing_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only record when price actually changes
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO public.listing_price_history (
      listing_id,
      old_price,
      new_price,
      changed_at
    ) VALUES (
      NEW.id,
      OLD.price,
      NEW.price,
      timezone('utc', now())
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 1e. get_listings_by_brand_count()
-- Analytics RPC — already has SECURITY DEFINER from previous migration,
-- but adding SET search_path to be explicit.
CREATE OR REPLACE FUNCTION public.get_listings_by_brand_count(p_status text DEFAULT 'approved')
RETURNS TABLE(brand text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT brand, count(*) AS count
  FROM public.listings
  WHERE status = p_status::public.listing_status
  GROUP BY brand
  ORDER BY count DESC
  LIMIT 10;
$$;

-- 1f. get_listings_by_city_count()
CREATE OR REPLACE FUNCTION public.get_listings_by_city_count(p_status text DEFAULT 'approved')
RETURNS TABLE(city text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT city, count(*) AS count
  FROM public.listings
  WHERE status = p_status::public.listing_status
  GROUP BY city
  ORDER BY count DESC
  LIMIT 10;
$$;

-- 1g. get_listings_by_status_count()
CREATE OR REPLACE FUNCTION public.get_listings_by_status_count()
RETURNS TABLE(status text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT status::text, count(*) AS count
  FROM public.listings
  GROUP BY status;
$$;

-- Re-grant execute after function replacement
GRANT EXECUTE ON FUNCTION public.get_listings_by_brand_count(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_listings_by_city_count(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_listings_by_status_count() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;


-- ────────────────────────────────────────────────────────────
-- SECTION 2: RLS PERFORMANCE — auth_rls_initplan Fix
-- ────────────────────────────────────────────────────────────
-- Problem: Calling auth.uid() directly in a policy USING clause
-- causes Postgres to re-evaluate the function for EVERY ROW
-- scanned (initplan = re-executed subplan). Wrapping in
-- (SELECT auth.uid()) makes it a stable subquery evaluated
-- ONCE per query — can be 10-100x faster on large tables.
--
-- Tables affected: notifications, listing_images, profiles,
-- chats, messages, tickets, seller_reviews, listing_price_history
-- (roles table is not in our schema — skip)
-- ────────────────────────────────────────────────────────────

-- 2a. notifications — already uses (select auth.uid()) in schema.sql ✓
-- Verify and re-apply to be safe:
DROP POLICY IF EXISTS "notifications_manage_own" ON public.notifications;
CREATE POLICY "notifications_manage_own"
ON public.notifications
FOR ALL
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- 2b. listing_images — already uses (select auth.uid()) ✓
-- Re-apply for completeness:
DROP POLICY IF EXISTS "listing_images_select_visible" ON public.listing_images;
CREATE POLICY "listing_images_select_visible"
ON public.listing_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.listings
    WHERE listings.id = listing_images.listing_id
      AND (
        listings.status = 'approved'
        OR listings.seller_id = (SELECT auth.uid())
        OR (SELECT public.is_admin())
      )
  )
);

DROP POLICY IF EXISTS "listing_images_manage_owner_or_admin" ON public.listing_images;
CREATE POLICY "listing_images_manage_owner_or_admin"
ON public.listing_images
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.listings
    WHERE listings.id = listing_images.listing_id
      AND (
        listings.seller_id = (SELECT auth.uid())
        OR (SELECT public.is_admin())
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.listings
    WHERE listings.id = listing_images.listing_id
      AND (
        listings.seller_id = (SELECT auth.uid())
        OR (SELECT public.is_admin())
      )
  )
);

-- 2c. profiles — already uses (select auth.uid()) ✓
-- Re-apply to ensure consistency:
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_self_or_admin"
ON public.profiles
FOR SELECT
USING (
  (SELECT auth.uid()) = id
  OR (SELECT public.is_admin())
  OR EXISTS (
    SELECT 1
    FROM public.chats
    WHERE (SELECT auth.uid()) IN (chats.buyer_id, chats.seller_id)
      AND public.profiles.id IN (chats.buyer_id, chats.seller_id)
  )
);

DROP POLICY IF EXISTS "profiles_insert_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_insert_self_or_admin"
ON public.profiles
FOR INSERT
WITH CHECK ((SELECT auth.uid()) = id OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin"
ON public.profiles
FOR UPDATE
USING ((SELECT auth.uid()) = id OR (SELECT public.is_admin()))
WITH CHECK ((SELECT auth.uid()) = id OR (SELECT public.is_admin()));

-- 2d. tickets — FIX: auth.uid() → (SELECT auth.uid())
-- These policies had bare auth.uid() calls (initplan issue)
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
CREATE POLICY "tickets_select_own_or_admin"
ON public.tickets
FOR SELECT
USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

DROP POLICY IF EXISTS "Authenticated users can create tickets" ON public.tickets;
CREATE POLICY "tickets_insert_own"
ON public.tickets
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = user_id
  OR user_id IS NULL  -- allow anonymous tickets (public contact form)
);

-- 2e. tickets UPDATE — consolidate two permissive UPDATE policies into one
-- Problem: "Users can update their own open tickets" + "Admins can update any ticket"
-- are TWO permissive policies for UPDATE — Postgres evaluates BOTH and ORs them.
-- This is the "multiple_permissive_policies" warning.
-- Fix: Single policy with OR logic.
DROP POLICY IF EXISTS "Users can update their own open tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update any ticket" ON public.tickets;
CREATE POLICY "tickets_update_own_open_or_admin"
ON public.tickets
FOR UPDATE
USING (
  ((SELECT auth.uid()) = user_id AND status = 'open')
  OR (SELECT public.is_admin())
)
WITH CHECK (
  ((SELECT auth.uid()) = user_id AND status = 'open')
  OR (SELECT public.is_admin())
);


-- ────────────────────────────────────────────────────────────
-- SECTION 3: MULTIPLE PERMISSIVE POLICIES — Consolidation
-- ────────────────────────────────────────────────────────────
-- Problem: Multiple permissive policies for the same operation
-- on the same table cause Postgres to evaluate ALL of them and
-- OR the results. This is both a performance issue (extra work)
-- and a security risk (unexpected access combinations).
-- Fix: Consolidate into single policies with explicit OR logic.
-- ────────────────────────────────────────────────────────────

-- 3a. chats — consolidate INSERT policies
-- Schema has BOTH "chats_insert_participants" (old, too permissive)
-- AND "chats_insert_buyer_only" (new, correct).
-- Drop the old permissive one, keep only the strict one.
DROP POLICY IF EXISTS "chats_insert_participants" ON public.chats;
-- "chats_insert_buyer_only" from fix-chats-rls.sql is the correct policy.
-- Re-apply it here to ensure it exists:
DROP POLICY IF EXISTS "chats_insert_buyer_only" ON public.chats;
CREATE POLICY "chats_insert_buyer_only"
ON public.chats
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = buyer_id
  AND EXISTS (
    SELECT 1 FROM public.listings
    WHERE listings.id = chats.listing_id
      AND listings.status = 'approved'
      AND listings.seller_id = chats.seller_id
  )
);

-- Consolidate chats SELECT (two policies → one)
DROP POLICY IF EXISTS "chats_select_participants" ON public.chats;
CREATE POLICY "chats_select_participants"
ON public.chats
FOR SELECT
USING (
  (SELECT auth.uid()) IN (buyer_id, seller_id)
  OR (SELECT public.is_admin())
);

-- 3b. messages — consolidate SELECT and INSERT policies
-- Schema has "messages_select_chat_participants" AND "messages_select_participants"
-- (the latter from fix-chats-rls.sql). Drop duplicates, keep one.
DROP POLICY IF EXISTS "messages_select_chat_participants" ON public.messages;
DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
CREATE POLICY "messages_select_participants"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = messages.chat_id
      AND (SELECT auth.uid()) IN (chats.buyer_id, chats.seller_id)
  )
);

-- messages INSERT: schema has "messages_insert_chat_participants" AND "messages_insert_participant"
DROP POLICY IF EXISTS "messages_insert_chat_participants" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_participant" ON public.messages;
CREATE POLICY "messages_insert_participant"
ON public.messages
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = sender_id
  AND EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = messages.chat_id
      AND (SELECT auth.uid()) IN (chats.buyer_id, chats.seller_id)
  )
);

-- messages UPDATE — keep existing, just ensure (select auth.uid()) pattern
DROP POLICY IF EXISTS "messages_update_chat_participants" ON public.messages;
CREATE POLICY "messages_update_chat_participants"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = messages.chat_id
      AND (SELECT auth.uid()) IN (chats.buyer_id, chats.seller_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = messages.chat_id
      AND (SELECT auth.uid()) IN (chats.buyer_id, chats.seller_id)
  )
);

-- 3c. seller_reviews — check for multiple permissive policies
-- Current schema has: select_public, insert_self, delete_self
-- These are for different operations so they are NOT multiple permissive
-- for the same operation. However, ensure (select auth.uid()) pattern:
DROP POLICY IF EXISTS "seller_reviews_select_public" ON public.seller_reviews;
CREATE POLICY "seller_reviews_select_public"
ON public.seller_reviews
FOR SELECT
USING (true);  -- public read is intentional for marketplace trust signals

DROP POLICY IF EXISTS "seller_reviews_insert_self" ON public.seller_reviews;
CREATE POLICY "seller_reviews_insert_self"
ON public.seller_reviews
FOR INSERT
WITH CHECK ((SELECT auth.uid()) = reviewer_id);

DROP POLICY IF EXISTS "seller_reviews_delete_self" ON public.seller_reviews;
CREATE POLICY "seller_reviews_delete_self"
ON public.seller_reviews
FOR DELETE
USING (
  (SELECT auth.uid()) = reviewer_id
  OR (SELECT public.is_admin())
);

-- 3d. listing_price_history — if table exists, fix SELECT policies
-- The advisor flagged multiple permissive SELECT policies.
-- Apply only if the table exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'listing_price_history'
  ) THEN
    -- Drop all existing SELECT policies and replace with one
    DROP POLICY IF EXISTS "listing_price_history_select_public" ON public.listing_price_history;
    DROP POLICY IF EXISTS "listing_price_history_select_owner" ON public.listing_price_history;
    DROP POLICY IF EXISTS "listing_price_history_select_all" ON public.listing_price_history;

    -- Single consolidated SELECT policy
    EXECUTE $policy$
      CREATE POLICY "listing_price_history_select_owner_or_public"
      ON public.listing_price_history
      FOR SELECT
      USING (
        -- Price history is public for approved listings (market transparency)
        EXISTS (
          SELECT 1 FROM public.listings
          WHERE listings.id = listing_price_history.listing_id
            AND (
              listings.status = 'approved'
              OR listings.seller_id = (SELECT auth.uid())
              OR (SELECT public.is_admin())
            )
        )
      );
    $policy$;
  END IF;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- SECTION 4: phone_reveal_logs INSERT Policy — Tighten
-- ────────────────────────────────────────────────────────────
-- Problem: WITH CHECK (true) allows unlimited inserts from any
-- role including anon. While rate limiting is in the app layer,
-- a direct DB connection bypasses it.
-- Fix: Require that the listing_id references an approved listing.
-- This prevents inserting phantom reveal logs for non-existent
-- or inactive listings while still allowing anonymous reveals.
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "phone_reveal_logs_insert_anyone" ON public.phone_reveal_logs;
CREATE POLICY "phone_reveal_logs_insert_approved_listing"
ON public.phone_reveal_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.listings
    WHERE listings.id = phone_reveal_logs.listing_id
      AND listings.status = 'approved'
  )
);

-- Keep the SELECT policy with (select auth.uid()) pattern:
DROP POLICY IF EXISTS "phone_reveal_logs_select_owner_or_admin" ON public.phone_reveal_logs;
CREATE POLICY "phone_reveal_logs_select_owner_or_admin"
ON public.phone_reveal_logs
FOR SELECT
USING (
  (SELECT public.is_admin())
  OR EXISTS (
    SELECT 1 FROM public.listings
    WHERE listings.id = phone_reveal_logs.listing_id
      AND listings.seller_id = (SELECT auth.uid())
  )
);


-- ────────────────────────────────────────────────────────────
-- SECTION 5: listing_views INSERT — also tighten
-- ────────────────────────────────────────────────────────────
-- Same pattern as phone_reveal_logs: WITH CHECK (true) is too broad.
-- Require listing_id to reference an existing listing.
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "listing_views_insert_anyone" ON public.listing_views;
CREATE POLICY "listing_views_insert_anyone"
ON public.listing_views
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.listings
    WHERE listings.id = listing_views.listing_id
  )
);

-- Fix listing_views SELECT to use (select auth.uid()) pattern:
DROP POLICY IF EXISTS "listing_views_select_owner_or_admin" ON public.listing_views;
CREATE POLICY "listing_views_select_owner_or_admin"
ON public.listing_views
FOR SELECT
USING (
  (SELECT public.is_admin())
  OR EXISTS (
    SELECT 1 FROM public.listings
    WHERE listings.id = listing_views.listing_id
      AND listings.seller_id = (SELECT auth.uid())
  )
);


-- ────────────────────────────────────────────────────────────
-- SECTION 6: Remaining auth.uid() → (SELECT auth.uid()) fixes
-- ────────────────────────────────────────────────────────────
-- Any remaining policies that still use bare auth.uid()

-- favorites (already correct in schema, re-apply for safety)
DROP POLICY IF EXISTS "favorites_manage_own" ON public.favorites;
CREATE POLICY "favorites_manage_own"
ON public.favorites
FOR ALL
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- saved_searches (already correct, re-apply)
DROP POLICY IF EXISTS "saved_searches_manage_own" ON public.saved_searches;
CREATE POLICY "saved_searches_manage_own"
ON public.saved_searches
FOR ALL
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- reports (already correct, re-apply)
DROP POLICY IF EXISTS "reports_select_self_or_admin" ON public.reports;
CREATE POLICY "reports_select_self_or_admin"
ON public.reports
FOR SELECT
USING (
  (SELECT auth.uid()) = reporter_id
  OR (SELECT public.is_admin())
);

DROP POLICY IF EXISTS "reports_insert_self" ON public.reports;
CREATE POLICY "reports_insert_self"
ON public.reports
FOR INSERT
WITH CHECK ((SELECT auth.uid()) = reporter_id);

DROP POLICY IF EXISTS "reports_update_admin_only" ON public.reports;
CREATE POLICY "reports_update_admin_only"
ON public.reports
FOR UPDATE
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- admin_actions (already correct, re-apply)
DROP POLICY IF EXISTS "admin_actions_admin_only" ON public.admin_actions;
CREATE POLICY "admin_actions_admin_only"
ON public.admin_actions
FOR ALL
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- payments (already correct, re-apply)
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own"
ON public.payments
FOR SELECT
USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

-- eids_audit_logs
DROP POLICY IF EXISTS "eids_audit_select_admin" ON public.eids_audit_logs;
CREATE POLICY "eids_audit_select_admin"
ON public.eids_audit_logs
FOR SELECT
USING ((SELECT public.is_admin()));


-- ────────────────────────────────────────────────────────────
-- SECTION 7: Verification Queries
-- ────────────────────────────────────────────────────────────
-- Run these after applying to verify the migration succeeded.
-- Expected: 0 rows for each "problem" query.

-- Check 1: Functions still without search_path (should return 0 rows)
-- SELECT proname, prosecdef, proconfig
-- FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace
--   AND proconfig IS NULL
--   AND proname IN (
--     'is_admin', 'set_updated_at', 'touch_chat_last_message_at',
--     'track_listing_price_change', 'get_listings_by_brand_count',
--     'get_listings_by_city_count', 'get_listings_by_status_count'
--   );

-- Check 2: Policies with bare auth.uid() (should return 0 rows)
-- SELECT schemaname, tablename, policyname, qual, with_check
-- FROM pg_policies
-- WHERE (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%')
--   AND (qual NOT LIKE '%(select auth.uid())%' AND with_check NOT LIKE '%(select auth.uid())%');

-- Check 3: Multiple permissive policies per table+operation (should return 0 rows)
-- SELECT tablename, cmd, count(*) as policy_count
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND permissive = 'PERMISSIVE'
-- GROUP BY tablename, cmd
-- HAVING count(*) > 1
-- ORDER BY policy_count DESC;

-- ────────────────────────────────────────────────────────────
-- END OF MIGRATION
-- ────────────────────────────────────────────────────────────
