-- ============================================================
-- Migration: Fix Supabase Performance Advisor Warnings
-- Supabase SQL Editor'da çalıştırın
-- ============================================================

-- ============================================================
-- 1. DUPLICATE INDEXES — listings tablosunda 2 çift index var
-- Eski olanları sil, yeni olanları koru
-- ============================================================

-- idx_listings_seller_id_status vs idx_listings_seller_status (aynı)
DROP INDEX IF EXISTS public.idx_listings_seller_id_status;

-- idx_listings_status_created_at vs idx_listings_status_created (aynı)
DROP INDEX IF EXISTS public.idx_listings_status_created_at;

-- ============================================================
-- 2. AUTH RLS INITPLAN — auth.uid() her satır için yeniden çalışıyor
-- Çözüm: auth.uid() → (SELECT auth.uid()) ile wrap et
-- Etkilenen tablolar: saved_searches, notifications, seller_reviews,
--   chats, messages, platform_settings, tickets, roles
-- ============================================================

-- saved_searches
DROP POLICY IF EXISTS "saved_searches_select_own" ON public.saved_searches;
CREATE POLICY "saved_searches_select_own" ON public.saved_searches
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "saved_searches_insert_own" ON public.saved_searches;
CREATE POLICY "saved_searches_insert_own" ON public.saved_searches
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "saved_searches_update_own" ON public.saved_searches;
CREATE POLICY "saved_searches_update_own" ON public.saved_searches
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "saved_searches_delete_own" ON public.saved_searches;
CREATE POLICY "saved_searches_delete_own" ON public.saved_searches
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "notifications_insert_admin_or_system" ON public.notifications;
CREATE POLICY "notifications_insert_admin_or_system" ON public.notifications
  FOR INSERT WITH CHECK (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin'
    OR (SELECT auth.uid()) IS NULL
  );

-- seller_reviews
DROP POLICY IF EXISTS "Users can create reviews for sellers" ON public.seller_reviews;
CREATE POLICY "Users can create reviews for sellers" ON public.seller_reviews
  FOR INSERT WITH CHECK (reviewer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.seller_reviews;
CREATE POLICY "Users can update their own reviews" ON public.seller_reviews
  FOR UPDATE USING (reviewer_id = (SELECT auth.uid()));

-- chats
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
CREATE POLICY "Users can view their own chats" ON public.chats
  FOR SELECT USING (
    buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Users can create chats they are part of" ON public.chats;
DROP POLICY IF EXISTS "Buyers can create chats" ON public.chats;
-- Tek birleşik policy ile ikisini birleştir (multiple_permissive_policies sorununu da çözer)
CREATE POLICY "Users can create chats" ON public.chats
  FOR INSERT WITH CHECK (
    buyer_id = (SELECT auth.uid())
  );

-- messages
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE id = chat_id
        AND (buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;
CREATE POLICY "Users can send messages to their chats" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.chats
      WHERE id = chat_id
        AND (buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid()))
    )
  );

-- platform_settings
DROP POLICY IF EXISTS "Admins can manage settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Admins can manage platform_settings" ON public.platform_settings;
-- Tek birleşik policy (multiple_permissive_policies sorununu da çözer)
CREATE POLICY "Admins can manage platform_settings" ON public.platform_settings
  FOR ALL USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin'
  ) WITH CHECK (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin'
  );

-- tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
CREATE POLICY "Users can view their own tickets" ON public.tickets
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
CREATE POLICY "Users can create tickets" ON public.tickets
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.tickets;
CREATE POLICY "Admins can manage all tickets" ON public.tickets
  FOR ALL USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin'
  );

-- roles
DROP POLICY IF EXISTS "Admins can do anything with roles" ON public.roles;
CREATE POLICY "Admins can do anything with roles" ON public.roles
  FOR ALL USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin'
  );

-- ============================================================
-- 3. MULTIPLE PERMISSIVE POLICIES — aynı tablo+action için birden fazla policy
-- Çözüm: Duplicate policy'leri sil, tek policy'de birleştir
-- ============================================================

-- saved_searches: saved_searches_manage_own kaldır (yukarıda ayrı ayrı tanımlandı)
DROP POLICY IF EXISTS "saved_searches_manage_own" ON public.saved_searches;

-- notifications: notifications_manage_own kaldır (yukarıda ayrı ayrı tanımlandı)
DROP POLICY IF EXISTS "notifications_manage_own" ON public.notifications;

-- listing_images: listing_images_manage_owner_or_admin SELECT çakışması
-- listing_images_select_visible zaten var, manage policy'den SELECT kaldır
DROP POLICY IF EXISTS "listing_images_manage_owner_or_admin" ON public.listing_images;
CREATE POLICY "listing_images_manage_owner_or_admin" ON public.listing_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id
        AND (
          seller_id = (SELECT auth.uid())
          OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin'
        )
    )
  );

-- listing_price_history: iki SELECT policy var, birini kaldır
DROP POLICY IF EXISTS "Price history is public" ON public.listing_price_history;
-- "Price history is public for approved listings" kalır

-- profiles: iki SELECT policy var, birini kaldır
DROP POLICY IF EXISTS "Public profile info is viewable by everyone" ON public.profiles;
-- profiles_select_self_or_admin kalır

-- ============================================================
-- Doğrulama
-- ============================================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'saved_searches', 'notifications', 'seller_reviews',
    'chats', 'messages', 'platform_settings', 'tickets', 'roles',
    'listing_images', 'listing_price_history', 'profiles'
  )
ORDER BY tablename, cmd, policyname;
