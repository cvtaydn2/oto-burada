-- Consolidate overlapping permissive RLS policies for performance.
-- Targets: public.listing_images, public.listing_questions, public.profiles

-- -------------------------------------------------------------------
-- listing_images
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "listing_images_insert_owner" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_update_owner" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_delete_owner" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_insert_owner_or_admin" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_update_owner_or_admin" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_delete_owner_or_admin" ON public.listing_images;

CREATE POLICY "listing_images_insert_owner_or_admin"
ON public.listing_images
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.listings
    WHERE listings.id = listing_images.listing_id
      AND (listings.seller_id = (SELECT auth.uid()) OR public.is_admin())
  )
);

CREATE POLICY "listing_images_update_owner_or_admin"
ON public.listing_images
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.listings
    WHERE listings.id = listing_images.listing_id
      AND (listings.seller_id = (SELECT auth.uid()) OR public.is_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.listings
    WHERE listings.id = listing_images.listing_id
      AND (listings.seller_id = (SELECT auth.uid()) OR public.is_admin())
  )
);

CREATE POLICY "listing_images_delete_owner_or_admin"
ON public.listing_images
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.listings
    WHERE listings.id = listing_images.listing_id
      AND (listings.seller_id = (SELECT auth.uid()) OR public.is_admin())
  )
);

-- -------------------------------------------------------------------
-- listing_questions
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "listing_questions_admin_all_v2" ON public.listing_questions;
DROP POLICY IF EXISTS "listing_questions_select_v3" ON public.listing_questions;
DROP POLICY IF EXISTS "listing_questions_insert_asker" ON public.listing_questions;
DROP POLICY IF EXISTS "listing_questions_update_owner" ON public.listing_questions;

CREATE POLICY "listing_questions_select_unified"
ON public.listing_questions
FOR SELECT
USING (
  public.is_admin()
  OR status = 'approved'
  OR user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.listings
    WHERE listings.id = listing_questions.listing_id
      AND listings.seller_id = (SELECT auth.uid())
  )
);

CREATE POLICY "listing_questions_insert_unified"
ON public.listing_questions
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR user_id = (SELECT auth.uid())
);

CREATE POLICY "listing_questions_update_unified"
ON public.listing_questions
FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.listings
    WHERE listings.id = listing_questions.listing_id
      AND listings.seller_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.listings
    WHERE listings.id = listing_questions.listing_id
      AND listings.seller_id = (SELECT auth.uid())
  )
);

-- -------------------------------------------------------------------
-- profiles (identity number duplication cleanup)
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own identity_number" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own identity_number" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;

CREATE POLICY "profiles_select_self_or_admin"
ON public.profiles
FOR SELECT
USING ((SELECT auth.uid()) = id OR public.is_admin());

CREATE POLICY "profiles_update_self_or_admin"
ON public.profiles
FOR UPDATE
USING ((SELECT auth.uid()) = id OR public.is_admin())
WITH CHECK ((SELECT auth.uid()) = id OR public.is_admin());
