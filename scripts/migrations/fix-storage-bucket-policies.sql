-- Migration: fix-storage-bucket-policies.sql
-- Applied: 2026-04-17
-- Purpose: Create Supabase Storage RLS policies for listing-images and
--          listing-documents buckets. These were previously only documented
--          as comments in schema.sql but never applied as actual SQL.
--
-- Prerequisites:
--   1. Create buckets in Supabase Dashboard (Storage > New bucket):
--      - "listing-images"  → Public: ON
--      - "listing-documents" → Public: OFF (private, signed URLs only)
--   2. Run this migration in the SQL editor.
--
-- Rollback:
--   DELETE FROM storage.buckets WHERE id IN ('listing-images', 'listing-documents');
--   (policies are cascade-deleted with the bucket)

-- ── listing-images bucket ────────────────────────────────────────────────────

-- Public read: anyone can view listing images (bucket is public)
DROP POLICY IF EXISTS "listing_images_public_read" ON storage.objects;
CREATE POLICY "listing_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

-- Authenticated users can upload to their own folder only
-- Path format: listings/{user_id}/{uuid}.{ext}
DROP POLICY IF EXISTS "listing_images_owner_insert" ON storage.objects;
CREATE POLICY "listing_images_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'listings'
    AND (storage.foldername(name))[2] = (SELECT auth.uid()::text)
  );

-- Users can only delete their own images
DROP POLICY IF EXISTS "listing_images_owner_delete" ON storage.objects;
CREATE POLICY "listing_images_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-images'
    AND (
      (
        (storage.foldername(name))[1] = 'listings'
        AND (storage.foldername(name))[2] = (SELECT auth.uid()::text)
      )
      OR (SELECT public.is_admin())
    )
  );

-- Users can update (replace) their own images
DROP POLICY IF EXISTS "listing_images_owner_update" ON storage.objects;
CREATE POLICY "listing_images_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = 'listings'
    AND (storage.foldername(name))[2] = (SELECT auth.uid()::text)
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = 'listings'
    AND (storage.foldername(name))[2] = (SELECT auth.uid()::text)
  );

-- ── listing-documents bucket ─────────────────────────────────────────────────
-- Private bucket — no public read. Access via signed URLs only.

-- Owners and admins can read their own documents
DROP POLICY IF EXISTS "listing_documents_owner_read" ON storage.objects;
CREATE POLICY "listing_documents_owner_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'listing-documents'
    AND (
      (
        (storage.foldername(name))[1] = 'documents'
        AND (storage.foldername(name))[2] = (SELECT auth.uid()::text)
      )
      OR (SELECT public.is_admin())
    )
  );

-- Authenticated users can upload to their own folder only
-- Path format: documents/{user_id}/{uuid}.{ext}
DROP POLICY IF EXISTS "listing_documents_owner_insert" ON storage.objects;
CREATE POLICY "listing_documents_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'documents'
    AND (storage.foldername(name))[2] = (SELECT auth.uid()::text)
  );

-- Users can delete their own documents; admins can delete any
DROP POLICY IF EXISTS "listing_documents_owner_delete" ON storage.objects;
CREATE POLICY "listing_documents_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-documents'
    AND (
      (
        (storage.foldername(name))[1] = 'documents'
        AND (storage.foldername(name))[2] = (SELECT auth.uid()::text)
      )
      OR (SELECT public.is_admin())
    )
  );
