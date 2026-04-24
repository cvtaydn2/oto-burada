-- =============================================================================
-- Migration 0086: Atomic Chat Operations and Soft-Delete Refinement
-- =============================================================================

-- 1. Improved soft-delete message function
-- This ensures that when a message is deleted, we might optionally update 
-- the chat's last_message_at if needed (though we currently keep it for history).
CREATE OR REPLACE FUNCTION public.soft_delete_message(
  p_message_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.messages
  SET deleted_at = timezone('utc', now())
  WHERE id = p_message_id 
    AND sender_id = p_user_id;
    
  RETURN FOUND;
END;
$$;

-- 2. Atomic chat creation with first message
-- Prevents "ghost chats" where a chat is created but the system message fails.
CREATE OR REPLACE FUNCTION public.create_chat_atomic(
  p_listing_id uuid,
  p_buyer_id uuid,
  p_seller_id uuid,
  p_system_message text DEFAULT 'Chat başlatıldı.'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chat_id uuid;
BEGIN
  -- Check if already exists
  SELECT id INTO v_chat_id
  FROM public.chats
  WHERE listing_id = p_listing_id
    AND buyer_id = p_buyer_id
    AND seller_id = p_seller_id;
    
  IF v_chat_id IS NOT NULL THEN
    RETURN v_chat_id;
  END IF;

  -- Create chat
  INSERT INTO public.chats (listing_id, buyer_id, seller_id, status)
  VALUES (p_listing_id, p_buyer_id, p_seller_id, 'active')
  RETURNING id INTO v_chat_id;

  -- Create initial message
  INSERT INTO public.messages (chat_id, sender_id, content, message_type, is_read)
  VALUES (v_chat_id, p_buyer_id, p_system_message, 'system', true);

  RETURN v_chat_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_message(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_chat_atomic(uuid, uuid, uuid, text) TO authenticated;
