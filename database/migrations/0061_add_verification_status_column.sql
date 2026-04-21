-- Migration: 0061_add_verification_status_column
-- Description: Add missing verification_status column to profiles table
-- Date: 2026-04-21

-- Add the verification_status column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status public.verification_status NOT NULL DEFAULT 'none';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles (verification_status) 
WHERE verification_status IN ('pending', 'approved');