-- Remove EIDS and Identity Verification from schema
-- This migration removes all fields related to E-Devlet (EİDS) and identity verification placeholder systems.

-- 1. Drop EİDS specific fields from listings
ALTER TABLE public.listings DROP COLUMN IF EXISTS eids_verification_json;

-- 2. Drop EİDS and TC verification fields from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS eids_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS tc_verified_at;

-- 3. Remove EİDS audit logs table
DROP TABLE IF EXISTS public.eids_audit_logs;

-- 4. Clean up report_reason enum
-- Note: Postgres doesn't easily support dropping enum values. 
-- We rename 'invalid_eids' to 'misleading_info' or similar to repurpose it if needed.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum 
        JOIN pg_type ON pg_type.oid = pg_enum.enumtypid 
        WHERE typname = 'report_reason' AND enumlabel = 'invalid_eids'
    ) THEN
        ALTER TYPE public.report_reason RENAME VALUE 'invalid_eids' TO 'invalid_verification';
    END IF;
END $$;

-- 5. Documentation of change in schema.snapshot.sql will be done separately.
