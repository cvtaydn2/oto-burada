-- Fix: chats table missing INSERT RLS policy
-- Without this, any authenticated user could create a chat between any two users.
--
-- Rules:
-- 1. Only the buyer can create a chat (buyer_id must match auth.uid())
-- 2. Buyer cannot be the seller (enforced by DB constraint chats_distinct_participants)
-- 3. The listing must be approved (prevent chats on archived listings)

-- Chat select: participants only
DROP POLICY IF EXISTS "chats_select_participants" ON public.chats;
CREATE POLICY "chats_select_participants"
  ON public.chats
  FOR SELECT
  USING (
    (SELECT auth.uid()) = buyer_id
    OR (SELECT auth.uid()) = seller_id
    OR (SELECT public.is_admin())
  );

-- Chat insert: buyer must initiate, listing must be approved
DROP POLICY IF EXISTS "chats_insert_buyer_only" ON public.chats;
CREATE POLICY "chats_insert_buyer_only"
  ON public.chats
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = buyer_id
    AND EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = chats.listing_id
        AND listings.status = 'approved'
        AND listings.seller_id = chats.seller_id
    )
  );

-- Messages select: chat participants only
DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
CREATE POLICY "messages_select_participants"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
        AND (
          (SELECT auth.uid()) = chats.buyer_id
          OR (SELECT auth.uid()) = chats.seller_id
        )
    )
  );

-- Messages insert: sender must be a chat participant
DROP POLICY IF EXISTS "messages_insert_participant" ON public.messages;
CREATE POLICY "messages_insert_participant"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
        AND (
          (SELECT auth.uid()) = chats.buyer_id
          OR (SELECT auth.uid()) = chats.seller_id
        )
    )
  );
