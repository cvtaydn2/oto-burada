-- Migration: 0132_harden_infrastructure_security
-- Purpose: 
-- 1. Atomic creation & quota check (RPC).
-- 2. Payment idempotency (Unique Key).
-- 3. Currency precision (bigint cents/kurus).
-- 4. Fix OCC versioning logic.

-- 1. Create atomic listing creation RPC
CREATE OR REPLACE FUNCTION public.create_listing_with_images(
  p_listing_data jsonb,
  p_images_to_upsert jsonb[]
) RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_count integer;
  v_max integer;
  v_new_listing jsonb;
  v_listing_id uuid;
BEGIN
  v_user_id := (p_listing_data->>'seller_id')::uuid;
  
  -- Security check
  IF auth.uid() IS NOT NULL AND auth.uid() <> v_user_id THEN
    RAISE EXCEPTION 'unauthorized_access';
  END IF;

  -- 1. Lock the profile row for quota check
  -- PILL: Issue H-3 - Prevent TOCTOU quota race
  PERFORM 1 FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  
  -- 2. Check quota
  SELECT count(*) INTO v_count 
  FROM public.listings 
  WHERE seller_id = v_user_id 
    AND status IN ('draft', 'pending', 'approved');
    
  SELECT CASE WHEN user_type = 'professional' THEN 50 ELSE 3 END 
  INTO v_max FROM public.profiles WHERE id = v_user_id;
  
  IF v_count >= v_max THEN
    RAISE EXCEPTION 'quota_exceeded';
  END IF;

  -- 3. Insert listing
  INSERT INTO public.listings (
    seller_id, slug, title, category, brand, model, year, mileage, 
    fuel_type, transmission, price, city, district, description, 
    whatsapp_phone, vin, license_plate, car_trim, tramer_amount, 
    damage_status_json, status, version
  ) VALUES (
    v_user_id,
    p_listing_data->>'slug',
    p_listing_data->>'title',
    COALESCE(p_listing_data->>'category', 'otomobil'),
    p_listing_data->>'brand',
    p_listing_data->>'model',
    (p_listing_data->>'year')::integer,
    (p_listing_data->>'mileage')::integer,
    (p_listing_data->>'fuel_type')::public.fuel_type,
    (p_listing_data->>'transmission')::public.transmission_type,
    (p_listing_data->>'price')::bigint,
    p_listing_data->>'city',
    p_listing_data->>'district',
    p_listing_data->>'description',
    p_listing_data->>'whatsapp_phone',
    p_listing_data->>'vin',
    p_listing_data->>'license_plate',
    p_listing_data->>'car_trim',
    (p_listing_data->>'tramer_amount')::numeric,
    (p_listing_data->'damage_status_json'),
    COALESCE((p_listing_data->>'status')::public.listing_status, 'pending'),
    1 -- Initial version starts at 1
  ) RETURNING id, to_jsonb(public.listings.*) INTO v_listing_id, v_new_listing;

  -- 4. Insert images
  IF p_images_to_upsert IS NOT NULL AND array_length(p_images_to_upsert, 1) > 0 THEN
    INSERT INTO public.listing_images (
      listing_id, storage_path, public_url, is_cover, sort_order, placeholder_blur
    )
    SELECT 
      v_listing_id,
      (img->>'storage_path'),
      (img->>'public_url'),
      (img->>'is_cover')::boolean,
      (img->>'sort_order')::integer,
      (img->>'placeholder_blur')
    FROM unnest(p_images_to_upsert) AS img;
  END IF;

  RETURN v_new_listing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_listing_with_images(jsonb, jsonb[]) TO authenticated, service_role;

-- 2. Harden Payment Idempotency
-- PILL: Issue C-1 - Prevent double charge via unique constraint
ALTER TABLE public.payments ADD CONSTRAINT payments_idempotency_key_unique UNIQUE (idempotency_key);

-- 3. Currency Precision Migration (decimal -> bigint cents)
-- PILL: Issue C-3 - Prevent floating point precision errors
ALTER TABLE public.listings ALTER COLUMN price TYPE bigint USING (price * 100)::bigint;
ALTER TABLE public.payments ALTER COLUMN amount TYPE bigint USING (amount * 100)::bigint;
ALTER TABLE public.pricing_plans ALTER COLUMN price TYPE bigint USING (price * 100)::bigint;
ALTER TABLE public.market_stats ALTER COLUMN avg_price TYPE bigint USING (avg_price * 100)::bigint;

-- 4. Align OCC Logic in upsert_listing_with_images
-- We keep the version increment in SQL, but ensure the check matches the incoming version.
-- Note: In the application code, mapListingToDatabaseRow will no longer add +1.
CREATE OR REPLACE FUNCTION public.upsert_listing_with_images(
  p_listing_data jsonb,
  p_images_to_delete text[],
  p_images_to_upsert jsonb[]
) RETURNS jsonb AS $$
DECLARE
  v_listing_id uuid;
  v_seller_id uuid;
  v_updated_listing jsonb;
BEGIN
  v_listing_id := (p_listing_data->>'id')::uuid;
  
  -- 1. Get current seller_id to verify ownership
  SELECT seller_id INTO v_seller_id FROM public.listings WHERE id = v_listing_id;
  
  -- Security check
  IF auth.uid() IS NOT NULL AND auth.uid() <> v_seller_id THEN
    RAISE EXCEPTION 'unauthorized_access';
  END IF;

  -- 2. Update listing with OCC
  -- PILL: Issue C-5 - OCC Version Check
  UPDATE public.listings
  SET 
    title = p_listing_data->>'title',
    price = (p_listing_data->>'price')::bigint, -- Updated to bigint
    description = p_listing_data->>'description',
    city = p_listing_data->>'city',
    district = p_listing_data->>'district',
    mileage = (p_listing_data->>'mileage')::integer,
    fuel_type = p_listing_data->>'fuel_type',
    transmission = p_listing_data->>'transmission',
    license_plate = p_listing_data->>'license_plate',
    vin = p_listing_data->>'vin',
    car_trim = p_listing_data->>'car_trim',
    tramer_amount = (p_listing_data->>'tramer_amount')::numeric,
    damage_status_json = (p_listing_data->'damage_status_json'),
    whatsapp_phone = p_listing_data->>'whatsapp_phone',
    version = version + 1, -- Increment on update
    updated_at = now()
  WHERE id = v_listing_id 
    AND version = (p_listing_data->>'version')::integer -- Matches current version on client
  RETURNING to_jsonb(public.listings.*) INTO v_updated_listing;

  IF v_updated_listing IS NULL THEN
    RAISE EXCEPTION 'concurrent_update_detected';
  END IF;

  -- 3. Delete orphaned images
  IF p_images_to_delete IS NOT NULL AND array_length(p_images_to_delete, 1) > 0 THEN
    DELETE FROM public.listing_images
    WHERE listing_id = v_listing_id 
      AND storage_path = ANY(p_images_to_delete);
  END IF;

  -- 4. Upsert images
  IF p_images_to_upsert IS NOT NULL AND array_length(p_images_to_upsert, 1) > 0 THEN
    INSERT INTO public.listing_images (
      listing_id, storage_path, public_url, is_cover, sort_order, placeholder_blur
    )
    SELECT 
      v_listing_id,
      (img->>'storage_path'),
      (img->>'public_url'),
      (img->>'is_cover')::boolean,
      (img->>'sort_order')::integer,
      (img->>'placeholder_blur')
    FROM unnest(p_images_to_upsert) AS img
    ON CONFLICT (listing_id, storage_path) DO UPDATE SET
      public_url = EXCLUDED.public_url,
      is_cover = EXCLUDED.is_cover,
      sort_order = EXCLUDED.sort_order,
      placeholder_blur = EXCLUDED.placeholder_blur;
  END IF;

  RETURN v_updated_listing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
