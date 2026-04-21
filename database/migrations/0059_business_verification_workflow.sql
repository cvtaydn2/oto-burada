-- business verification workflow
-- adds state support for business/gallery verification

-- 1. Create verification status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE public.verification_status AS ENUM ('none', 'pending', 'approved', 'rejected');
    END IF;
END $$;

-- 2. Add columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status public.verification_status NOT NULL DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_requested_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_feedback text;

-- 3. Create index for admin dashboard performance
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles (verification_status) 
WHERE verification_status IN ('pending', 'approved');

-- 4. Initial sync: existing verified businesses should be 'approved'
UPDATE public.profiles 
SET verification_status = 'approved' 
WHERE verified_business = true 
  AND verification_status = 'none';
