-- 0123_listing_image_rpc_consolidation.sql
-- PERFORMANCE: Issue PERF-05 - Consolidate image round-trips
-- Consolidates listing update, image deletion, and image upsert into a single atomic RPC call.

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
  
  -- Security check (if called via authenticated role)
  IF auth.uid() IS NOT NULL AND auth.uid() <> v_seller_id THEN
    RAISE EXCEPTION 'unauthorized_access';
  END IF;

  -- 2. Update listing with Optimistic Concurrency Control (OCC)
  UPDATE public.listings
  SET 
    title = p_listing_data->>'title',
    price = (p_listing_data->>'price')::numeric,
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
    version = version + 1,
    updated_at = now()
  WHERE id = v_listing_id 
    AND version = (p_listing_data->>'version')::integer
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

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_listing_with_images(jsonb, text[], jsonb[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_listing_with_images(jsonb, text[], jsonb[]) TO service_role;
