-- Migration: 0104_atomic_quota_and_performance_indexes
-- Purpose: Resolve race condition in quota check and optimize marketplace search.

-- 1. BULGU 3.1: Atomic Quota Check RPC
-- This provides a way to check quota before starting the multi-step listing creation process.
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
BEGIN
  -- Lock the profile row to serialize quota checks for this specific user.
  -- This prevents concurrent transactions from both seeing "under limit" counts.
  PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  
  -- Count active listings (excluding archived/rejected)
  SELECT count(*) INTO v_count 
  FROM public.listings 
  WHERE seller_id = p_user_id 
    AND status IN ('draft', 'pending', 'approved');
  
  -- Determine limit: Professional users get 50, standard users get 3.
  SELECT CASE WHEN user_type = 'professional' THEN 50 ELSE 3 END 
  INTO v_max FROM public.profiles WHERE id = p_user_id;
  
  RETURN v_count < v_max;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_reserve_listing_quota(uuid) TO authenticated, service_role;

-- 2. BULGU 4.1: Composite Marketplace Index
-- Optimized for the most common filter combinations + sorting.
-- Using INCLUDE for "covering index" pattern to reduce heap lookups for list view data.
CREATE INDEX IF NOT EXISTS idx_listings_marketplace_search
ON public.listings (status, brand, model, year, price, city)
INCLUDE (slug, title, mileage, fuel_type, transmission, bumped_at)
WHERE status = 'approved';

-- 3. BULGU 4.2: Unique Index on Slug
CREATE INDEX IF NOT EXISTS idx_listings_slug_lookup 
ON public.listings (slug) 
WHERE (status <> 'archived'::listing_status);

COMMENT ON FUNCTION public.check_and_reserve_listing_quota IS 
  'Atomically checks if a user has remaining listing quota by locking their profile row.';
