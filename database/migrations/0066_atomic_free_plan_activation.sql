-- Atomic free plan activation
-- Prevents double-credit on parallel requests by serializing per user+plan activation.

CREATE OR REPLACE FUNCTION public.activate_free_pricing_plan(
  p_user_id uuid,
  p_plan_id uuid,
  p_plan_name text,
  p_credits integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_activation_count integer;
  v_payment_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_plan_id::text, 0)
  );

  SELECT count(*)
  INTO v_recent_activation_count
  FROM public.payments
  WHERE user_id = p_user_id
    AND plan_id = p_plan_id
    AND provider = 'free'
    AND status = 'success'
    AND created_at >= timezone('utc', now()) - interval '24 hours';

  IF v_recent_activation_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Bu ücretsiz planı son 24 saat içinde zaten aktifleştirdiniz.'
    );
  END IF;

  INSERT INTO public.payments (
    user_id,
    amount,
    currency,
    provider,
    status,
    plan_id,
    plan_name,
    description
  )
  VALUES (
    p_user_id,
    0,
    'TRY',
    'free',
    'success',
    p_plan_id,
    p_plan_name,
    'Ücretsiz plan: ' || p_plan_name
  )
  RETURNING id INTO v_payment_id;

  PERFORM public.adjust_user_credits_atomic(
    p_user_id,
    p_credits,
    'purchase',
    'Ücretsiz plan kredisi: ' || p_plan_name,
    v_payment_id::text,
    jsonb_build_object(
      'provider', 'free',
      'plan_id', p_plan_id,
      'plan_name', p_plan_name
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.activate_free_pricing_plan(uuid, uuid, text, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.activate_free_pricing_plan(uuid, uuid, text, integer) TO service_role;

COMMENT ON FUNCTION public.activate_free_pricing_plan IS
'Atomically activates a free pricing plan, inserts the payment record, and credits the user while preventing parallel double-credit.';
