-- Migration: Allow public SELECT on profiles for marketplace visibility
-- This fixes the issue where listings were not visible to guest users because
-- the !inner join on profiles filtered out all rows due to restrictive RLS.

-- Drop existing restricted policy if it exists (it was re-applied in 0022)
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;

-- Create a more inclusive SELECT policy that allows:
-- 1. Anyone to see non-banned profiles (needed for marketplace)
-- 2. Users to see their own profile (even if banned, for dashboard)
-- 3. Admins to see all profiles
-- 4. Chat participants to see each other
CREATE POLICY "profiles_select_marketplace_and_self"
ON public.profiles
FOR SELECT
USING (
  (NOT is_banned) -- Public can see anyone who isn't banned
  OR (SELECT auth.uid()) = id -- Users can always see themselves
  OR (SELECT public.is_admin()) -- Admins can see everyone
  OR EXISTS ( -- Chat participants can see each other
    SELECT 1
    FROM public.chats
    WHERE (SELECT auth.uid()) IN (chats.buyer_id, chats.seller_id)
      AND public.profiles.id IN (chats.buyer_id, chats.seller_id)
  )
);
