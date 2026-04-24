-- Migration: Add package_id column to payments table for doping package tracking
-- This improves security by having a dedicated column instead of relying on metadata

-- Add package_id column to track doping packages separately from pricing plans
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS package_id text;

COMMENT ON COLUMN public.payments.package_id IS 'Doping paket ID (bump, featured, premium vb.)';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_package_id ON public.payments(package_id);

-- Update existing records to populate package_id from metadata
UPDATE public.payments
SET package_id = metadata->'basketItems'->0->>'id'
WHERE package_id IS NULL
  AND metadata IS NOT NULL
  AND metadata->'basketItems' IS NOT NULL
  AND jsonb_array_length(metadata->'basketItems') > 0;
