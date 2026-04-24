-- Migration: Add identity_number to profiles for Iyzico compliance
-- KVKK Compliance: Identity numbers are sensitive personal data

-- Add identity_number column (nullable for gradual rollout)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS identity_number text;

COMMENT ON COLUMN public.profiles.identity_number IS 'TC Kimlik Numarası (KVKK - Hassas Kişisel Veri). Şifrelenmiş saklanmalı.';

-- Add index for lookups (if needed for verification)
CREATE INDEX IF NOT EXISTS idx_profiles_identity_number ON public.profiles(identity_number) WHERE identity_number IS NOT NULL;

-- RLS Policy: Users can only see their own identity number
CREATE POLICY "Users can view own identity_number"
ON public.profiles
FOR SELECT
USING ((SELECT auth.uid()) = id);

-- RLS Policy: Users can update their own identity number
CREATE POLICY "Users can update own identity_number"
ON public.profiles
FOR UPDATE
USING ((SELECT auth.uid()) = id);

-- Note: In production, consider using pgcrypto for encryption:
-- identity_number_encrypted bytea
-- Then use pgp_sym_encrypt/pgp_sym_decrypt with a secure key
