-- ============================================================
-- OtoBurada — Duplicate RLS Policy Cleanup
-- Generated: 2026-04-17
-- Problem: Old policies were not dropped before new ones were
-- created, resulting in multiple permissive policies per table.
-- This migration drops ALL existing policies for affected tables
-- and recreates exactly ONE policy per operation.
-- ============================================================
-- SAFE TO RUN MULTIPLE TIMES (idempotent via DROP IF EXISTS)
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. NOTIFICATIONS
-- Old: notifications_manage_own + notifications_select_own +
--      notifications_update_own + notifications_delete_own +
--      notifications_insert_admin_or_system
-- New: 3 focused policies (SELECT, INSERT, UPDATE/DELETE)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "notifications_manage_own"              ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_own"              ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own"              ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own"              ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_admin_or_system"  ON public.notifications;

-- SELECT: own notifications only
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- INSERT: only service_role / admin can create notifications
-- (app layer uses admin client — anon/authenticated users cannot insert directly)
CREATE POLICY "notifications_insert_service_or_admin"
  ON public.notifications FOR INSERT
  WITH CHECK ((SELECT public.is_admin()));

-- UPDATE + DELETE: own notifications only
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  USING ((SELECT auth.uid()) = user_id);


-- ────────────────────────────────────────────────────────────
-- 2. LISTING_IMAGES
-- Old: listing_images_select_visible + listing_images_select +
--      listing_images_manage_owner_or_admin +
--      listing_images_insert + listing_images_update +
--      listing_images_delete
-- New: 2 policies (SELECT, ALL for owner/admin)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "listing_images_select_visible"         ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_select"                 ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_manage_owner_or_admin"  ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_insert"                 ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_update"                 ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_delete"                 ON public.listing_images;

-- SELECT: visible if listing is approved OR user is owner OR admin
CREATE POLICY "listing_images_select_visible"
  ON public.listing_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = listing_images.listing_id
        AND (
          listings.status = 'approved'
          OR listings.seller_id = (SELECT auth.uid())
          OR (SELECT public.is_admin())
        )
    )
  );

-- INSERT / UPDATE / DELETE: owner or admin only
CREATE POLICY "listing_images_manage_owner_or_admin"
  ON public.listing_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = listing_images.listing_id
        AND (
          listings.seller_id = (SELECT auth.uid())
          OR (SELECT public.is_admin())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = listing_images.listing_id
        AND (
          listings.seller_id = (SELECT auth.uid())
          OR (SELECT public.is_admin())
        )
    )
  );


-- ────────────────────────────────────────────────────────────
-- 3. SAVED_SEARCHES
-- Old: saved_searches_manage_own + saved_searches_select_own +
--      saved_searches_insert_own + saved_searches_update_own +
--      saved_searches_delete_own
-- New: 1 policy (ALL for own rows)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "saved_searches_manage_own"   ON public.saved_searches;
DROP POLICY IF EXISTS "saved_searches_select_own"   ON public.saved_searches;
DROP POLICY IF EXISTS "saved_searches_insert_own"   ON public.saved_searches;
DROP POLICY IF EXISTS "saved_searches_update_own"   ON public.saved_searches;
DROP POLICY IF EXISTS "saved_searches_delete_own"   ON public.saved_searches;

CREATE POLICY "saved_searches_manage_own"
  ON public.saved_searches FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);


-- ────────────────────────────────────────────────────────────
-- 4. SELLER_REVIEWS
-- Old: "Reviews are viewable by everyone" + seller_reviews_select_public +
--      "Users can create reviews for sellers" + seller_reviews_insert_authenticated +
--      seller_reviews_insert_self + seller_reviews_delete_own +
--      seller_reviews_delete_self
-- New: 3 policies (SELECT, INSERT, DELETE)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Reviews are viewable by everyone"      ON public.seller_reviews;
DROP POLICY IF EXISTS "seller_reviews_select_public"          ON public.seller_reviews;
DROP POLICY IF EXISTS "Users can create reviews for sellers"  ON public.seller_reviews;
DROP POLICY IF EXISTS "seller_reviews_insert_authenticated"   ON public.seller_reviews;
DROP POLICY IF EXISTS "seller_reviews_insert_self"            ON public.seller_reviews;
DROP POLICY IF EXISTS "seller_reviews_delete_own"             ON public.seller_reviews;
DROP POLICY IF EXISTS "seller_reviews_delete_self"            ON public.seller_reviews;

-- SELECT: public (marketplace trust signals)
CREATE POLICY "seller_reviews_select_public"
  ON public.seller_reviews FOR SELECT
  USING (true);

-- INSERT: reviewer must be the authenticated user
CREATE POLICY "seller_reviews_insert_self"
  ON public.seller_reviews FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = reviewer_id);

-- DELETE: own review or admin
CREATE POLICY "seller_reviews_delete_self"
  ON public.seller_reviews FOR DELETE
  USING (
    (SELECT auth.uid()) = reviewer_id
    OR (SELECT public.is_admin())
  );


-- ────────────────────────────────────────────────────────────
-- 5. LISTING_PRICE_HISTORY
-- Old: "Price history is public for approved listings" +
--      listing_price_history_select_owner_or_public +
--      price_history_select_public
-- New: 1 policy (SELECT scoped to approved listings)
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'listing_price_history'
  ) THEN
    EXECUTE $p$ DROP POLICY IF EXISTS "Price history is public for approved listings" ON public.listing_price_history $p$;
    EXECUTE $p$ DROP POLICY IF EXISTS "listing_price_history_select_owner_or_public"  ON public.listing_price_history $p$;
    EXECUTE $p$ DROP POLICY IF EXISTS "price_history_select_public"                   ON public.listing_price_history $p$;

    EXECUTE $p$
      CREATE POLICY "listing_price_history_select_public"
        ON public.listing_price_history FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.listings
            WHERE listings.id = listing_price_history.listing_id
              AND (
                listings.status = 'approved'
                OR listings.seller_id = (SELECT auth.uid())
                OR (SELECT public.is_admin())
              )
          )
        )
    $p$;
  END IF;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 6. LISTING_VIEWS
-- Old: listing_views_insert_anyone + listing_views_insert_controlled
-- New: 1 INSERT policy (require listing to exist)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "listing_views_insert_anyone"      ON public.listing_views;
DROP POLICY IF EXISTS "listing_views_insert_controlled"  ON public.listing_views;

CREATE POLICY "listing_views_insert_anyone"
  ON public.listing_views FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = listing_views.listing_id
    )
  );

-- SELECT: owner or admin (keep existing, just re-apply)
DROP POLICY IF EXISTS "listing_views_select_owner_or_admin" ON public.listing_views;
CREATE POLICY "listing_views_select_owner_or_admin"
  ON public.listing_views FOR SELECT
  USING (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = listing_views.listing_id
        AND listings.seller_id = (SELECT auth.uid())
    )
  );


-- ────────────────────────────────────────────────────────────
-- 7. PHONE_REVEAL_LOGS
-- Old: phone_reveal_logs_insert_anyone + phone_reveal_logs_insert_approved_listing
-- New: 1 INSERT policy (require approved listing)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "phone_reveal_logs_insert_anyone"            ON public.phone_reveal_logs;
DROP POLICY IF EXISTS "phone_reveal_logs_insert_approved_listing"  ON public.phone_reveal_logs;

CREATE POLICY "phone_reveal_logs_insert_approved_listing"
  ON public.phone_reveal_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = phone_reveal_logs.listing_id
        AND listings.status = 'approved'
    )
  );

-- SELECT: owner or admin (re-apply with (select auth.uid()) pattern)
DROP POLICY IF EXISTS "phone_reveal_logs_select_owner_or_admin" ON public.phone_reveal_logs;
CREATE POLICY "phone_reveal_logs_select_owner_or_admin"
  ON public.phone_reveal_logs FOR SELECT
  USING (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = phone_reveal_logs.listing_id
        AND listings.seller_id = (SELECT auth.uid())
    )
  );


-- ────────────────────────────────────────────────────────────
-- 8. PLATFORM_SETTINGS
-- Old: platform_settings_admin_write + platform_settings_admin_update +
--      platform_settings_admin_delete (all with bare auth.uid())
-- New: 1 ALL policy for admin
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'platform_settings'
  ) THEN
    EXECUTE $p$ DROP POLICY IF EXISTS "platform_settings_admin_write"  ON public.platform_settings $p$;
    EXECUTE $p$ DROP POLICY IF EXISTS "platform_settings_admin_update" ON public.platform_settings $p$;
    EXECUTE $p$ DROP POLICY IF EXISTS "platform_settings_admin_delete" ON public.platform_settings $p$;
    EXECUTE $p$ DROP POLICY IF EXISTS "platform_settings_select_all"   ON public.platform_settings $p$;
    EXECUTE $p$ DROP POLICY IF EXISTS "platform_settings_admin_all"    ON public.platform_settings $p$;

    -- Public read (settings like feature flags may be needed by frontend)
    EXECUTE $p$
      CREATE POLICY "platform_settings_select_all"
        ON public.platform_settings FOR SELECT
        USING (true)
    $p$;

    -- Write: admin only
    EXECUTE $p$
      CREATE POLICY "platform_settings_admin_write"
        ON public.platform_settings FOR ALL
        USING ((SELECT public.is_admin()))
        WITH CHECK ((SELECT public.is_admin()))
    $p$;
  END IF;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 9. ROLES TABLE
-- Old: "Admins can do anything with roles" (bare auth.uid() in is_admin())
-- New: same policy but is_admin() now uses (select auth.uid()) internally
--      via SECURITY DEFINER — just re-apply to clear the initplan warning
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'roles'
  ) THEN
    EXECUTE $p$ DROP POLICY IF EXISTS "Admins can do anything with roles" ON public.roles $p$;
    EXECUTE $p$ DROP POLICY IF EXISTS "roles_admin_all"                   ON public.roles $p$;

    EXECUTE $p$
      CREATE POLICY "roles_admin_all"
        ON public.roles FOR ALL
        USING ((SELECT public.is_admin()))
        WITH CHECK ((SELECT public.is_admin()))
    $p$;
  END IF;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- VERIFICATION
-- Run after applying — should return 0 rows for each query
-- ────────────────────────────────────────────────────────────

-- Check 1: Multiple permissive policies per table+operation
-- SELECT tablename, cmd, count(*) as cnt, array_agg(policyname) as policies
-- FROM pg_policies
-- WHERE schemaname = 'public' AND permissive = 'PERMISSIVE'
-- GROUP BY tablename, cmd
-- HAVING count(*) > 1
-- ORDER BY cnt DESC;

-- Check 2: Policies with bare auth.uid() (not wrapped in SELECT)
-- SELECT tablename, policyname, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (
--     (qual ~ 'auth\.uid\(\)' AND qual !~ '\(select auth\.uid\(\)\)')
--     OR
--     (with_check ~ 'auth\.uid\(\)' AND with_check !~ '\(select auth\.uid\(\)\)')
--   );

-- ============================================================
-- END
-- ============================================================
