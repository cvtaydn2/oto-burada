-- Migration: 0136_infrastructure_security_performance
-- Description: Hardens SECURITY DEFINER functions, adds missing indexes for performance, and consolidates RLS policies.
-- Date: 2026-05-01

-- 1. SECURITY HARDENING: Revoke default EXECUTE from PUBLIC
-- This prevents any newly created or existing functions from being executed by anon/authenticated roles by default.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- 2. GRANT SELECTIVE PERMISSIONS
-- Grant back to service_role (always safe as it bypasses RLS anyway but good for completeness)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant to authenticated (Safe for most domain logic functions)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 3. EXPLICITLY ALLOW ANON PERMISSIONS (For public-facing features)
GRANT EXECUTE ON FUNCTION public.check_api_rate_limit(text, integer, bigint) TO anon;
GRANT EXECUTE ON FUNCTION public.check_contact_abuse(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.log_contact_abuse(text, text, text, text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_listing_view(uuid, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_active_brand_city_combinations() TO anon;
GRANT EXECUTE ON FUNCTION public.get_listings_by_brand_count(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_listings_by_city_count(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_listings_by_status_count() TO anon;
GRANT EXECUTE ON FUNCTION public.is_valid_damage_status_json(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_ticket(text, text, text, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_user_banned(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 4. RESTRICT ADMIN-ONLY FUNCTIONS
-- Even if authenticated can execute them, we ensure they don't have PUBLIC execute if they are sensitive.
-- These are already covered by REVOKE but we can be explicit if we want to ensure only service_role/admins call them.
REVOKE EXECUTE ON FUNCTION public.ban_user_atomic(uuid, text, boolean) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_ticket(uuid, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.recalibrate_all_market_stats() FROM authenticated;

-- 5. PERFORMANCE: Add missing indexes for foreign keys (Identified by Supabase Performance Audit)
CREATE INDEX IF NOT EXISTS doping_purchases_package_id_idx ON public.doping_purchases(package_id);
CREATE INDEX IF NOT EXISTS doping_purchases_payment_id_idx ON public.doping_purchases(payment_id);
CREATE INDEX IF NOT EXISTS listing_questions_listing_id_idx ON public.listing_questions(listing_id);
CREATE INDEX IF NOT EXISTS listings_seller_id_idx ON public.listings(seller_id);

-- 6. PERFORMANCE: Drop unused/redundant indexes (Optimizing Write Operations)
DROP INDEX IF EXISTS public.listings_vin_idx; -- Low cardinality or handled by other lookups
DROP INDEX IF EXISTS public.idx_profiles_identity_number; -- Identity number is rarely searched in hot paths

-- 7. PERFORMANCE: Consolidate listing_questions RLS policies
-- Current policies have multiple permissive rules for the same role, causing query overhead.
DROP POLICY IF EXISTS listing_questions_select_asker ON public.listing_questions;
DROP POLICY IF EXISTS listing_questions_select_owner ON public.listing_questions;
DROP POLICY IF EXISTS listing_questions_select_public ON public.listing_questions;
DROP POLICY IF EXISTS listing_questions_admin_all ON public.listing_questions;

-- Create a single optimized SELECT policy
CREATE POLICY "listing_questions_select_v3" ON public.listing_questions
    FOR SELECT
    TO public
    USING (
        (is_admin()) OR
        ((SELECT auth.uid()) = user_id) OR
        (EXISTS (
            SELECT 1 FROM listings 
            WHERE listings.id = listing_questions.listing_id 
            AND listings.seller_id = (SELECT auth.uid())
        )) OR
        (status = 'approved'::text AND is_public = true)
    );

-- Re-add admin all policy but scoped to just admin check
CREATE POLICY "listing_questions_admin_all_v2" ON public.listing_questions
    FOR ALL
    TO public
    USING (is_admin())
    WITH CHECK (is_admin());

-- 8. SECURITY: Update profile_sensitive_columns protection to be more robust
-- (Already exists as a trigger, but ensuring it's efficient)
ALTER FUNCTION public.protect_profile_sensitive_columns() SECURITY DEFINER;
