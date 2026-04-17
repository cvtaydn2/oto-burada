-- Migration: 0028_billing_audit_hardening.sql
-- Purpose: Hardening billing tracking by adding transaction logs and application history.

-- 1. Extend payments for better listing context
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL;

-- 2. Credit Transaction Log
-- Tracks every change to user balances (purchase, spend, etc.)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- positive for credit, negative for debit
  transaction_type text NOT NULL, -- 'purchase', 'doping_spend', 'admin_adjustment', 'refund'
  description text,
  reference_id uuid, -- payment_id, listing_id, etc.
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for history
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference ON public.credit_transactions(reference_id) WHERE reference_id IS NOT NULL;

-- 3. Doping Application Log
-- Specifically tracks when a doping is 'active' on a listing
CREATE TABLE IF NOT EXISTS public.doping_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doping_type text NOT NULL, -- 'featured', 'urgent', 'highlighted'
  duration_days integer NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for expiration tracking
CREATE INDEX IF NOT EXISTS idx_doping_applications_expiry ON public.doping_applications(expires_at, listing_id);
CREATE INDEX IF NOT EXISTS idx_doping_applications_listing ON public.doping_applications(listing_id);

-- 4. RLS POLICIES
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doping_applications ENABLE ROW LEVEL SECURITY;

-- Users can see their own logs
CREATE POLICY "credit_transactions_select_own" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "doping_applications_select_own" ON public.doping_applications FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Only service/admin can insert (enforced via DB functions or admin client in code)
-- But for MVP we allow authenticated insert IF they match their own user_id? 
-- No, transactions should be server-side only. 

-- 5. Trigger to update updated_at if we ever update these (usually immutable logs but good practice)
-- (Omitted since logs are usually immutable)

-- 6. Add updated_at to payments if missing (0004 had it but let's be sure)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
