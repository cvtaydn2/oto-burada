-- Migration: 0106_secure_profiles_rls
-- Purpose: Protect sensitive user data (phone numbers) from unauthorized public access (GDPR/KVKK compliance).

-- 1. Create a secure public view that only exposes non-sensitive fields.
-- This view allows anyone to see who a seller is without exposing their private contact info.
CREATE VIEW public.public_profiles AS
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

-- 2. Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated, service_role;

-- 3. Restrict the base profiles table to only allow full row access to owners and admins.
-- This protects the 'phone' and other potentially sensitive columns.
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Profiles are only fully readable by owner and admins" ON public.profiles
  FOR SELECT USING (
    (SELECT auth.uid()) = id 
    OR (SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false))
  );

COMMENT ON VIEW public.public_profiles IS 
  'Publicly accessible profile fields. Excludes sensitive data like phone numbers for GDPR/KVKK compliance.';
