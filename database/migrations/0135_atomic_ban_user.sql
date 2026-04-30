-- ── SECURITY FIX: Issue ADMIN-02 - Atomic User Ban with Listing Rejection ──
-- Previous implementation had two separate operations that could fail independently.
-- This RPC ensures atomicity and preserves trust guard metadata.

CREATE OR REPLACE FUNCTION ban_user_atomic(
  p_user_id uuid,
  p_reason text,
  p_preserve_metadata boolean DEFAULT true
)
RETURNS jsonb AS $$
DECLARE
  v_current_ban_reason text;
  v_final_ban_reason text;
  v_listings_rejected int;
BEGIN
  -- Get current ban reason to preserve trust guard metadata if requested
  IF p_preserve_metadata THEN
    SELECT ban_reason INTO v_current_ban_reason
    FROM profiles
    WHERE id = p_user_id;
    
    -- If current ban_reason contains trust guard metadata, append new reason
    IF v_current_ban_reason IS NOT NULL AND v_current_ban_reason LIKE '%[AUTO_TRUST_GUARD]%' THEN
      v_final_ban_reason := v_current_ban_reason || E'\n' || p_reason;
    ELSE
      v_final_ban_reason := p_reason;
    END IF;
  ELSE
    v_final_ban_reason := p_reason;
  END IF;

  -- Update profile
  UPDATE profiles 
  SET 
    is_banned = true,
    ban_reason = v_final_ban_reason,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Reject all active listings atomically
  WITH rejected AS (
    UPDATE listings 
    SET status = 'rejected'
    WHERE seller_id = p_user_id 
      AND status NOT IN ('rejected', 'archived')
    RETURNING id
  )
  SELECT COUNT(*) INTO v_listings_rejected FROM rejected;

  RETURN jsonb_build_object(
    'success', true,
    'listings_rejected', v_listings_rejected
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION ban_user_atomic(uuid, text, boolean) TO authenticated;
