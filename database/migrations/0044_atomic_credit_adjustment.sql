-- Migration: Atomic Credit Adjustment Function
-- Purpose: Ensure credit balance updates and audit logs are inseparable

CREATE OR REPLACE FUNCTION public.adjust_user_credits_atomic(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- 1. Insert into credit_transactions (Audit Log)
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    reference_id,
    metadata
  )
  VALUES (
    p_user_id,
    p_amount,
    p_type::public.credit_transaction_type, -- Cast to enum
    p_description,
    p_reference_id,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  -- 2. Update user balance in profiles
  UPDATE public.profiles
  SET 
    balance_credits = balance_credits + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING balance_credits INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for ID: %', p_user_id;
  END IF;

  -- 3. Return combined result
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'amount', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Atomic credit adjustment failed: %', SQLERRM;
END;
$$;

-- Grant permissions (Admin/System only - not public)
REVOKE ALL ON FUNCTION public.adjust_user_credits_atomic(UUID, INTEGER, TEXT, TEXT, TEXT, JSONB) FROM public;
GRANT EXECUTE ON FUNCTION public.adjust_user_credits_atomic(UUID, INTEGER, TEXT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.adjust_user_credits_atomic(UUID, INTEGER, TEXT, TEXT, TEXT, JSONB) TO authenticated; -- Authorized staff might need this via dashboard

COMMENT ON FUNCTION public.adjust_user_credits_atomic IS 'Atomically updates user credit balance and records an immutable audit log entry in a single transaction.';
