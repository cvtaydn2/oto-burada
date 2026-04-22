-- Migration: Add identity_number to profiles
-- Purpose: Required for legal billing and Iyzico payments.
-- Date: 2026-04-22

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS identity_number TEXT;

-- Index for lookup (optional but good for future verification)
CREATE INDEX IF NOT EXISTS idx_profiles_identity_number ON public.profiles(identity_number) WHERE identity_number IS NOT NULL;

-- Comments for transparency
COMMENT ON COLUMN public.profiles.identity_number IS 'Turkish Identity Number (TC No) for billing and legal compliance.';
