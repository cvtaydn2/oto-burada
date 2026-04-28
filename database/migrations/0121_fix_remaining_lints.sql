-- Migration: Fix remaining Supabase Database Linter warnings
-- Date: 2026-04-29
-- Fixes:
--   1. service_role_only policies: current_setting() initplan uyarısı
--   2. doping_purchases: 2 SELECT policy → 1 policy
--   3. SECURITY DEFINER functions: 0120 çalışmadıysa tekrar REVOKE

-- ============================================================
-- PART 1: FIX service_role_only POLICIES (initplan)
-- auth.role() her satır için tekrar çalışıyor
-- Çözüm: USING (true) ile sadece service_role'e grant ver
-- Bu Supabase'in önerdiği pattern: TO service_role USING (true)
-- ============================================================

-- canonical_search_cache
DROP POLICY IF EXISTS "service_role_only" ON public.canonical_search_cache;
CREATE POLICY "service_role_only"
ON public.canonical_search_cache FOR ALL
TO service_role
USING (true);

-- compensating_actions
DROP POLICY IF EXISTS "service_role_only" ON public.compensating_actions;
CREATE POLICY "service_role_only"
ON public.compensating_actions FOR ALL
TO service_role
USING (true);

-- missing_resource_logs
DROP POLICY IF EXISTS "service_role_only" ON public.missing_resource_logs;
CREATE POLICY "service_role_only"
ON public.missing_resource_logs FOR ALL
TO service_role
USING (true);

-- security_blacklist_patterns
DROP POLICY IF EXISTS "service_role_only" ON public.security_blacklist_patterns;
CREATE POLICY "service_role_only"
ON public.security_blacklist_patterns FOR ALL
TO service_role
USING (true);

-- user_encryption_keys
DROP POLICY IF EXISTS "service_role_only" ON public.user_encryption_keys;
CREATE POLICY "service_role_only"
ON public.user_encryption_keys FOR ALL
TO service_role
USING (true);

-- user_read_writes_tracker
DROP POLICY IF EXISTS "service_role_only" ON public.user_read_writes_tracker;
CREATE POLICY "service_role_only"
ON public.user_read_writes_tracker FOR ALL
TO service_role
USING (true);

-- ============================================================
-- PART 2: FIX doping_purchases MULTIPLE PERMISSIVE POLICIES
-- 2 SELECT policy → 1 consolidated policy
-- ============================================================

DROP POLICY IF EXISTS "Doping purchases are visible to admins" ON public.doping_purchases;
DROP POLICY IF EXISTS "Doping purchases are visible to the owner" ON public.doping_purchases;

-- Single consolidated SELECT policy
CREATE POLICY "doping_purchases_select"
ON public.doping_purchases FOR SELECT
USING (
  -- Owner sees their own purchases
  user_id = (SELECT auth.uid())
  -- Admin sees all
  OR (SELECT is_admin())
);

-- ============================================================
-- PART 3: REVOKE EXECUTE (tekrar - 0120 çalışmadıysa)
-- ============================================================

-- Payment & financial (kritik)
REVOKE EXECUTE ON FUNCTION public.activate_doping(uuid, uuid, uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_user_credits_atomic(uuid, integer, text, text, uuid, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_payment_success(text, uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_payment_success(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_payment_webhook(text, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_user_credits(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_webhook_attempts(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_fulfillment_job(uuid, text, jsonb) FROM anon, authenticated;

-- Admin-only
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

-- Quota (anon'dan kaldır, authenticated kalabilir)
REVOKE EXECUTE ON FUNCTION public.check_and_reserve_listing_quota(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_listing_quota_atomic(uuid, integer, integer) FROM anon;

-- Trigger functions (hiç RPC ile çağrılmamalı)
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

-- Internal/sensitive
REVOKE EXECUTE ON FUNCTION public.is_user_banned(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_valid_damage_status_json(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_contact_abuse(text, text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.apply_listing_doping(uuid, uuid, text[], integer, uuid) FROM anon, authenticated;

-- ============================================================
-- VERIFICATION
-- ============================================================
DO $$
DECLARE
  v_policy_count integer;
BEGIN
  -- doping_purchases policy sayısını kontrol et
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'doping_purchases'
    AND schemaname = 'public'
    AND cmd = 'SELECT';

  IF v_policy_count = 1 THEN
    RAISE NOTICE '✅ doping_purchases: 1 SELECT policy (correct)';
  ELSE
    RAISE WARNING '⚠️ doping_purchases: % SELECT policies found (expected 1)', v_policy_count;
  END IF;

  RAISE NOTICE '✅ Migration 0121 completed';
  RAISE NOTICE '   - service_role_only policies fixed (initplan)';
  RAISE NOTICE '   - doping_purchases consolidated to 1 SELECT policy';
  RAISE NOTICE '   - REVOKE EXECUTE applied on sensitive functions';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Still requires manual action:';
  RAISE NOTICE '   - Enable Leaked Password Protection:';
  RAISE NOTICE '     Dashboard > Authentication > Sign In / Up > Password';
  RAISE NOTICE '     Enable "Prevent use of leaked passwords"';
END $$;
