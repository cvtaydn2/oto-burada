-- ── SECURITY FIX: Issue CHAT-01 - Database-Level Rate Limiting ──────────────
-- Previous application-level rate limiting had race condition vulnerability.
-- This trigger enforces rate limit atomically at database level.

CREATE OR REPLACE FUNCTION check_message_rate_limit()
RETURNS TRIGGER AS $$
DECLARE 
  v_count int;
  v_one_hour_ago timestamptz;
BEGIN
  v_one_hour_ago := NOW() - INTERVAL '1 hour';
  
  SELECT COUNT(*) INTO v_count 
  FROM messages
  WHERE sender_id = NEW.sender_id 
    AND chat_id = NEW.chat_id
    AND created_at > v_one_hour_ago
    AND deleted_at IS NULL;
  
  IF v_count >= 100 THEN
    RAISE EXCEPTION 'rate_limit_exceeded: Maximum 100 messages per hour per chat';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS enforce_message_rate_limit ON messages;

-- Create trigger
CREATE TRIGGER enforce_message_rate_limit
  BEFORE INSERT ON messages
  FOR EACH ROW 
  EXECUTE FUNCTION check_message_rate_limit();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_message_rate_limit() TO authenticated;
