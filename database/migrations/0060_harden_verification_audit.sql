-- harden business verification audit
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_reviewed_by uuid REFERENCES public.profiles(id);

-- ensure status is synchronized with legacy flag for existing records
UPDATE public.profiles 
SET verification_status = 'approved' 
WHERE verified_business = true AND verification_status = 'none';

-- performance index for reviewed_by lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification_reviewer ON public.profiles (verification_reviewed_by) 
WHERE verification_reviewed_by IS NOT NULL;
