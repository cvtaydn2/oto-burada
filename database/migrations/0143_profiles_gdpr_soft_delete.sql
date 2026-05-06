-- Migration 0143_profiles_gdpr_soft_delete.sql
-- Description: Implement GDPR soft delete and anonymization on profiles table and archive associated listings.

-- Add columns to public.profiles if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS anonymized_at timestamptz;

-- Create soft delete function
CREATE OR REPLACE FUNCTION public.soft_delete_profile(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorize: must be the user themselves OR an admin
  IF (SELECT auth.uid()) <> p_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Anonymize profile data
  UPDATE public.profiles
  SET 
    is_deleted = true,
    anonymized_at = timezone('utc', now()),
    full_name = 'Deleted User',
    phone = '',
    city = '',
    avatar_url = null,
    identity_number = null,
    business_name = null,
    business_address = null,
    business_logo_url = null,
    website_url = null,
    business_slug = null,
    tax_id = null,
    tax_office = null,
    is_verified = false,
    verified_business = false,
    balance_credits = 0,
    updated_at = timezone('utc', now())
  WHERE id = p_user_id;

  -- Archive listings belonging to the user
  UPDATE public.listings
  SET status = 'archived'
  WHERE seller_id = p_user_id;
END;
$$;
