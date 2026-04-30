-- Migration: 0024_fix_critical_payment_issues.sql
-- Description: 
-- 1. Fixes K-3: Adds unique constraint on idempotency_key for payments.
-- 2. Fixes K-5: Converts amount/price columns from decimal to bigint (storing cents/kuruş).
-- 3. Fixes K-1: Expands RLS policies for payments to allow users to INSERT and UPDATE their own records.

-- 1. Idempotency Constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency_key ON public.payments (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 2. Floating Point Precision Fix
-- We use BIGINT to store cents/kuruş. 100.00 -> 10000
ALTER TABLE public.payments ALTER COLUMN amount TYPE bigint USING (amount * 100)::bigint;
ALTER TABLE public.pricing_plans ALTER COLUMN price TYPE bigint USING (price * 100)::bigint;
ALTER TABLE public.market_stats ALTER COLUMN avg_price TYPE bigint USING (avg_price * 100)::bigint;

-- 3. RLS Expansion for Payments
-- Allow users to create their own payment records
CREATE POLICY "payments_insert_own" ON public.payments 
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- Allow users to update their own pending payment records (e.g. for token update)
CREATE POLICY "payments_update_own" ON public.payments 
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4. Full-text Search Index Verification
-- Even though it was found in snapshot, we ensure it exists for production safety.
CREATE INDEX IF NOT EXISTS listings_search_vector_idx ON public.listings USING GIN (search_vector);
