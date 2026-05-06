-- RLS Runtime Audit Checklist (Manual / SQL Editor)
-- Scope: Validate policy behavior for anon/authenticated/admin access
-- Date: 2026-05-06

-- ============================================================================
-- 0) PRECHECK: RLS enabled tables in public schema
-- ============================================================================
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 1) PRECHECK: SECURITY DEFINER functions without explicit search_path
-- Expectation: 0 rows (or only explicitly accepted exceptions)
-- ============================================================================
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  p.prosecdef AS is_security_definer,
  pg_get_functiondef(p.oid) AS function_def
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true
  AND pg_get_functiondef(p.oid) NOT ILIKE '%search_path%';

-- ============================================================================
-- 2) PRECHECK: Bare auth.uid() usage in policies
-- Expectation: 0 rows (prefer (SELECT auth.uid()) pattern)
-- ============================================================================
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (qual ILIKE '%auth.uid()%' AND qual NOT ILIKE '%(SELECT auth.uid())%')
    OR
    (with_check ILIKE '%auth.uid()%' AND with_check NOT ILIKE '%(SELECT auth.uid())%')
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- 3) VIEW CHECK: public_profiles should be SECURITY INVOKER semantics
-- Expectation: definition includes "WITH (security_invoker = true)"
-- ============================================================================
SELECT pg_get_viewdef('public.public_profiles'::regclass, true) AS public_profiles_view_def;

-- ============================================================================
-- 4) POLICY INVENTORY SNAPSHOT
-- ============================================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 5) RUNTIME SIMULATION: anonymous access (JWT role = anon)
-- NOTE: run in isolated session and reset settings after each block.
-- ============================================================================
-- SET LOCAL ROLE anon; -- if role switch allowed in your environment
-- SELECT * FROM public.public_profiles LIMIT 5;
-- SELECT * FROM public.profiles LIMIT 5; -- should be restricted
-- SELECT * FROM public.listings LIMIT 5; -- should respect public-read rules

-- ============================================================================
-- 6) RUNTIME SIMULATION: authenticated access
-- You can inject JWT claims in Postgres GUC in Supabase SQL Editor sessions.
-- ============================================================================
-- SELECT set_config('request.jwt.claim.role', 'authenticated', true);
-- SELECT set_config('request.jwt.claim.sub', '<USER_UUID>', true);
-- SELECT * FROM public.notifications WHERE user_id = '<USER_UUID>' LIMIT 5; -- should allow own
-- SELECT * FROM public.notifications WHERE user_id <> '<USER_UUID>' LIMIT 5; -- should deny

-- ============================================================================
-- 7) RUNTIME SIMULATION: admin access
-- ============================================================================
-- SELECT set_config('request.jwt.claim.role', 'authenticated', true);
-- SELECT set_config('request.jwt.claim.sub', '<ADMIN_UUID>', true);
-- SELECT * FROM public.profiles LIMIT 5; -- should allow according to admin policies

-- ============================================================================
-- 8) LISTING QUESTIONS POLICY CONSISTENCY
-- Validate policies reference current column semantics (seller_id vs user_id etc.)
-- ============================================================================
SELECT policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'listing_questions'
ORDER BY policyname;

-- ============================================================================
-- 9) STORAGE POLICY CONSISTENCY (if using Storage SQL-side checks)
-- ============================================================================
SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- ============================================================================
-- 10) FINAL GATE
-- If any row appears in checks 1 or 2, open remediation migration.
-- ============================================================================
