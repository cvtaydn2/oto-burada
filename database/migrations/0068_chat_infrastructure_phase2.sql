-- Phase 2: Chat Infrastructure Enhancement
-- Ensures chat tables are properly configured with RLS and Realtime support

-- Update chats table: add status if not exists, ensure last_message_at exists
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());

-- Update messages table: add message_type support
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text';

-- Create check constraints
ALTER TABLE public.chats ADD CONSTRAINT chats_status_check CHECK (status IN ('active', 'archived'));
ALTER TABLE public.messages ADD CONSTRAINT messages_type_check CHECK (message_type IN ('text', 'image', 'system', 'file'));

-- Ensure RLS policies exist
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "chat_participants_select" ON public.chats;
CREATE POLICY "chat_participants_select" ON public.chats
  FOR SELECT USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id OR is_admin()
  );

DROP POLICY IF EXISTS "chat_buyer_insert" ON public.chats;
CREATE POLICY "chat_buyer_insert" ON public.chats
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id AND buyer_id != seller_id
  );

DROP POLICY IF EXISTS "chat_participants_update" ON public.chats;
CREATE POLICY "chat_participants_update" ON public.chats
  FOR UPDATE USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id OR is_admin()
  );

-- Messages policies
DROP POLICY IF EXISTS "message_participants_select" ON public.messages;
CREATE POLICY "message_participants_select" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
        AND (auth.uid() = chats.buyer_id OR auth.uid() = chats.seller_id)
    )
  );

DROP POLICY IF EXISTS "message_participant_insert" ON public.messages;
CREATE POLICY "message_participant_insert" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
        AND auth.uid() = messages.sender_id
        AND (auth.uid() = chats.buyer_id OR auth.uid() = chats.seller_id)
    )
  );

-- Ensure Realtime publication includes messages table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Already in publication
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON public.chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_seller_id ON public.chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_chats_status ON public.chats(status);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

-- Trigger: update last_message_at on new message
CREATE OR REPLACE FUNCTION public.update_chat_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chats
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

-- Drop old trigger if exists and recreate
DROP TRIGGER IF EXISTS messages_touch_chat_last_message_at ON public.messages;
CREATE TRIGGER messages_touch_chat_last_message_at
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_last_message_at();

COMMENT ON TABLE public.chats IS 'Chat conversations between buyers and sellers';
COMMENT ON TABLE public.messages IS 'Messages within chat conversations';
COMMENT ON FUNCTION public.update_chat_last_message_at() IS 'Automatically update chat last_message_at timestamp when new message arrives';
