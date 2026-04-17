-- ============================================================
-- Migration: Fix Remaining Performance Warnings (Round 2)
-- Supabase SQL Editor'da çalıştırın
-- ============================================================

-- ============================================================
-- 1. notifications_insert_admin_or_system — auth.jwt() wrap et
-- ============================================================
DROP POLICY IF EXISTS "notifications_insert_admin_or_system" ON public.notifications;
CREATE POLICY "notifications_insert_admin_or_system" ON public.notifications
  FOR INSERT WITH CHECK (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (SELECT auth.uid()) IS NULL
  );

-- ============================================================
-- 2. platform_settings — ALL policy SELECT ile çakışıyor
-- Çözüm: ALL yerine INSERT/UPDATE/DELETE ayrı, SELECT ayrı
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage platform_settings" ON public.platform_settings;

CREATE POLICY "platform_settings_admin_write" ON public.platform_settings
  FOR INSERT WITH CHECK (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "platform_settings_admin_update" ON public.platform_settings
  FOR UPDATE USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "platform_settings_admin_delete" ON public.platform_settings
  FOR DELETE USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- SELECT: admin + public birleşik tek policy
DROP POLICY IF EXISTS "Public can view platform_settings" ON public.platform_settings;
CREATE POLICY "platform_settings_select" ON public.platform_settings
  FOR SELECT USING (true);

-- ============================================================
-- 3. tickets — ALL admin policy, user policy'leriyle çakışıyor
-- Çözüm: ALL yerine ayrı operation'lar
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.tickets;

CREATE POLICY "tickets_admin_update" ON public.tickets
  FOR UPDATE USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "tickets_admin_delete" ON public.tickets
  FOR DELETE USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- SELECT: admin + user birleşik tek policy
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
CREATE POLICY "tickets_select" ON public.tickets
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- INSERT: user + admin birleşik tek policy
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
CREATE POLICY "tickets_insert" ON public.tickets
  FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid())
    OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- 4. listing_images — ALL policy SELECT ile çakışıyor
-- Çözüm: ALL yerine ayrı operation'lar, SELECT birleştir
-- ============================================================
DROP POLICY IF EXISTS "listing_images_manage_owner_or_admin" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_select_visible" ON public.listing_images;

-- SELECT: herkese açık (public listing images)
CREATE POLICY "listing_images_select" ON public.listing_images
  FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE: sadece sahip veya admin
CREATE POLICY "listing_images_insert" ON public.listing_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id
        AND (
          seller_id = (SELECT auth.uid())
          OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  );

CREATE POLICY "listing_images_update" ON public.listing_images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id
        AND (
          seller_id = (SELECT auth.uid())
          OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  );

CREATE POLICY "listing_images_delete" ON public.listing_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id
        AND (
          seller_id = (SELECT auth.uid())
          OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  );

-- ============================================================
-- 5. roles — auth.jwt() wrap et
-- ============================================================
DROP POLICY IF EXISTS "Admins can do anything with roles" ON public.roles;
CREATE POLICY "Admins can do anything with roles" ON public.roles
  FOR ALL USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- Doğrulama
-- ============================================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('notifications', 'platform_settings', 'tickets', 'listing_images', 'roles')
ORDER BY tablename, cmd, policyname;
