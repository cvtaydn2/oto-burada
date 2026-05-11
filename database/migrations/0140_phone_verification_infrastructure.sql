-- Add Phone Verification Architecture
-- Phase: Product Enhancement & Scale (Task F1)

BEGIN;

-- 1. Extend Profiles for Phone Validation States
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "is_phone_verified" boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS "phone_verified_at" timestamp with time zone;

-- 2. Create Phone Verification Audit/Session Registry
CREATE TABLE IF NOT EXISTS "public"."phone_verifications" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "phone" text NOT NULL,
    "code" varchar(6) NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "attempts" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add indices for performance and lifecycle pruning
CREATE INDEX IF NOT EXISTS "phone_verifications_user_id_idx" ON "public"."phone_verifications" ("user_id");
CREATE INDEX IF NOT EXISTS "phone_verifications_expires_at_idx" ON "public"."phone_verifications" ("expires_at");

-- 3. Auto-update timestamps trigger
CREATE TRIGGER "set_phone_verifications_timestamp"
    BEFORE UPDATE ON "public"."phone_verifications"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- 4. Enable Security (Strict Mode: Accessible only via Service Role Actions)
ALTER TABLE "public"."phone_verifications" ENABLE ROW LEVEL SECURITY;

-- Explicitly restrict ALL direct browser/authenticated-user access (no policies defined = deny all by default for non-admin keys)
COMMENT ON TABLE "public"."phone_verifications" IS 'Ephemeral table tracking one-time passcodes for telephony challenges. Should NOT have SELECT policies for public/authenticated roles.';

COMMIT;
