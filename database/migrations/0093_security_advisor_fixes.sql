-- 0062_security_advisor_fixes.sql
-- Fixes for Supabase Security Advisor warnings

-- 1. Fix mutable search_path for SECURITY DEFINER functions
ALTER FUNCTION public.adjust_user_credits_atomic(uuid, integer, text, text, text, jsonb) SET search_path = public;
ALTER FUNCTION public.adjust_user_credits_atomic(uuid, integer, text, text, uuid, jsonb) SET search_path = public;
ALTER FUNCTION public.update_fulfillment_jobs_updated_at() SET search_path = public;
ALTER FUNCTION public.check_listing_quota_atomic(uuid, integer, integer) SET search_path = public;

-- 2. Add RLS policies for internal tables that have RLS enabled but no policies
-- These tables should generally only be accessible by service_role (default behavior when no policies exist and RLS is on),
-- but the advisor prefers explicit policies or disabling RLS if not needed.
-- We keep RLS on and add explicit deny-all or service_role only policies where appropriate.

-- _migrations: Deny all public access (already happens by default, but let's be explicit)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = '_migrations' AND policyname = 'service_role_only') THEN
        CREATE POLICY "service_role_only" ON "public"."_migrations" AS PERMISSIVE FOR ALL TO service_role USING (true);
    END IF;
END $$;

-- user_quotas: Deny all public access
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_quotas' AND policyname = 'service_role_only') THEN
        CREATE POLICY "service_role_only" ON "public"."user_quotas" AS PERMISSIVE FOR ALL TO service_role USING (true);
    END IF;
END $$;

-- fulfillment_jobs: Deny all public access
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fulfillment_jobs' AND policyname = 'service_role_only') THEN
        CREATE POLICY "service_role_only" ON "public"."fulfillment_jobs" AS PERMISSIVE FOR ALL TO service_role USING (true);
    END IF;
END $$;

-- transaction_outbox: Deny all public access
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_outbox' AND policyname = 'service_role_only') THEN
        CREATE POLICY "service_role_only" ON "public"."transaction_outbox" AS PERMISSIVE FOR ALL TO service_role USING (true);
    END IF;
END $$;

-- realized_sales: Deny all public access
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'realized_sales' AND policyname = 'service_role_only') THEN
        CREATE POLICY "service_role_only" ON "public"."realized_sales" AS PERMISSIVE FOR ALL TO service_role USING (true);
    END IF;
END $$;

-- 3. Move extensions out of public if possible (Advisor recommends another schema like 'extensions')
-- This requires the schema to exist. Standard Supabase setup usually has 'extensions' schema.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION "unaccent" SET SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO public;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;
