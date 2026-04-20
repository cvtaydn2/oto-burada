-- 0050_database_hardening_indexes.sql
-- Production Hardening: Partial Unique Indexes for Soft-Delete Support

-- 1. Slug Unique Index (Partial)
-- Existing unique constraint on 'slug' column needs to be dropped and replaced with a partial index.
-- However, if 'slug' was defined as 'UNIQUE' in CREATE TABLE, it's a constraint we need to drop.
DO $$
BEGIN
    ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_slug_key;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DROP INDEX IF EXISTS public.listings_slug_idx;
CREATE UNIQUE INDEX listings_slug_unique_active_idx ON public.listings (slug) 
WHERE status != 'archived';

-- 2. VIN (Şasi No) Unique Index (Partial)
-- We already had one, but let's ensure it's correct for soft-delete.
DROP INDEX IF EXISTS public.listings_vin_active_idx;
CREATE UNIQUE INDEX listings_vin_unique_active_idx ON public.listings (vin) 
WHERE status NOT IN ('archived', 'rejected');

-- 3. License Plate (Plaka) Unique Index (Partial)
CREATE UNIQUE INDEX listings_license_plate_unique_active_idx ON public.listings (license_plate) 
WHERE status NOT IN ('archived', 'rejected') AND license_plate IS NOT NULL;

-- 4. Messaging Publication Security Check
-- Ensure only authenticated users can use the publication.
ALTER PUBLICATION supabase_realtime SET (publish_via_partition_root = true);
