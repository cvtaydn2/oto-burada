-- 1. Storage Policies for listing-documents (Private Bucket)
-- Ensure bucket is private
UPDATE storage.buckets SET public = false WHERE id = 'listing-documents';

-- Policy: Authenticated users can upload their own documents
CREATE POLICY "Auth Insert Documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'listing-documents' 
  AND auth.role() = 'authenticated' 
  -- Path format: documents/{auth.uid()}/{uuid}.ext
  AND (storage.foldername(name))[1] = 'documents'
  AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
);

-- Policy: Owners can delete their own documents
CREATE POLICY "Auth Delete Documents" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'listing-documents' 
  AND auth.role() = 'authenticated' 
  AND (storage.foldername(name))[1] = 'documents'
  AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
);

-- Policy: Owners can select their own documents (for preview/manage)
-- Note: signed URLs also work regardless of this policy if generated via admin
CREATE POLICY "Auth Select Own Documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'listing-documents' 
  AND auth.role() = 'authenticated' 
  AND (storage.foldername(name))[1] = 'documents'
  AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
);

-- Note: No "Public Read" policy for listing-documents. Signed URLs only.

-- 2. Audit & Refine Full Text Search Index
-- GIN index on 'search_vector' already exists in schema.snapshot.sql,
-- but we ensure it covers the latest column structure if it was changed.
-- (search_vector is GENERATED ALWAYS AS Turkish Unaccent titles + description etc.)
-- This index is vital for performance.
CREATE INDEX IF NOT EXISTS listings_search_vector_gin_idx ON public.listings USING gin (search_vector);

-- 3. Enhance Profiles/Listings Performance
-- Ensure btree indexes on city/district to support the 'eq' filters we just updated.
CREATE INDEX IF NOT EXISTS listings_city_exact_idx ON public.listings (city);
CREATE INDEX IF NOT EXISTS listings_district_exact_idx ON public.listings (district);
