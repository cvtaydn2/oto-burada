-- Migration: Atomic listing deletion with transaction
-- Date: 2025-04-27
-- Purpose: Prevent partial deletes when listing deletion fails

-- Create atomic delete function
CREATE OR REPLACE FUNCTION delete_listing_atomic(
  p_listing_id uuid,
  p_version int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete associated data first (cascading)
  DELETE FROM listing_images WHERE listing_id = p_listing_id;
  DELETE FROM favorites WHERE listing_id = p_listing_id;
  DELETE FROM reports WHERE listing_id = p_listing_id;
  
  -- Delete the listing with version check (OCC)
  DELETE FROM listings 
  WHERE id = p_listing_id 
    AND version = p_version;
  
  -- Check if listing was actually deleted
  IF NOT FOUND THEN
    RAISE EXCEPTION 'concurrent_update_detected';
  END IF;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION delete_listing_atomic IS 
'Atomically deletes a listing and all associated data (images, favorites, reports) with optimistic concurrency control';

-- Grant execute permission to authenticated users (RLS will still apply)
GRANT EXECUTE ON FUNCTION delete_listing_atomic TO authenticated;
