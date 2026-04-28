-- Migration: Fix public_profiles view SECURITY DEFINER issue
-- Description: Recreate view without SECURITY DEFINER to use querying user's permissions
-- Date: 2026-04-29
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

-- Drop existing view
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate view with SECURITY INVOKER (default, uses querying user's permissions)
-- This is safer as it enforces RLS policies of the querying user, not the view creator
CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT 
  id, 
  full_name, 
  avatar_url, 
  city, 
  role, 
  user_type, 
  business_name, 
  business_logo_url, 
  is_verified, 
  is_banned, 
  ban_reason, 
  verified_business, 
  verification_status, 
  trust_score, 
  business_slug, 
  created_at, 
  updated_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated, service_role;

-- Add comment
COMMENT ON VIEW public.public_profiles IS 
  'Publicly accessible profile fields. Excludes sensitive data like phone numbers for GDPR/KVKK compliance. Uses SECURITY INVOKER for safer permission model.';

-- Verify the view is using SECURITY INVOKER
DO $$
DECLARE
  v_security_type text;
BEGIN
  SELECT 
    CASE 
      WHEN v.security_type = 'i' THEN 'INVOKER'
      WHEN v.security_type = 'd' THEN 'DEFINER'
      ELSE 'UNKNOWN'
    END INTO v_security_type
  FROM pg_views pv
  JOIN pg_class c ON c.relname = pv.viewname
  JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = pv.schemaname
  LEFT JOIN pg_attribute a ON a.attrelid = c.oid
  LEFT JOIN LATERAL (
    SELECT 
      CASE 
        WHEN pg_get_viewdef(c.oid) LIKE '%security_invoker%' THEN 'i'
        ELSE 'd'
      END as security_type
  ) v ON true
  WHERE pv.schemaname = 'public' 
  AND pv.viewname = 'public_profiles'
  LIMIT 1;

  IF v_security_type = 'INVOKER' THEN
    RAISE NOTICE '✅ View public.public_profiles is using SECURITY INVOKER (safe)';
  ELSIF v_security_type = 'DEFINER' THEN
    RAISE WARNING '⚠️ View public.public_profiles is still using SECURITY DEFINER';
  ELSE
    RAISE NOTICE 'ℹ️ Could not determine security type for public.public_profiles';
  END IF;
END $$;
