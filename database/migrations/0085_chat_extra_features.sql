-- =============================================================================
-- Migration 0085: Add message deletion and chat archiving support
-- =============================================================================

-- 1. Support for soft-deleting messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Support for archiving chats (per user)
ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS buyer_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS seller_archived boolean DEFAULT false;

-- 3. Update RLS for messages to hide deleted ones by default
-- Note: Existing policies might need update if they use SELECT *
-- For now, we'll keep it simple and filter in the API layer, 
-- but a view or policy change is better for "Clean Code".

-- 4. Function to toggle archive status
CREATE OR REPLACE FUNCTION public.toggle_chat_archive(
  p_chat_id uuid,
  p_user_id uuid,
  p_archive boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chats
  SET buyer_archived = CASE WHEN buyer_id = p_user_id THEN p_archive ELSE buyer_archived END,
      seller_archived = CASE WHEN seller_id = p_user_id THEN p_archive ELSE seller_archived END
  WHERE id = p_chat_id 
    AND (buyer_id = p_user_id OR seller_id = p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_chat_archive(uuid, uuid, boolean) TO authenticated;
