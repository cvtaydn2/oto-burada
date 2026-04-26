-- Migration: 0109_monetization_tiers_and_corporate_plan
-- Purpose: Support tiered listing quotas (3, 50, 200) and seed professional plans.

-- 1. Update user_type enum to include 'corporate'
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE public.user_type AS ENUM ('individual', 'professional', 'staff', 'corporate');
    ELSE
        BEGIN
            ALTER TYPE public.user_type ADD VALUE 'corporate';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- 2. Update the atomic quota check RPC to support the new tiers
CREATE OR REPLACE FUNCTION public.check_and_reserve_listing_quota(
  p_user_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_max integer;
  v_user_type public.user_type;
BEGIN
  -- Lock the profile row to serialize quota checks
  PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  
  -- Get user type
  SELECT user_type INTO v_user_type FROM public.profiles WHERE id = p_user_id;

  -- Count active listings
  SELECT count(*) INTO v_count 
  FROM public.listings 
  WHERE seller_id = p_user_id 
    AND status IN ('draft', 'pending', 'approved');
  
  -- Determine limit based on tiered model
  v_max := CASE 
    WHEN v_user_type = 'corporate' THEN 200
    WHEN v_user_type = 'professional' THEN 50
    ELSE 3 -- Individual
  END;
  
  RETURN v_count < v_max;
END;
$$;

-- 3. Seed Pricing Plans with the new tiers
-- We clear old plans to ensure fresh start with the new model
DELETE FROM public.pricing_plans WHERE name IN ('Pro', 'Kurumsal Filo');

INSERT INTO public.pricing_plans (name, price, credits, features, is_active)
VALUES
  (
    'Pro', 
    1490.00, 
    500, -- Credits can be used for extra doping
    '["50 aktif ilan hakkı", "Ayda 5 ücretsiz doping kredisi", "Profesyonel satıcı rozeti", "Öncelikli destek"]'::jsonb, 
    true
  ),
  (
    'Kurumsal Filo', 
    4990.00, 
    2000, 
    '["200 aktif ilan hakkı", "Sınırsız doping kullanımı", "Kurumsal rozet", "API erişimi", "Hesap yöneticisi"]'::jsonb, 
    true
  );

COMMENT ON FUNCTION public.check_and_reserve_listing_quota IS 
  'Atomically checks if a user has remaining listing quota (Individual: 3, Pro: 50, Corporate: 200).';
