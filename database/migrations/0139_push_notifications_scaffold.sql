-- Add Push Subscriptions and Normalize Jobs 
-- Phase: Product Enhancement & Scale (Task E3)

BEGIN;

-- 1. Relax constraint on fulfillment_jobs allowing non-payment related background tasks
ALTER TABLE "public"."fulfillment_jobs" 
ALTER COLUMN "payment_id" DROP NOT NULL;

-- 2. Create Push Subscription Registry
CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "endpoint" text NOT NULL,
    "auth_token" text NOT NULL, -- Standard 'auth' in PushSubscription JSON
    "p256dh" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Prevent duplicate endpoints for same user
    UNIQUE("user_id", "endpoint")
);

-- Add indexing on hot access paths
CREATE INDEX IF NOT EXISTS "push_subscriptions_user_id_idx" ON "public"."push_subscriptions" ("user_id");

-- 3. Auto-update timestamps trigger
CREATE TRIGGER "set_push_subscriptions_timestamp"
    BEFORE UPDATE ON "public"."push_subscriptions"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- 4. Enable Security and RLS policies
ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push subscriptions." 
    ON "public"."push_subscriptions" 
    FOR SELECT USING ((SELECT auth.uid()) = "user_id");

CREATE POLICY "Users can insert their own push subscriptions." 
    ON "public"."push_subscriptions" 
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "Users can update their own push subscriptions." 
    ON "public"."push_subscriptions" 
    FOR UPDATE USING ((SELECT auth.uid()) = "user_id") WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "Users can delete their own push subscriptions." 
    ON "public"."push_subscriptions" 
    FOR DELETE USING ((SELECT auth.uid()) = "user_id");

COMMIT;
