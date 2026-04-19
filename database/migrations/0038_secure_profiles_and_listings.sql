-- Migration: Secure sensitive columns from unauthorized user updates
-- Prevent privilege escalation (role), credit manipulation (balance), and status bypass (listing status)

-- 1. Profiles Protection Trigger
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user is NOT an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    -- Prevent changing role
    IF NEW.role <> OLD.role THEN
      RAISE EXCEPTION 'Yetkisiz rol deiimi denemesi. (Role modification restricted)';
    END IF;

    -- Prevent changing balance
    IF NEW.balance_credits <> OLD.balance_credits THEN
      RAISE EXCEPTION 'Yetkisiz bakiye deiimi denemesi. (Balance modification restricted)';
    END IF;

    -- Prevent changing verification status
    IF NEW.is_verified <> OLD.is_verified THEN
      RAISE EXCEPTION 'Yetkisiz dorulama durumu deiimi denemesi. (Verification status modification restricted)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_sensitive_columns ON public.profiles;
CREATE TRIGGER profiles_protect_sensitive_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_columns();


-- 2. Listings Protection Trigger
CREATE OR REPLACE FUNCTION public.protect_listing_status_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user is NOT an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    -- A user can only set status to 'pending' or 'withdrawn' (if they want to hide it)
    -- They CANNOT set it to 'approved' or 'rejected'.
    IF NEW.status IN ('approved', 'rejected') AND OLD.status NOT IN ('approved', 'rejected') THEN
      RAISE EXCEPTION 'İlan durumu sadece moderatörler tarafından onaylanabilir. (Moderation bypass restricted)';
    END IF;
    
    -- Prevent changing back to approved if it was rejected
    IF OLD.status = 'rejected' AND NEW.status = 'approved' THEN
       RAISE EXCEPTION 'Reddedilen ilan onaylanamaz. (Cannot approve rejected listing)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_protect_status ON public.listings;
CREATE TRIGGER listings_protect_status
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_listing_status_column();
