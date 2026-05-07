-- Migration 0144_fix_gaps_and_hard_rules.sql
-- Description: Resolve Phase 1 Database Audit Findings (BUG-DB-01, BUG-DB-02, BUG-DB-03, BUG-DB-04)

-- BUG-DB-01: Protect chats and message history on listing deletion
ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_listing_id_fkey;
ALTER TABLE public.chats ALTER COLUMN listing_id DROP NOT NULL;
ALTER TABLE public.chats ADD CONSTRAINT chats_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL;

-- BUG-DB-02: Fix offers buyer_id constraint and soft delete offer expiration
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_buyer_id_fkey;
ALTER TABLE public.offers ADD CONSTRAINT offers_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

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

  -- Expire pending offers belonging to or received by the user
  UPDATE public.offers
  SET status = 'expired',
      updated_at = timezone('utc', now())
  WHERE (buyer_id = p_user_id OR listing_id IN (SELECT id FROM public.listings WHERE seller_id = p_user_id))
    AND status = 'pending';
END;
$$;

-- BUG-DB-03: Change credit_transactions.user_id ON DELETE to RESTRICT for financial ledger immutability
ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;
ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- BUG-DB-04: Match payments.amount type with subunit integer representation (bigint)
ALTER TABLE public.payments ALTER COLUMN amount TYPE bigint USING (round(amount)::bigint);
