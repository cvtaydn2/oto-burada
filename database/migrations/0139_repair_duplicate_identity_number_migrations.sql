-- Repair Migration: Normalize duplicate identity_number migrations (0063/0064)
-- Goal: Keep a single consistent state for public.profiles.identity_number without
-- rewriting historical migrations. Safe for already-migrated environments.

-- 1) Ensure column exists (idempotent)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS identity_number text;

-- 2) Normalize column comment to a single canonical value
COMMENT ON COLUMN public.profiles.identity_number IS
  'TC Kimlik Numarası (KVKK - Hassas Kişisel Veri). Şifrelenmiş saklanmalı.';

-- 3) Clean up duplicate/legacy index artifacts from earlier duplicate migrations
-- Note: index is not part of final intended state (dropped in later hardening migration).
DROP INDEX IF EXISTS public.idx_profiles_identity_number;
DROP INDEX IF EXISTS public.profiles_identity_number_idx;

-- 4) Clean up possible legacy constraint name artifacts (if any)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_identity_number_key;
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS uq_profiles_identity_number;

-- 5) Normalize RLS policies to one explicit, consistent definition
DROP POLICY IF EXISTS "Users can view own identity_number" ON public.profiles;
CREATE POLICY "Users can view own identity_number"
ON public.profiles
FOR SELECT
USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own identity_number" ON public.profiles;
CREATE POLICY "Users can update own identity_number"
ON public.profiles
FOR UPDATE
USING ((SELECT auth.uid()) = id);
