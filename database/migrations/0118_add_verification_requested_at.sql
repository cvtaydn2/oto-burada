-- Migration: Add verification_requested_at column to profiles
-- Description: Adds timestamp for when business verification was requested
-- Date: 2026-04-29

-- Add verification_requested_at column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMPTZ;

-- Add index for verification queries
CREATE INDEX IF NOT EXISTS idx_profiles_verification_requested_at 
ON profiles(verification_requested_at) 
WHERE verification_requested_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.verification_requested_at IS 'Timestamp when business verification was requested';
