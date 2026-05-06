-- Migration: Add CHECK constraint on tramer_amount to prevent negative values
-- Date: 2026-05-07

-- Prevent negative tramer amounts to ensure financial data integrity
ALTER TABLE public.listings 
  ADD CONSTRAINT listings_tramer_amount_check 
  CHECK (tramer_amount >= 0);

COMMENT ON CONSTRAINT listings_tramer_amount_check ON public.listings IS 
'Enforces that tramer_amount cannot be negative';
