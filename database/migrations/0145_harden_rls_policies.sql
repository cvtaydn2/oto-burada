-- Migration: Harden RLS policies for Profiles, Favorites, and Listing Images
-- Description: 
-- 1. Restrict public.profiles SELECT policy to owners and admins only (exposes nothing to public direct query).
-- 2. Re-create public.public_profiles view as a secure SECURITY DEFINER view (allowing safe public fields).
-- 3. Decouple public.favorites FOR ALL policy into separate fine-grained SELECT, INSERT, and DELETE policies.
-- 4. Decouple public.listing_images FOR ALL policy into separate fine-grained INSERT, UPDATE, and DELETE policies.
-- Date: 2026-05-07

-- 1. Hardening public.profiles SELECT policy
DROP POLICY IF EXISTS "profiles_select_self_or_admin_or_chat" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select_self_or_admin" ON public.profiles 
  FOR SELECT 
  USING ((SELECT auth.uid()) = id OR public.is_admin());

-- 2. Re-create public.public_profiles view as a secure definer view (omit security_invoker to bypass base table RLS)
DROP VIEW IF EXISTS public.public_profiles;

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

GRANT SELECT ON public.public_profiles TO anon, authenticated, service_role;

COMMENT ON VIEW public.public_profiles IS 
  'Publicly accessible profile fields. Excludes sensitive data like phone and identity_number for GDPR/KVKK compliance. Runs securely with view owner privileges.';

-- 3. Decoupling public.favorites FOR ALL policy
DROP POLICY IF EXISTS "favorites_manage_own" ON public.favorites;

CREATE POLICY "favorites_select_own" ON public.favorites 
  FOR SELECT 
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "favorites_insert_own" ON public.favorites 
  FOR INSERT 
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "favorites_delete_own" ON public.favorites 
  FOR DELETE 
  USING ((SELECT auth.uid()) = user_id);

-- 4. Decoupling public.listing_images FOR ALL policy
DROP POLICY IF EXISTS "listing_images_manage_owner" ON public.listing_images;

CREATE POLICY "listing_images_insert_owner" ON public.listing_images 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.listings 
    WHERE listings.id = listing_images.listing_id 
      AND (listings.seller_id = (SELECT auth.uid()) OR public.is_admin())
  ));

CREATE POLICY "listing_images_update_owner" ON public.listing_images 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.listings 
    WHERE listings.id = listing_images.listing_id 
      AND (listings.seller_id = (SELECT auth.uid()) OR public.is_admin())
  ));

CREATE POLICY "listing_images_delete_owner" ON public.listing_images 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.listings 
    WHERE listings.id = listing_images.listing_id 
      AND (listings.seller_id = (SELECT auth.uid()) OR public.is_admin())
  ));
