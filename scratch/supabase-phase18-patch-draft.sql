-- Phase-18 draft (DO NOT APPLY DIRECTLY in production without review)
-- Purpose:
-- 1) Reduce SECURITY DEFINER execute surface for anon/authenticated
-- 2) Resolve listing_questions multi-permissive policy performance warnings
-- 3) Add maintenance guidance for dead tuples

-- =========================================================
-- A) SECURITY DEFINER execute-surface hardening (draft)
-- =========================================================
-- NOTE: Keep only explicitly required RPCs public/auth-accessible.
-- Revoke broad access first, then grant back a minimal allowlist.

-- Example global revoke pattern (review required):
-- DO $$
-- DECLARE r record;
-- BEGIN
--   FOR r IN
--     SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
--     FROM pg_proc p
--     JOIN pg_namespace n ON n.oid = p.pronamespace
--     WHERE n.nspname = 'public' AND p.prosecdef = true
--   LOOP
--     EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon;', r.nspname, r.proname, r.args);
--     EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM authenticated;', r.nspname, r.proname, r.args);
--   END LOOP;
-- END $$;

-- Grant-back allowlist example (adjust to real app contract):
-- GRANT EXECUTE ON FUNCTION public.check_api_rate_limit(text, integer, bigint) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.check_contact_abuse(text, text) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.create_public_ticket(text, text, text, text, uuid) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.increment_listing_view(uuid, uuid, text) TO anon, authenticated;

-- =========================================================
-- B) listing_questions policy simplification (draft)
-- =========================================================
-- Current state has admin-all + action policies as permissive for same roles/actions.
-- Strategy: keep action-specific policies for public/auth roles,
-- and isolate admin bypass via restricted role or security-definer API path.

-- Candidate approach:
-- 1) Drop broad admin-all policy if redundant in public/auth query path.
-- DROP POLICY IF EXISTS listing_questions_admin_all_v2 ON public.listing_questions;

-- 2) Keep explicit action policies:
-- - listing_questions_insert_asker
-- - listing_questions_select_v3
-- - listing_questions_update_owner

-- 3) If admin full-access needed, re-introduce under dedicated DB role only.
-- CREATE POLICY listing_questions_admin_all_role
-- ON public.listing_questions
-- FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

-- =========================================================
-- C) Maintenance plan for dead tuples (operations)
-- =========================================================
-- Run in low-traffic window; tune per environment.
-- VACUUM (ANALYZE) public.profiles;
-- VACUUM (ANALYZE) public.platform_settings;
-- VACUUM (ANALYZE) public.pricing_plans;
-- VACUUM (ANALYZE) public.listing_views;
-- VACUUM (ANALYZE) public.notifications;
-- VACUUM (ANALYZE) public.messages;
-- VACUUM (ANALYZE) public.favorites;
-- VACUUM (ANALYZE) public.chats;

-- Post-maintenance check:
-- SELECT relname, n_live_tup, n_dead_tup
-- FROM pg_stat_user_tables
-- WHERE schemaname='public'
-- ORDER BY n_dead_tup DESC
-- LIMIT 20;
