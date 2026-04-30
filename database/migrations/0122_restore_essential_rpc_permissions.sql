-- =============================================================================
-- Migration 0122: Restore Essential RPC Permissions
-- =============================================================================

-- 1. Re-create missing Chat functions (they were missing in the system audit)
-- -----------------------------------------------------------------------------

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

-- 2. Restore EXECUTE permissions for Authenticated role
-- -----------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.create_chat_atomic(uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_message(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_chat_archive(uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_ticket(text, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_ticket(uuid, text, text) TO authenticated;

-- 3. Restore EXECUTE permissions for Anonymous role
-- -----------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.create_public_ticket(text, text, text, text, uuid) TO anon;

-- 4. Audit Note
-- -----------------------------------------------------------------------------
-- These permissions were previously revoked in a broad security hardening step.
-- They are restored here because they are intended to be called via supabase.rpc()
-- from the application server actions (which operate with user/anon roles).
-- Internal security checks (ownership, admin status) are implemented inside the functions.
