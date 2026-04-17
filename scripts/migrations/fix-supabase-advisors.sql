-- Drop the unneeded/buggy function with a role mutable search_path
DROP FUNCTION IF EXISTS public.get_featured_listings;

-- Replace the dangerous RLS on gallery_views
DROP POLICY IF EXISTS "gallery_views_insert_anyone" ON public.gallery_views;
CREATE POLICY "gallery_views_insert_anyone"
  ON public.gallery_views FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = gallery_views.seller_id
        AND profiles.user_type = 'professional'
    )
  );

-- Tighten the Storage Objects policy to only allow owner SELECT for listing-images
DROP POLICY IF EXISTS "Public listing-images Read" ON storage.objects;

-- If they already created the "listing_images_public_read" from the dashboard
DROP POLICY IF EXISTS "listing_images_public_read" ON storage.objects;

CREATE POLICY "Owner listing-images Read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'listing-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'listings'
  AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
);
