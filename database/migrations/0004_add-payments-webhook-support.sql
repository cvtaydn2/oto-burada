-- Migration: add-payments-webhook-support.sql
-- Applied: 2026-04-17
-- Purpose:
--   1. Add iyzico_token + iyzico_payment_id columns to payments table
--      (needed for idempotent webhook processing)
--   2. Add plan_id + plan_name columns to payments table
--      (getPlanPurchases queries these — currently silently returns [] on 42703)
--   3. Add updated_at column to payments table
--   4. Add increment_user_credits() RPC for atomic credit top-up
--   5. Seed default pricing plans if table is empty
--
-- Rollback:
--   ALTER TABLE public.payments DROP COLUMN IF EXISTS iyzico_token;
--   ALTER TABLE public.payments DROP COLUMN IF EXISTS iyzico_payment_id;
--   ALTER TABLE public.payments DROP COLUMN IF EXISTS plan_id;
--   ALTER TABLE public.payments DROP COLUMN IF EXISTS plan_name;
--   ALTER TABLE public.payments DROP COLUMN IF EXISTS updated_at;
--   DROP FUNCTION IF EXISTS public.increment_user_credits(uuid, integer);
--   DROP INDEX IF EXISTS payments_iyzico_token_idx;

-- ── 1. Payments table columns ────────────────────────────────────────────────

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS iyzico_token text,
  ADD COLUMN IF NOT EXISTS iyzico_payment_id text,
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.pricing_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan_name text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

-- Unique index on iyzico_token for idempotency check (partial — only non-null)
CREATE UNIQUE INDEX IF NOT EXISTS payments_iyzico_token_idx
  ON public.payments (iyzico_token)
  WHERE iyzico_token IS NOT NULL;

-- Index for plan purchase history queries
CREATE INDEX IF NOT EXISTS payments_plan_id_idx
  ON public.payments (plan_id)
  WHERE plan_id IS NOT NULL;

-- Index for user payment history
CREATE INDEX IF NOT EXISTS payments_user_id_created_at_idx
  ON public.payments (user_id, created_at DESC);

-- ── 2. increment_user_credits RPC ────────────────────────────────────────────
-- Atomic credit top-up — safe to call from webhook handler.
-- Uses UPDATE with RETURNING to avoid race conditions.

DROP FUNCTION IF EXISTS public.increment_user_credits(uuid, integer);
CREATE OR REPLACE FUNCTION public.increment_user_credits(
  p_user_id uuid,
  p_credits integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  UPDATE public.profiles
  SET balance_credits = balance_credits + p_credits,
      updated_at = timezone('utc', now())
  WHERE id = p_user_id
  RETURNING balance_credits INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  RETURN v_new_balance;
END;
$$;

-- ── 3. Seed default pricing plans ────────────────────────────────────────────
-- Only inserts if the table is empty — idempotent.

INSERT INTO public.pricing_plans (name, price, credits, features, is_active)
SELECT * FROM (VALUES
  (
    'Başlangıç',
    0::decimal,
    3,
    '{"ilan_sayisi": 3, "vitrin": false, "acil_satilik": false, "one_cikan": false, "destek": "standart"}'::jsonb,
    true
  ),
  (
    'Standart',
    299::decimal,
    10,
    '{"ilan_sayisi": 10, "vitrin": true, "acil_satilik": false, "one_cikan": false, "destek": "standart", "vitrin_gun": 7}'::jsonb,
    true
  ),
  (
    'Profesyonel',
    599::decimal,
    25,
    '{"ilan_sayisi": 25, "vitrin": true, "acil_satilik": true, "one_cikan": true, "destek": "oncelikli", "vitrin_gun": 15, "one_cikan_gun": 15}'::jsonb,
    true
  ),
  (
    'Kurumsal',
    1499::decimal,
    100,
    '{"ilan_sayisi": 100, "vitrin": true, "acil_satilik": true, "one_cikan": true, "destek": "ozel", "vitrin_gun": 30, "one_cikan_gun": 30, "api_erisimi": true}'::jsonb,
    true
  )
) AS v(name, price, credits, features, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_plans LIMIT 1);
