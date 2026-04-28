-- Migration: Fix all Supabase Database Linter warnings
-- Date: 2026-04-29
-- Fixes:
--   1. SECURITY DEFINER functions callable by anon/authenticated
--   2. RLS initplan performance (auth.uid() → (SELECT auth.uid()))
--   3. Multiple permissive policies on chats, messages, profiles, storage_objects_registry, doping_purchases

-- ============================================================
-- PART 1: REVOKE EXECUTE FROM anon ON SECURITY DEFINER FUNCTIONS
-- These functions should only be callable server-side (via service_role)
-- ============================================================

-- Payment & financial functions (critical - anon must NOT call these)
REVOKE EXECUTE ON FUNCTION public.activate_doping(uuid, uuid, uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_free_pricing_plan(uuid, uuid, text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_user_credits_atomic(uuid, integer, text, text, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_user_credits_atomic(uuid, integer, text, text, uuid, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_payment_success(text, uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_payment_success(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_payment_webhook(text, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_user_credits(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_webhook_attempts(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_fulfillment_job(uuid, text, jsonb) FROM anon, authenticated;

-- Admin-only functions
REVOKE EXECUTE ON FUNCTION public.admin_update_ticket(uuid, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_dead_letter_jobs(integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_ready_fulfillment_jobs(integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_job_failed(uuid, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_job_processing(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_job_success(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.retry_dead_letter_job(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalibrate_all_market_stats() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_expire_old_listings() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_rate_limits() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_listing_price_indices(text, text, integer, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_market_stats(text, text, integer, numeric, integer) FROM anon, authenticated;

-- Quota functions (authenticated only, not anon)
REVOKE EXECUTE ON FUNCTION public.check_and_reserve_listing_quota(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_listing_quota_atomic(uuid, integer, integer) FROM anon;

-- Trigger functions (should never be called directly via RPC)
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_credit_transaction_updates() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_critical_table() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_listing_status_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_sensitive_columns() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_chat_last_message_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.track_listing_price_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_create_fulfillment_jobs() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_chat_last_message_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_custom_roles_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_listing_search_vector() FROM anon, authenticated;

-- Internal/sensitive functions
REVOKE EXECUTE ON FUNCTION public.is_user_banned(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_valid_damage_status_json(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_contact_abuse(text, text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.apply_listing_doping(uuid, uuid, text[], integer, uuid) FROM anon, authenticated;

-- Keep these accessible (needed by app logic):
-- public.check_api_rate_limit        → anon needs for rate limiting
-- public.check_contact_abuse         → anon needs for contact form
-- public.create_public_ticket        → anon needs for support tickets
-- public.create_user_ticket          → authenticated needs
-- public.get_active_brand_city_combinations → anon needs for SEO pages
-- public.get_active_dopings_for_listing     → anon needs for listing detail
-- public.get_listings_by_brand_count        → anon needs for analytics
-- public.get_listings_by_city_count         → anon needs for analytics
-- public.get_listings_by_status_count       → anon needs for analytics
-- public.increment_listing_view             → anon needs for view tracking
-- public.is_admin                           → authenticated needs for UI checks

-- ============================================================
-- PART 2: FIX RLS INITPLAN PERFORMANCE
-- Replace auth.uid() with (SELECT auth.uid()) to prevent per-row re-evaluation
-- ============================================================

-- doping_purchases
DROP POLICY IF EXISTS "Doping purchases are visible to admins" ON public.doping_purchases;
DROP POLICY IF EXISTS "Doping purchases are visible to the owner" ON public.doping_purchases;

CREATE POLICY "Doping purchases are visible to admins"
ON public.doping_purchases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "Doping purchases are visible to the owner"
ON public.doping_purchases FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- listing_questions
DROP POLICY IF EXISTS "Sellers can answer their own listing's questions" ON public.listing_questions;
DROP POLICY IF EXISTS "Authenticated users can ask questions" ON public.listing_questions;

CREATE POLICY "Sellers can answer their own listing's questions"
ON public.listing_questions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.listings
    WHERE id = listing_id AND seller_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Authenticated users can ask questions"
ON public.listing_questions FOR INSERT
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- profiles: fix initplan + consolidate multiple permissive policies
-- Mevcut 3 SELECT policy:
--   1. "Profiles are only fully readable by owner and admins" → owner veya admin tam erişim
--   2. "profiles_select_marketplace_and_self"                → banned değilse veya owner/admin/chat katılımcısı
--   3. "profiles_select_public"                              → banned değilse veya admin
-- Hepsini tek policy'de birleştir (OR mantığı zaten aynı sonucu veriyor)
DROP POLICY IF EXISTS "Profiles are only fully readable by owner and admins" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_marketplace_and_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;

CREATE POLICY "profiles_select"
ON public.profiles FOR SELECT
USING (
  -- Kendi profilini her zaman görebilir (banned olsa bile)
  (SELECT auth.uid()) = id
  -- Admin her profili görebilir
  OR (SELECT is_admin())
  -- Banned olmayan profiller herkese açık (marketplace için)
  OR (NOT is_banned)
  -- Chat katılımcıları birbirinin profilini görebilir (banned olsa bile)
  OR EXISTS (
    SELECT 1 FROM chats
    WHERE (
      (SELECT auth.uid()) = chats.buyer_id
      OR (SELECT auth.uid()) = chats.seller_id
    )
    AND (
      profiles.id = chats.buyer_id
      OR profiles.id = chats.seller_id
    )
  )
);

-- canonical_search_cache, compensating_actions, etc. (service_role_only policies)
DROP POLICY IF EXISTS "service_role_only" ON public.canonical_search_cache;
CREATE POLICY "service_role_only"
ON public.canonical_search_cache FOR ALL
USING (current_setting('role') = 'service_role');

DROP POLICY IF EXISTS "service_role_only" ON public.compensating_actions;
CREATE POLICY "service_role_only"
ON public.compensating_actions FOR ALL
USING (current_setting('role') = 'service_role');

DROP POLICY IF EXISTS "service_role_only" ON public.missing_resource_logs;
CREATE POLICY "service_role_only"
ON public.missing_resource_logs FOR ALL
USING (current_setting('role') = 'service_role');

DROP POLICY IF EXISTS "service_role_only" ON public.security_blacklist_patterns;
CREATE POLICY "service_role_only"
ON public.security_blacklist_patterns FOR ALL
USING (current_setting('role') = 'service_role');

DROP POLICY IF EXISTS "service_role_only" ON public.user_encryption_keys;
CREATE POLICY "service_role_only"
ON public.user_encryption_keys FOR ALL
USING (current_setting('role') = 'service_role');

DROP POLICY IF EXISTS "service_role_only" ON public.user_read_writes_tracker;
CREATE POLICY "service_role_only"
ON public.user_read_writes_tracker FOR ALL
USING (current_setting('role') = 'service_role');

-- ============================================================
-- PART 3: FIX MULTIPLE PERMISSIVE POLICIES
-- chats, messages, storage_objects_registry
-- ============================================================

-- CHATS: Remove duplicate policies, keep the newer named ones
DROP POLICY IF EXISTS "chats_insert_buyer_only" ON public.chats;
DROP POLICY IF EXISTS "chats_select_participants" ON public.chats;

-- MESSAGES: Remove duplicate policies
DROP POLICY IF EXISTS "messages_insert_participant" ON public.messages;
DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;

-- STORAGE_OBJECTS_REGISTRY: Remove duplicate SELECT policy
DROP POLICY IF EXISTS "storage_registry_select_owner" ON public.storage_objects_registry;

-- ============================================================
-- PART 4: FIX CHATS & MESSAGES RLS INITPLAN
-- ============================================================

-- chats
DROP POLICY IF EXISTS "chat_participants_select" ON public.chats;
DROP POLICY IF EXISTS "chat_buyer_insert" ON public.chats;
DROP POLICY IF EXISTS "chat_participants_update" ON public.chats;

CREATE POLICY "chat_participants_select"
ON public.chats FOR SELECT
USING (
  buyer_id = (SELECT auth.uid())
  OR seller_id = (SELECT auth.uid())
);

CREATE POLICY "chat_buyer_insert"
ON public.chats FOR INSERT
WITH CHECK (buyer_id = (SELECT auth.uid()));

CREATE POLICY "chat_participants_update"
ON public.chats FOR UPDATE
USING (
  buyer_id = (SELECT auth.uid())
  OR seller_id = (SELECT auth.uid())
);

-- messages
DROP POLICY IF EXISTS "message_participants_select" ON public.messages;
DROP POLICY IF EXISTS "message_participant_insert" ON public.messages;

CREATE POLICY "message_participants_select"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE id = chat_id
    AND (buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid()))
  )
);

CREATE POLICY "message_participant_insert"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.chats
    WHERE id = chat_id
    AND (buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid()))
  )
);

-- ============================================================
-- VERIFICATION
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 0120 completed:';
  RAISE NOTICE '   - REVOKE EXECUTE from anon/authenticated on sensitive SECURITY DEFINER functions';
  RAISE NOTICE '   - Fixed RLS initplan performance (auth.uid() → SELECT auth.uid())';
  RAISE NOTICE '   - Removed duplicate permissive policies on chats, messages, profiles, storage_objects_registry';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Manual action required:';
  RAISE NOTICE '   - Enable Leaked Password Protection in Supabase Dashboard';
  RAISE NOTICE '   - Dashboard > Authentication > Security > Enable HaveIBeenPwned check';
END $$;
