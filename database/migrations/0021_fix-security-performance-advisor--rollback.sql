-- ============================================================
-- OtoBurada — Security & Performance Advisor Fix — ROLLBACK
-- Generated: 2026-04-17
-- ============================================================
-- Run this ONLY if you need to revert fix-security-performance-advisor.sql
-- WARNING: Rolling back restores less secure configurations.
-- Only use in emergency situations.
-- ============================================================

-- ── Rollback Section 1: Functions (remove SECURITY DEFINER + search_path) ──

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_chat_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.chats
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

-- ── Rollback Section 2: Restore original tickets policies ──

DROP POLICY IF EXISTS "tickets_select_own_or_admin" ON public.tickets;
CREATE POLICY "Users can view their own tickets"
  ON public.tickets FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "tickets_insert_own" ON public.tickets;
CREATE POLICY "Authenticated users can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tickets_update_own_open_or_admin" ON public.tickets;
CREATE POLICY "Users can update their own open tickets"
  ON public.tickets FOR UPDATE
  USING (auth.uid() = user_id AND status = 'open')
  WITH CHECK (auth.uid() = user_id AND status = 'open');

CREATE POLICY "Admins can update any ticket"
  ON public.tickets FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── Rollback Section 3: Restore chats original INSERT policy ──

DROP POLICY IF EXISTS "chats_insert_buyer_only" ON public.chats;
CREATE POLICY "chats_insert_participants"
  ON public.chats FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = buyer_id
    OR (SELECT auth.uid()) = seller_id
  );

-- ── Rollback Section 4: Restore phone_reveal_logs broad INSERT ──

DROP POLICY IF EXISTS "phone_reveal_logs_insert_approved_listing" ON public.phone_reveal_logs;
CREATE POLICY "phone_reveal_logs_insert_anyone"
  ON public.phone_reveal_logs FOR INSERT
  WITH CHECK (true);

-- ── Rollback Section 5: Restore listing_views broad INSERT ──

DROP POLICY IF EXISTS "listing_views_insert_anyone" ON public.listing_views;
CREATE POLICY "listing_views_insert_anyone"
  ON public.listing_views FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- END ROLLBACK
-- ============================================================
