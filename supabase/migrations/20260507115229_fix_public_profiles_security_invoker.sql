-- Fix public.public_profiles to use SECURITY INVOKER semantics.
-- This removes the Security Definer View advisory while keeping only safe public columns exposed.

DROP VIEW IF EXISTS public.public_profiles;

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

GRANT SELECT ON public.public_profiles TO anon, authenticated, service_role;

COMMENT ON VIEW public.public_profiles IS
  'Publicly accessible profile fields. Excludes sensitive data like phone and identity_number for GDPR/KVKK compliance. Uses SECURITY INVOKER semantics.';
