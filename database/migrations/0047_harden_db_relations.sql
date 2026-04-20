-- Hardening database relationships to prevent accidental data loss.
-- Changes 'ON DELETE CASCADE' to 'ON DELETE RESTRICT' for critical financial/audit entities.

BEGIN;

-- 1. Profiles (prevent deleting profile if auth user is deleted but records exist)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE RESTRICT;

-- 2. Listings (prevent deleting listings if profile is deleted)
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_seller_id_fkey,
  ADD CONSTRAINT listings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- 3. Reports (preserve reporting history)
ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_listing_id_fkey,
  ADD CONSTRAINT reports_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE RESTRICT;

-- 4. Admin Actions (keep record of actions even if admin is deleted)
ALTER TABLE public.admin_actions
  DROP CONSTRAINT IF EXISTS admin_actions_admin_user_id_fkey,
  ADD CONSTRAINT admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMIT;
