


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'Hardened public schema with restricted function execution.';



CREATE TYPE "public"."fuel_type" AS ENUM (
    'benzin',
    'dizel',
    'lpg',
    'hibrit',
    'elektrik'
);


ALTER TYPE "public"."fuel_type" OWNER TO "postgres";


CREATE TYPE "public"."listing_status" AS ENUM (
    'draft',
    'pending',
    'approved',
    'rejected',
    'archived'
);


ALTER TYPE "public"."listing_status" OWNER TO "postgres";


CREATE TYPE "public"."moderation_action" AS ENUM (
    'approve',
    'reject',
    'review',
    'resolve',
    'dismiss',
    'archive',
    'edit',
    'ban',
    'unban',
    'promote',
    'demote',
    'delete_user',
    'credit_grant',
    'doping_grant'
);


ALTER TYPE "public"."moderation_action" OWNER TO "postgres";


CREATE TYPE "public"."moderation_target_type" AS ENUM (
    'listing',
    'report',
    'user'
);


ALTER TYPE "public"."moderation_target_type" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'favorite',
    'moderation',
    'report',
    'system',
    'question'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."offer_status" AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'counter_offer',
    'expired',
    'completed'
);


ALTER TYPE "public"."offer_status" OWNER TO "postgres";


CREATE TYPE "public"."report_reason" AS ENUM (
    'fake_listing',
    'wrong_info',
    'spam',
    'other',
    'price_manipulation',
    'invalid_verification'
);


ALTER TYPE "public"."report_reason" OWNER TO "postgres";


CREATE TYPE "public"."report_status" AS ENUM (
    'open',
    'reviewing',
    'resolved',
    'dismissed'
);


ALTER TYPE "public"."report_status" OWNER TO "postgres";


CREATE TYPE "public"."ticket_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."ticket_priority" OWNER TO "postgres";


CREATE TYPE "public"."ticket_status" AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);


ALTER TYPE "public"."ticket_status" OWNER TO "postgres";


CREATE TYPE "public"."transmission_type" AS ENUM (
    'manuel',
    'otomatik',
    'yari_otomatik'
);


ALTER TYPE "public"."transmission_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'user',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."user_type" AS ENUM (
    'individual',
    'professional',
    'staff',
    'corporate'
);


ALTER TYPE "public"."user_type" OWNER TO "postgres";


CREATE TYPE "public"."vehicle_category" AS ENUM (
    'otomobil',
    'suv',
    'minivan',
    'ticari',
    'motosiklet',
    'kiralik',
    'hasarli',
    'klasik',
    'karavan',
    'deniz',
    'hava',
    'atv'
);


ALTER TYPE "public"."vehicle_category" OWNER TO "postgres";


CREATE TYPE "public"."verification_status" AS ENUM (
    'none',
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."verification_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."activate_doping"("p_user_id" "uuid", "p_listing_id" "uuid", "p_package_id" "uuid", "p_payment_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_listing RECORD;
  v_package RECORD;
  v_payment RECORD;
  v_purchase_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- SECURITY: Enforce user ownership if not called by service_role
  IF (SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) <> p_user_id THEN
    RAISE EXCEPTION 'Ownership violation: You can only activate doping for your own account.';
  END IF;

  -- 1. Verify listing ownership
  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id;
  IF NOT FOUND OR v_listing.seller_id <> p_user_id THEN
    RAISE EXCEPTION 'Ownership violation: Listing not found or not owned by user.';
  END IF;

  -- 2. Verify payment status (must be success and belong to user)
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id;
  IF NOT FOUND OR v_payment.user_id <> p_user_id OR v_payment.status <> 'success' THEN
    RAISE EXCEPTION 'Payment violation: Valid successful payment required.';
  END IF;

  -- 3. Get package details
  SELECT * INTO v_package FROM public.doping_packages WHERE id = p_package_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid package.'; END IF;

  -- 4. Create purchase record
  v_expires_at := now() + (v_package.duration_days || ' days')::interval;
  
  INSERT INTO public.doping_purchases (
    user_id, listing_id, package_id, payment_id, status, expires_at
  ) VALUES (
    p_user_id, p_listing_id, p_package_id, p_payment_id, 'active', v_expires_at
  ) RETURNING id INTO v_purchase_id;

  -- 5. Apply effect (simple version, full logic is in apply_listing_doping but this is for direct activation)
  -- This part is usually handled by a job, but here we do basic updates
  IF v_package.type = 'featured' THEN
    UPDATE public.listings SET featured = true, featured_until = v_expires_at WHERE id = p_listing_id;
  ELSIF v_package.type = 'urgent' THEN
    UPDATE public.listings SET urgent_until = v_expires_at WHERE id = p_listing_id;
  ELSIF v_package.type = 'highlighted' THEN
    UPDATE public.listings SET highlighted_until = v_expires_at WHERE id = p_listing_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'purchaseId', v_purchase_id,
    'expiresAt', v_expires_at
  );
END;
$$;


ALTER FUNCTION "public"."activate_doping"("p_user_id" "uuid", "p_listing_id" "uuid", "p_package_id" "uuid", "p_payment_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."activate_doping"("p_user_id" "uuid", "p_listing_id" "uuid", "p_package_id" "uuid", "p_payment_id" "uuid") IS 'Activates a doping package for a listing after successful payment. Updates listing columns based on doping type.';



CREATE OR REPLACE FUNCTION "public"."activate_free_pricing_plan"("p_user_id" "uuid", "p_plan_id" "uuid", "p_plan_name" "text", "p_credits" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_recent_activation_count integer;
  v_payment_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_plan_id::text, 0)
  );

  SELECT count(*)
  INTO v_recent_activation_count
  FROM public.payments
  WHERE user_id = p_user_id
    AND plan_id = p_plan_id
    AND provider = 'free'
    AND status = 'success'
    AND created_at >= timezone('utc', now()) - interval '24 hours';

  IF v_recent_activation_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Bu ücretsiz planı son 24 saat içinde zaten aktifleştirdiniz.'
    );
  END IF;

  INSERT INTO public.payments (
    user_id,
    amount,
    currency,
    provider,
    status,
    plan_id,
    plan_name,
    description
  )
  VALUES (
    p_user_id,
    0,
    'TRY',
    'free',
    'success',
    p_plan_id,
    p_plan_name,
    'Ücretsiz plan: ' || p_plan_name
  )
  RETURNING id INTO v_payment_id;

  PERFORM public.adjust_user_credits_atomic(
    p_user_id,
    p_credits,
    'purchase',
    'Ücretsiz plan kredisi: ' || p_plan_name,
    v_payment_id::text,
    jsonb_build_object(
      'provider', 'free',
      'plan_id', p_plan_id,
      'plan_name', p_plan_name
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id
  );
END;
$$;


ALTER FUNCTION "public"."activate_free_pricing_plan"("p_user_id" "uuid", "p_plan_id" "uuid", "p_plan_name" "text", "p_credits" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."activate_free_pricing_plan"("p_user_id" "uuid", "p_plan_id" "uuid", "p_plan_name" "text", "p_credits" integer) IS 'Atomically activates a free pricing plan, inserts the payment record, and credits the user while preventing parallel double-credit.';



CREATE OR REPLACE FUNCTION "public"."adjust_user_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text" DEFAULT NULL::"text", "p_reference_id" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_transaction_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- 1. Insert into credit_transactions (Audit Log)
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    reference_id,
    metadata
  )
  VALUES (
    p_user_id,
    p_amount,
    p_type::public.credit_transaction_type, -- Cast to enum
    p_description,
    p_reference_id,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  -- 2. Update user balance in profiles
  UPDATE public.profiles
  SET 
    balance_credits = balance_credits + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING balance_credits INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for ID: %', p_user_id;
  END IF;

  -- 3. Return combined result
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'amount', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Atomic credit adjustment failed: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."adjust_user_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."adjust_user_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text" DEFAULT NULL::"text", "p_reference_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_transaction_id UUID;
  v_new_balance INTEGER;
  v_current_balance INTEGER;
BEGIN
  -- Check user existence and current balance
  SELECT balance_credits INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found: %', p_user_id;
  END IF;

  -- 1. If spending (amount < 0), check for sufficient funds
  IF p_amount < 0 AND (v_current_balance + p_amount) < 0 THEN
    RAISE EXCEPTION 'Insufficient credits: % existing, % requested', v_current_balance, p_amount;
  END IF;

  -- 2. Audit Trail
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    reference_id,
    metadata
  )
  VALUES (
    p_user_id,
    p_amount,
    p_type,
    p_description,
    p_reference_id,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  -- 3. Update balance
  UPDATE public.profiles
  SET 
    balance_credits = balance_credits + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING balance_credits INTO v_new_balance;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'amount', p_amount
  );
END;
$$;


ALTER FUNCTION "public"."adjust_user_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_ticket"("p_ticket_id" "uuid", "p_status" "text", "p_admin_response" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_updated_ticket JSONB;
BEGIN
  -- Check if caller is admin
  v_user_id := (SELECT auth.uid());
  v_is_admin := public.is_admin();
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Validate status
  IF p_status NOT IN ('open', 'in_progress', 'resolved', 'closed') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- Update ticket
  UPDATE public.tickets
  SET
    status = p_status::text,
    admin_response = COALESCE(p_admin_response, admin_response),
    resolved_at = CASE 
      WHEN p_status IN ('resolved', 'closed') THEN timezone('utc', now())
      ELSE resolved_at
    END,
    updated_at = timezone('utc', now())
  WHERE id = p_ticket_id
  RETURNING jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'subject', subject,
    'description', description,
    'category', category,
    'priority', priority,
    'status', status,
    'listing_id', listing_id,
    'admin_response', admin_response,
    'resolved_at', resolved_at,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO v_updated_ticket;

  IF v_updated_ticket IS NULL THEN
    RAISE EXCEPTION 'Ticket not found: %', p_ticket_id;
  END IF;

  RETURN v_updated_ticket;
END;
$$;


ALTER FUNCTION "public"."admin_update_ticket"("p_ticket_id" "uuid", "p_status" "text", "p_admin_response" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_update_ticket"("p_ticket_id" "uuid", "p_status" "text", "p_admin_response" "text") IS 'Admin-only ticket update via security definer RPC';



CREATE OR REPLACE FUNCTION "public"."apply_listing_doping"("p_listing_id" "uuid", "p_user_id" "uuid", "p_doping_types" "text"[], "p_duration_days" integer DEFAULT 7, "p_payment_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_listing RECORD;
  v_expires_at TIMESTAMPTZ;
  v_doping_type TEXT;
  v_applied_count INTEGER := 0;
BEGIN
  -- SECURITY: Enforce user ownership if not called by service_role
  IF (SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) <> p_user_id THEN
    RAISE EXCEPTION 'Ownership violation: You can only apply doping for your own listings.';
  END IF;

  -- 1. Verify listing ownership
  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found: %', p_listing_id;
  END IF;
  
  IF v_listing.seller_id != p_user_id THEN
    RAISE EXCEPTION 'User % does not own listing %', p_user_id, p_listing_id;
  END IF;
  
  -- 2. Calculate expiration
  v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;
  
  -- 3. Apply each doping type
  FOREACH v_doping_type IN ARRAY p_doping_types
  LOOP
    CASE v_doping_type
      WHEN 'featured' THEN
        IF v_listing.featured_until IS NULL OR v_listing.featured_until < NOW() THEN
          UPDATE public.listings
          SET 
            featured = true,
            featured_until = v_expires_at,
            updated_at = NOW()
          WHERE id = p_listing_id;
          v_applied_count := v_applied_count + 1;
        END IF;
      WHEN 'urgent' THEN
        IF v_listing.urgent_until IS NULL OR v_listing.urgent_until < NOW() THEN
          UPDATE public.listings SET urgent_until = v_expires_at, updated_at = NOW() WHERE id = p_listing_id;
          v_applied_count := v_applied_count + 1;
        END IF;
      WHEN 'highlighted' THEN
        IF v_listing.highlighted_until IS NULL OR v_listing.highlighted_until < NOW() THEN
          UPDATE public.listings SET highlighted_until = v_expires_at, updated_at = NOW() WHERE id = p_listing_id;
          v_applied_count := v_applied_count + 1;
        END IF;
      ELSE
        RAISE EXCEPTION 'Unknown doping type: %', v_doping_type;
    END CASE;
    
    -- 4. Log doping application
    INSERT INTO public.doping_applications (
      listing_id, user_id, doping_type, duration_days, expires_at, payment_id, metadata
    )
    VALUES (
      p_listing_id, p_user_id, v_doping_type, p_duration_days, v_expires_at, p_payment_id,
      jsonb_build_object('applied_at', NOW(), 'expires_at', v_expires_at)
    );
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'listing_id', p_listing_id, 'applied_count', v_applied_count, 'expires_at', v_expires_at);
END;
$$;


ALTER FUNCTION "public"."apply_listing_doping"("p_listing_id" "uuid", "p_user_id" "uuid", "p_doping_types" "text"[], "p_duration_days" integer, "p_payment_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."apply_listing_doping"("p_listing_id" "uuid", "p_user_id" "uuid", "p_doping_types" "text"[], "p_duration_days" integer, "p_payment_id" "uuid") IS 'Securely applies doping effects to a listing after payment verification.
Separate from payment processing to maintain clear boundaries.';



CREATE OR REPLACE FUNCTION "public"."atomic_moderate_listing"("p_listing_id" "uuid", "p_status" "text", "p_admin_id" "uuid", "p_note" "text", "p_outbox_payload" "jsonb", "p_notification_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_listing RECORD;
  v_action_id UUID;
  v_outbox_id UUID;
  v_notif_id UUID;
BEGIN
  -- 1. Atomic Update: Transitions status and sets published_at if approved
  UPDATE public.listings
  SET status = p_status,
      published_at = CASE WHEN p_status = 'approved' THEN now() ELSE published_at END,
      updated_at = now()
  WHERE id = p_listing_id
    AND status IN ('pending', 'rejected', 'approved')
  RETURNING * INTO v_listing;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found or status not transitionable';
  END IF;

  -- 2. Create Admin Action Log
  INSERT INTO public.admin_actions (
    action,
    admin_user_id,
    note,
    target_id,
    target_type
  ) VALUES (
    CASE WHEN p_status = 'approved' THEN 'approve' ELSE 'reject' END,
    p_admin_id,
    p_note,
    p_listing_id,
    'listing'
  ) RETURNING id INTO v_action_id;

  -- 3. Create In-App Notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    href
  ) VALUES (
    v_listing.seller_id,
    'moderation',
    p_notification_payload->>'title',
    p_notification_payload->>'message',
    p_notification_payload->>'href'
  ) RETURNING id INTO v_notif_id;

  -- 4. Enqueue Outbox Event (Email)
  INSERT INTO public.transaction_outbox (
    event_type,
    payload
  ) VALUES (
    'email_notification',
    p_outbox_payload
  ) RETURNING id INTO v_outbox_id;

  RETURN jsonb_build_object(
    'success', true,
    'listing', to_jsonb(v_listing),
    'action_id', v_action_id,
    'outbox_id', v_outbox_id,
    'notification_id', v_notif_id
  );
END;
$$;


ALTER FUNCTION "public"."atomic_moderate_listing"("p_listing_id" "uuid", "p_status" "text", "p_admin_id" "uuid", "p_note" "text", "p_outbox_payload" "jsonb", "p_notification_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ban_user_atomic"("p_user_id" "uuid", "p_reason" "text", "p_preserve_metadata" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_current_ban_reason text;
  v_final_ban_reason text;
  v_listings_rejected int;
BEGIN
  -- Get current ban reason to preserve trust guard metadata if requested
  IF p_preserve_metadata THEN
    SELECT ban_reason INTO v_current_ban_reason
    FROM profiles
    WHERE id = p_user_id;
    
    -- If current ban_reason contains trust guard metadata, append new reason
    IF v_current_ban_reason IS NOT NULL AND v_current_ban_reason LIKE '%[AUTO_TRUST_GUARD]%' THEN
      v_final_ban_reason := v_current_ban_reason || E'\n' || p_reason;
    ELSE
      v_final_ban_reason := p_reason;
    END IF;
  ELSE
    v_final_ban_reason := p_reason;
  END IF;

  -- Update profile
  UPDATE profiles 
  SET 
    is_banned = true,
    ban_reason = v_final_ban_reason,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Reject all active listings atomically
  WITH rejected AS (
    UPDATE listings 
    SET status = 'rejected'
    WHERE seller_id = p_user_id 
      AND status NOT IN ('rejected', 'archived')
    RETURNING id
  )
  SELECT COUNT(*) INTO v_listings_rejected FROM rejected;

  RETURN jsonb_build_object(
    'success', true,
    'listings_rejected', v_listings_rejected
  );
END;
$$;


ALTER FUNCTION "public"."ban_user_atomic"("p_user_id" "uuid", "p_reason" "text", "p_preserve_metadata" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_reserve_listing_quota"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_count integer;
  v_max integer;
  v_user_type public.user_type;
BEGIN
  PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  SELECT user_type INTO v_user_type FROM public.profiles WHERE id = p_user_id;
  SELECT count(*) INTO v_count 
  FROM public.listings 
  WHERE seller_id = p_user_id 
    AND status IN ('draft', 'pending', 'approved');
  
  v_max := CASE 
    WHEN v_user_type = 'corporate' THEN 200
    WHEN v_user_type = 'professional' THEN 50
    ELSE 3
  END;
  
  RETURN v_count < v_max;
END;
$$;


ALTER FUNCTION "public"."check_and_reserve_listing_quota"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_and_reserve_listing_quota"("p_user_id" "uuid") IS 'Atomically checks if a user has remaining listing quota by locking their profile row.';



CREATE OR REPLACE FUNCTION "public"."check_api_rate_limit"("p_key" "text", "p_limit" integer, "p_window_ms" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_now        timestamptz := now();
  v_reset_at   timestamptz := v_now + (p_window_ms || ' milliseconds')::interval;
  v_count      integer;
  v_final_reset timestamptz;
begin
  insert into public.api_rate_limits (key, count, reset_at)
  values (p_key, 1, v_reset_at)
  on conflict (key) do update
    set count    = case
                     when api_rate_limits.reset_at > v_now then api_rate_limits.count + 1
                     else 1
                   end,
        reset_at = case
                     when api_rate_limits.reset_at > v_now then api_rate_limits.reset_at
                     else v_reset_at
                   end
  returning count, reset_at into v_count, v_final_reset;

  return jsonb_build_object(
    'allowed',   v_count <= p_limit,
    'limit',     p_limit,
    'remaining', greatest(0, p_limit - v_count),
    'resetAt',   extract(epoch from v_final_reset) * 1000
  );
end;
$$;


ALTER FUNCTION "public"."check_api_rate_limit"("p_key" "text", "p_limit" integer, "p_window_ms" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_contact_abuse"("p_email" "text", "p_ip" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_ip_banned BOOLEAN;
  v_email_count INT;
  v_ip_count INT;
  v_recent_abuse_count INT;
BEGIN
  -- 1. Check if IP is banned (and not expired)
  SELECT EXISTS (
    SELECT 1 FROM public.ip_banlist
    WHERE ip_address = p_ip
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_ip_banned;

  IF v_ip_banned THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'ip_banned',
      'message', 'Bu IP adresi engellenmiştir.'
    );
  END IF;

  -- 2. Count submissions from this email in last 24 hours
  SELECT COUNT(*) INTO v_email_count
  FROM public.contact_abuse_log
  WHERE email = p_email
    AND created_at > now() - interval '24 hours';

  -- 3. Count submissions from this IP in last 24 hours
  SELECT COUNT(*) INTO v_ip_count
  FROM public.contact_abuse_log
  WHERE ip_address = p_ip
    AND created_at > now() - interval '24 hours';

  -- 4. Count recent abuse attempts (last 1 hour)
  SELECT COUNT(*) INTO v_recent_abuse_count
  FROM public.contact_abuse_log
  WHERE (email = p_email OR ip_address = p_ip)
    AND created_at > now() - interval '1 hour';

  -- 5. Apply thresholds
  IF v_email_count >= 5 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'email_limit',
      'message', 'Bu e-posta adresi 24 saat içinde çok fazla mesaj gönderdi.',
      'count', v_email_count
    );
  END IF;

  IF v_ip_count >= 10 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'ip_limit',
      'message', 'Bu IP adresi 24 saat içinde çok fazla istek gönderdi.',
      'count', v_ip_count
    );
  END IF;

  IF v_recent_abuse_count >= 3 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'recent_abuse',
      'message', 'Son 1 saat içinde çok fazla deneme yapıldı.',
      'count', v_recent_abuse_count
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'allowed', true,
    'email_count', v_email_count,
    'ip_count', v_ip_count
  );
END;
$$;


ALTER FUNCTION "public"."check_contact_abuse"("p_email" "text", "p_ip" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_contact_abuse"("p_email" "text", "p_ip" "text") IS 'Checks if email/IP is allowed to submit contact form based on abuse history';



CREATE OR REPLACE FUNCTION "public"."check_listing_quota_atomic"("p_user_id" "uuid", "p_monthly_limit" integer DEFAULT 2, "p_yearly_limit" integer DEFAULT 10) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_monthly_count INT;
  v_yearly_count  INT;
  v_start_of_month TIMESTAMPTZ;
  v_start_of_year  TIMESTAMPTZ;
  v_lock_key       BIGINT;
BEGIN
  v_lock_key := ('x' || substr(replace(p_user_id::text, '-', ''), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);
  v_start_of_month := date_trunc('month', now() AT TIME ZONE 'UTC');
  v_start_of_year  := date_trunc('year',  now() AT TIME ZONE 'UTC');
  SELECT COUNT(*) INTO v_monthly_count FROM listings WHERE seller_id = p_user_id AND status <> 'archived' AND created_at >= v_start_of_month;
  SELECT COUNT(*) INTO v_yearly_count  FROM listings WHERE seller_id = p_user_id AND status <> 'archived' AND created_at >= v_start_of_year;
  IF v_monthly_count >= p_monthly_limit THEN
    RETURN json_build_object('allowed', false, 'reason', format('Bu ay zaten %s ilan verdin.', p_monthly_limit), 'monthly_count', v_monthly_count, 'yearly_count', v_yearly_count);
  END IF;
  IF v_yearly_count >= p_yearly_limit THEN
    RETURN json_build_object('allowed', false, 'reason', format('Bu yıl zaten %s ilan verdin.', p_yearly_limit), 'monthly_count', v_monthly_count, 'yearly_count', v_yearly_count);
  END IF;
  RETURN json_build_object('allowed', true, 'reason', null, 'monthly_count', v_monthly_count, 'yearly_count', v_yearly_count);
END;
$$;


ALTER FUNCTION "public"."check_listing_quota_atomic"("p_user_id" "uuid", "p_monthly_limit" integer, "p_yearly_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_listing_quota_atomic"("p_user_id" "uuid", "p_monthly_limit" integer, "p_yearly_limit" integer) IS 'Atomically checks listing quota for a user using an advisory lock. Prevents race conditions where two concurrent requests both pass the quota check.';



CREATE OR REPLACE FUNCTION "public"."check_message_rate_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE 
  v_count int;
  v_one_hour_ago timestamptz;
BEGIN
  v_one_hour_ago := NOW() - INTERVAL '1 hour';
  
  SELECT COUNT(*) INTO v_count 
  FROM messages
  WHERE sender_id = NEW.sender_id 
    AND chat_id = NEW.chat_id
    AND created_at > v_one_hour_ago
    AND deleted_at IS NULL;
  
  IF v_count >= 100 THEN
    RAISE EXCEPTION 'rate_limit_exceeded: Maximum 100 messages per hour per chat';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_message_rate_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_rate_limits"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  delete from public.api_rate_limits where reset_at <= now();
$$;


ALTER FUNCTION "public"."cleanup_expired_rate_limits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_payment_success"("p_iyzico_token" "text", "p_user_id" "uuid", "p_iyzico_payment_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_payment record;
  v_job_id uuid;
BEGIN
  -- SECURITY: Enforce user ownership if not called by service_role (implicitly checked via auth.uid())
  -- If auth.uid() is null, it means it's service_role or anonymous (e.g. from a background job if we ever do that)
  -- If auth.uid() is NOT null, it MUST match p_user_id.
  IF (SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) <> p_user_id THEN
    RAISE EXCEPTION 'Ownership violation: You can only confirm your own payments.';
  END IF;

  -- 1. Atomic Update: Transitions from pending -> success
  UPDATE public.payments
  SET status               = 'success',
      iyzico_payment_id    = p_iyzico_payment_id,
      processed_at         = now(),
      webhook_processed_at = now(), -- Atomic lock for webhook
      updated_at           = now()
  WHERE iyzico_token = p_iyzico_token
    AND user_id      = p_user_id
    AND status       = 'pending'
  RETURNING id, listing_id, package_id INTO v_payment;

  -- 2. If already success/processed, just return existing data
  IF NOT FOUND THEN
    SELECT id, listing_id, package_id INTO v_payment
    FROM public.payments
    WHERE iyzico_token = p_iyzico_token AND user_id = p_user_id;

    IF v_payment.id IS NULL THEN
        RETURN jsonb_build_object('updated', false, 'status', 'not_found');
    END IF;

    RETURN jsonb_build_object(
      'updated',    false,
      'status',     'already_confirmed',
      'id',         v_payment.id,
      'listing_id', v_payment.listing_id,
      'package_id', v_payment.package_id
    );
  END IF;

  -- 3. Queue fulfillment job immediately
  -- This ensures that even if the webhook is slow, the user's action starts the fulfillment
  IF v_payment.listing_id IS NOT NULL AND v_payment.package_id IS NOT NULL THEN
    -- create_fulfillment_job handles idempotency via unique_payment_job constraint
    SELECT public.create_fulfillment_job(
      v_payment.id,
      'doping_apply',
      jsonb_build_object(
        'listing_id', v_payment.listing_id,
        'package_id', v_payment.package_id,
        'user_id', p_user_id
      )
    ) INTO v_job_id;
  END IF;

  RETURN jsonb_build_object(
    'updated',    true,
    'status',     'confirmed',
    'id',         v_payment.id,
    'listing_id', v_payment.listing_id,
    'package_id', v_payment.package_id,
    'job_id',     v_job_id
  );
END;
$$;


ALTER FUNCTION "public"."confirm_payment_success"("p_iyzico_token" "text", "p_user_id" "uuid", "p_iyzico_payment_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_chat_atomic"("p_listing_id" "uuid", "p_buyer_id" "uuid", "p_seller_id" "uuid", "p_system_message" "text" DEFAULT 'Chat başlatıldı.'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_chat_id uuid;
BEGIN
  -- Check if already exists
  SELECT id INTO v_chat_id
  FROM public.chats
  WHERE listing_id = p_listing_id
    AND buyer_id = p_buyer_id
    AND seller_id = p_seller_id;
    
  IF v_chat_id IS NOT NULL THEN
    RETURN v_chat_id;
  END IF;

  -- Create chat
  INSERT INTO public.chats (listing_id, buyer_id, seller_id, status)
  VALUES (p_listing_id, p_buyer_id, p_seller_id, 'active')
  RETURNING id INTO v_chat_id;

  -- Create initial message
  INSERT INTO public.messages (chat_id, sender_id, content, message_type, is_read)
  VALUES (v_chat_id, p_buyer_id, p_system_message, 'system', true);

  RETURN v_chat_id;
END;
$$;


ALTER FUNCTION "public"."create_chat_atomic"("p_listing_id" "uuid", "p_buyer_id" "uuid", "p_seller_id" "uuid", "p_system_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_fulfillment_job"("p_payment_id" "uuid", "p_job_type" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_job_id UUID;
BEGIN
  -- Check if job already exists (idempotency)
  SELECT id INTO v_job_id
  FROM fulfillment_jobs
  WHERE payment_id = p_payment_id 
    AND job_type = p_job_type
    AND status NOT IN ('dead_letter');
  
  IF FOUND THEN
    RETURN v_job_id;
  END IF;
  
  -- Create new job
  INSERT INTO fulfillment_jobs (
    payment_id,
    job_type,
    metadata
  )
  VALUES (
    p_payment_id,
    p_job_type,
    p_metadata
  )
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$;


ALTER FUNCTION "public"."create_fulfillment_job"("p_payment_id" "uuid", "p_job_type" "text", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_fulfillment_job"("p_payment_id" "uuid", "p_job_type" "text", "p_metadata" "jsonb") IS 'Creates a new fulfillment job with idempotency. Returns existing job ID if already exists.';



CREATE OR REPLACE FUNCTION "public"."create_listing_with_images"("p_listing_data" "jsonb", "p_images_to_upsert" "jsonb"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id uuid;
  v_count integer;
  v_max integer;
  v_new_listing jsonb;
  v_listing_id uuid;
BEGIN
  v_user_id := (p_listing_data->>'seller_id')::uuid;
  
  -- Security check
  IF auth.uid() IS NOT NULL AND auth.uid() <> v_user_id THEN
    RAISE EXCEPTION 'unauthorized_access';
  END IF;

  -- 1. Lock the profile row for quota check
  -- PILL: Issue H-3 - Prevent TOCTOU quota race
  PERFORM 1 FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  
  -- 2. Check quota
  SELECT count(*) INTO v_count 
  FROM public.listings 
  WHERE seller_id = v_user_id 
    AND status IN ('draft', 'pending', 'approved');
    
  SELECT CASE WHEN user_type = 'professional' THEN 50 ELSE 3 END 
  INTO v_max FROM public.profiles WHERE id = v_user_id;
  
  IF v_count >= v_max THEN
    RAISE EXCEPTION 'quota_exceeded';
  END IF;

  -- 3. Insert listing
  INSERT INTO public.listings (
    seller_id, slug, title, category, brand, model, year, mileage, 
    fuel_type, transmission, price, city, district, description, 
    whatsapp_phone, vin, license_plate, car_trim, tramer_amount, 
    damage_status_json, status, version
  ) VALUES (
    v_user_id,
    p_listing_data->>'slug',
    p_listing_data->>'title',
    COALESCE(p_listing_data->>'category', 'otomobil'),
    p_listing_data->>'brand',
    p_listing_data->>'model',
    (p_listing_data->>'year')::integer,
    (p_listing_data->>'mileage')::integer,
    (p_listing_data->>'fuel_type')::public.fuel_type,
    (p_listing_data->>'transmission')::public.transmission_type,
    (p_listing_data->>'price')::bigint,
    p_listing_data->>'city',
    p_listing_data->>'district',
    p_listing_data->>'description',
    p_listing_data->>'whatsapp_phone',
    p_listing_data->>'vin',
    p_listing_data->>'license_plate',
    p_listing_data->>'car_trim',
    (p_listing_data->>'tramer_amount')::numeric,
    (p_listing_data->'damage_status_json'),
    COALESCE((p_listing_data->>'status')::public.listing_status, 'pending'),
    1 -- Initial version starts at 1
  ) RETURNING id, to_jsonb(public.listings.*) INTO v_listing_id, v_new_listing;

  -- 4. Insert images
  IF p_images_to_upsert IS NOT NULL AND array_length(p_images_to_upsert, 1) > 0 THEN
    INSERT INTO public.listing_images (
      listing_id, storage_path, public_url, is_cover, sort_order, placeholder_blur
    )
    SELECT 
      v_listing_id,
      (img->>'storage_path'),
      (img->>'public_url'),
      (img->>'is_cover')::boolean,
      (img->>'sort_order')::integer,
      (img->>'placeholder_blur')
    FROM unnest(p_images_to_upsert) AS img;
  END IF;

  RETURN v_new_listing;
END;
$$;


ALTER FUNCTION "public"."create_listing_with_images"("p_listing_data" "jsonb", "p_images_to_upsert" "jsonb"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_public_ticket"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text" DEFAULT 'medium'::"text", "p_listing_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_ticket_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  -- Validate category
  IF p_category NOT IN ('listing', 'account', 'payment', 'technical', 'feedback', 'other') THEN
    RAISE EXCEPTION 'Invalid category: %', p_category;
  END IF;

  -- Validate priority
  IF p_priority NOT IN ('low', 'medium', 'high', 'urgent') THEN
    RAISE EXCEPTION 'Invalid priority: %', p_priority;
  END IF;

  -- Insert ticket with user_id = NULL (public ticket)
  -- RLS policy "tickets_insert_own_or_public" allows this
  INSERT INTO public.tickets (
    user_id,
    subject,
    description,
    category,
    priority,
    status,
    listing_id,
    created_at,
    updated_at
  )
  VALUES (
    NULL,  -- Public ticket (no user_id)
    p_subject,
    p_description,
    p_category::text,
    p_priority::text,
    'open',
    p_listing_id,
    timezone('utc', now()),
    timezone('utc', now())
  )
  RETURNING id, created_at INTO v_ticket_id, v_created_at;

  -- Return ticket data as JSONB
  RETURN jsonb_build_object(
    'id', v_ticket_id,
    'user_id', NULL,
    'subject', p_subject,
    'description', p_description,
    'category', p_category,
    'priority', p_priority,
    'status', 'open',
    'listing_id', p_listing_id,
    'admin_response', NULL,
    'resolved_at', NULL,
    'created_at', v_created_at,
    'updated_at', v_created_at
  );
END;
$$;


ALTER FUNCTION "public"."create_public_ticket"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text", "p_listing_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_public_ticket"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text", "p_listing_id" "uuid") IS 'Creates a public support ticket (user_id = NULL) via security definer RPC, respecting RLS policies';



CREATE OR REPLACE FUNCTION "public"."create_user_ticket"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text" DEFAULT 'medium'::"text", "p_listing_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
  v_ticket_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  -- Get authenticated user ID
  v_user_id := (SELECT auth.uid());
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate category
  IF p_category NOT IN ('listing', 'account', 'payment', 'technical', 'feedback', 'other') THEN
    RAISE EXCEPTION 'Invalid category: %', p_category;
  END IF;

  -- Validate priority
  IF p_priority NOT IN ('low', 'medium', 'high', 'urgent') THEN
    RAISE EXCEPTION 'Invalid priority: %', p_priority;
  END IF;

  -- Insert ticket with authenticated user_id
  -- RLS policy "tickets_insert_own_or_public" allows this
  INSERT INTO public.tickets (
    user_id,
    subject,
    description,
    category,
    priority,
    status,
    listing_id,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_subject,
    p_description,
    p_category::text,
    p_priority::text,
    'open',
    p_listing_id,
    timezone('utc', now()),
    timezone('utc', now())
  )
  RETURNING id, created_at INTO v_ticket_id, v_created_at;

  -- Return ticket data as JSONB
  RETURN jsonb_build_object(
    'id', v_ticket_id,
    'user_id', v_user_id,
    'subject', p_subject,
    'description', p_description,
    'category', p_category,
    'priority', p_priority,
    'status', 'open',
    'listing_id', p_listing_id,
    'admin_response', NULL,
    'resolved_at', NULL,
    'created_at', v_created_at,
    'updated_at', v_created_at
  );
END;
$$;


ALTER FUNCTION "public"."create_user_ticket"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text", "p_listing_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_user_ticket"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text", "p_listing_id" "uuid") IS 'Creates an authenticated user support ticket via security definer RPC, respecting RLS policies';



CREATE OR REPLACE FUNCTION "public"."get_active_brand_city_combinations"() RETURNS TABLE("brand_slug" "text", "city_slug" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT DISTINCT 
    b.slug as brand_slug, 
    c.slug as city_slug
  FROM listings l
  JOIN brands b ON l.brand = b.name
  JOIN cities c ON l.city = c.name
  WHERE l.status = 'approved'
  ORDER BY b.slug, c.slug;
$$;


ALTER FUNCTION "public"."get_active_brand_city_combinations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_dopings_for_listing"("p_listing_id" "uuid") RETURNS TABLE("doping_type" "text", "expires_at" timestamp with time zone, "package_name" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    dp.type as doping_type,
    dpu.expires_at,
    dp.name as package_name
  FROM doping_purchases dpu
  JOIN doping_packages dp ON dp.id = dpu.package_id
  WHERE dpu.listing_id = p_listing_id
    AND dpu.status = 'active'
    AND (dpu.expires_at IS NULL OR dpu.expires_at > timezone('utc', now()))
  ORDER BY dpu.created_at DESC;
$$;


ALTER FUNCTION "public"."get_active_dopings_for_listing"("p_listing_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_active_dopings_for_listing"("p_listing_id" "uuid") IS 'Returns all active doping packages for a given listing with expiry information.';



CREATE OR REPLACE FUNCTION "public"."get_dead_letter_jobs"("p_limit" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "payment_id" "uuid", "job_type" "text", "attempts" integer, "last_error" "text", "error_details" "jsonb", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "payment_data" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.payment_id,
    j.job_type,
    j.attempts,
    j.last_error,
    j.error_details,
    j.created_at,
    j.updated_at,
    jsonb_build_object(
      'user_id', p.user_id,
      'amount', p.amount,
      'listing_id', p.listing_id,
      'status', p.status,
      'metadata', p.metadata
    ) as payment_data
  FROM fulfillment_jobs j
  INNER JOIN payments p ON p.id = j.payment_id
  WHERE j.status = 'dead_letter'
  ORDER BY j.updated_at DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_dead_letter_jobs"("p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_dead_letter_jobs"("p_limit" integer) IS 'Gets jobs that have failed all retry attempts for admin review.';



CREATE OR REPLACE FUNCTION "public"."get_listings_by_brand_count"("p_status" "text" DEFAULT 'approved'::"text") RETURNS TABLE("brand" "text", "count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT brand, count(*) AS count
  FROM public.listings
  WHERE status = p_status::public.listing_status
  GROUP BY brand
  ORDER BY count DESC
  LIMIT 10;
$$;


ALTER FUNCTION "public"."get_listings_by_brand_count"("p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_listings_by_city_count"("p_status" "text" DEFAULT 'approved'::"text") RETURNS TABLE("city" "text", "count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT city, count(*) AS count
  FROM public.listings
  WHERE status = p_status::public.listing_status
  GROUP BY city
  ORDER BY count DESC
  LIMIT 10;
$$;


ALTER FUNCTION "public"."get_listings_by_city_count"("p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_listings_by_status_count"() RETURNS TABLE("status" "text", "count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT status::text, count(*) AS count
  FROM public.listings
  GROUP BY status;
$$;


ALTER FUNCTION "public"."get_listings_by_status_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ready_fulfillment_jobs"("p_limit" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "payment_id" "uuid", "job_type" "text", "attempts" integer, "max_attempts" integer, "metadata" "jsonb", "payment_data" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.payment_id,
    j.job_type,
    j.attempts,
    j.max_attempts,
    j.metadata,
    jsonb_build_object(
      'user_id', p.user_id,
      'amount', p.amount,
      'listing_id', p.listing_id,
      'metadata', p.metadata
    ) as payment_data
  FROM fulfillment_jobs j
  INNER JOIN payments p ON p.id = j.payment_id
  WHERE j.status IN ('pending', 'failed')
    AND j.scheduled_at <= NOW()
    AND j.attempts < j.max_attempts
  ORDER BY j.scheduled_at ASC
  LIMIT p_limit
  FOR UPDATE OF j SKIP LOCKED; -- Prevent concurrent processing
END;
$$;


ALTER FUNCTION "public"."get_ready_fulfillment_jobs"("p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_ready_fulfillment_jobs"("p_limit" integer) IS 'Gets jobs ready for processing with SKIP LOCKED to prevent concurrent processing.';



CREATE OR REPLACE FUNCTION "public"."increment_compensating_retry"("p_id" "uuid", "p_error" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_retry_count INT;
  v_max_retries INT;
  v_status TEXT;
  v_delay_mins BIGINT;
  v_next_attempt TIMESTAMPTZ;
BEGIN
  SELECT retry_count, max_retries INTO v_retry_count, v_max_retries FROM compensating_actions WHERE id = p_id FOR UPDATE;
  v_retry_count := COALESCE(v_retry_count, 0) + 1;
  IF v_retry_count >= v_max_retries THEN
    v_status := 'manual_intervention_required';
  ELSE
    v_status := 'pending';
  END IF;

  v_delay_mins := POWER(2, v_retry_count) * 5;
  v_next_attempt := NOW() + (v_delay_mins || ' minutes')::INTERVAL;

  UPDATE compensating_actions
  SET status = v_status,
      retry_count = v_retry_count,
      next_attempt_at = v_next_attempt,
      last_error = p_error
  WHERE id = p_id;
END;
$$;


ALTER FUNCTION "public"."increment_compensating_retry"("p_id" "uuid", "p_error" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_listing_view"("target_listing_id" "uuid", "target_viewer_id" "uuid" DEFAULT NULL::"uuid", "target_viewer_ip" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  last_view_time timestamptz;
BEGIN
  IF target_viewer_id IS NOT NULL THEN
    SELECT created_at INTO last_view_time
    FROM public.listing_views
    WHERE listing_id = target_listing_id AND viewer_id = target_viewer_id
    LIMIT 1;
  ELSE
    SELECT created_at INTO last_view_time
    FROM public.listing_views
    WHERE listing_id = target_listing_id AND viewer_ip = target_viewer_ip AND viewer_id IS NULL
    LIMIT 1;
  END IF;

  IF last_view_time IS NULL OR last_view_time < now() - interval '24 hours' THEN
    INSERT INTO public.listing_views (listing_id, viewer_id, viewer_ip)
    VALUES (target_listing_id, target_viewer_id, target_viewer_ip);

    UPDATE public.listings
    SET view_count = view_count + 1
    WHERE id = target_listing_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."increment_listing_view"("target_listing_id" "uuid", "target_viewer_id" "uuid", "target_viewer_ip" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_outbox_retry"("p_id" "uuid", "p_error" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_retry_count INT;
  v_status TEXT;
  v_delay_ms BIGINT;
  v_next_attempt TIMESTAMPTZ;
BEGIN
  SELECT retry_count INTO v_retry_count FROM transaction_outbox WHERE id = p_id FOR UPDATE;
  v_retry_count := COALESCE(v_retry_count, 0) + 1;
  IF v_retry_count >= 5 THEN
    v_status := 'failed';
  ELSE
    v_status := 'pending';
  END IF;

  v_delay_ms := LEAST(1000 * POWER(2, v_retry_count), 3600000);
  v_next_attempt := NOW() + (v_delay_ms || ' milliseconds')::INTERVAL;

  UPDATE transaction_outbox
  SET status = v_status,
      retry_count = v_retry_count,
      next_attempt_at = v_next_attempt,
      is_poison_pill = (v_status = 'failed'),
      error_message = p_error
  WHERE id = p_id;
END;
$$;


ALTER FUNCTION "public"."increment_outbox_retry"("p_id" "uuid", "p_error" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_user_credits"("p_user_id" "uuid", "p_credits" integer) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_new_balance integer;
BEGIN
  UPDATE public.profiles
  SET balance_credits = balance_credits + p_credits,
      updated_at = timezone('utc', now())
  WHERE id = p_user_id
  RETURNING balance_credits INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  RETURN v_new_balance;
END;
$$;


ALTER FUNCTION "public"."increment_user_credits"("p_user_id" "uuid", "p_credits" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_webhook_attempts"("p_token" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.payments
  SET webhook_attempts = COALESCE(webhook_attempts, 0) + 1,
      updated_at       = now()
  WHERE iyzico_token = p_token;
END;
$$;


ALTER FUNCTION "public"."increment_webhook_attempts"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_banned"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_is_banned boolean;
BEGIN
  SELECT is_banned INTO v_is_banned
  FROM public.profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_is_banned, false);
END;
$$;


ALTER FUNCTION "public"."is_user_banned"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_valid_damage_status_json"("data" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  valid_parts  text[] := ARRAY[
    'kaput', 'tavan', 'on_tampon', 'arka_tampon',
    'on_sol_camurluk', 'on_sag_camurluk',
    'arka_sol_camurluk', 'arka_sag_camurluk',
    'sol_on_kapi', 'sag_on_kapi',
    'sol_arka_kapi', 'sag_arka_kapi',
    'bagaj', 'sol_far', 'sag_far',
    'on_cam', 'arka_cam',
    'sol_yan_ayna', 'sag_yan_ayna',
    'tavan_penceresi', 'stepne_kapagi'
  ];
  valid_values text[] := ARRAY[
    'orjinal', 'orijinal', 'boyali', 'lokal_boyali', 'degisen', 'hasarli', 'belirtilmemis', 'bilinmiyor'
  ];
  rec record;
BEGIN
  -- NULL geçerli — hasar kaydı opsiyonel
  IF data IS NULL THEN
    RETURN true;
  END IF;

  -- Object olmalı (array veya scalar değil)
  IF jsonb_typeof(data) <> 'object' THEN
    RETURN false;
  END IF;

  -- Her key ve value'yu kontrol et
  FOR rec IN SELECT key, value FROM jsonb_each_text(data)
  LOOP
    IF rec.key <> ALL(valid_parts) THEN
      RETURN false;
    END IF;
    IF rec.value <> ALL(valid_values) THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."is_valid_damage_status_json"("data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_contact_abuse"("p_email" "text", "p_ip" "text", "p_reason" "text", "p_user_agent" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.contact_abuse_log (email, ip_address, reason, user_agent, metadata)
  VALUES (p_email, p_ip, p_reason, p_user_agent, p_metadata)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;


ALTER FUNCTION "public"."log_contact_abuse"("p_email" "text", "p_ip" "text", "p_reason" "text", "p_user_agent" "text", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_contact_abuse"("p_email" "text", "p_ip" "text", "p_reason" "text", "p_user_agent" "text", "p_metadata" "jsonb") IS 'Logs a contact form abuse attempt';



CREATE OR REPLACE FUNCTION "public"."mark_job_failed"("p_job_id" "uuid", "p_error_message" "text", "p_error_details" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_job RECORD;
  v_next_retry TIMESTAMPTZ;
  v_backoff_seconds INTEGER;
BEGIN
  -- Get current job state
  SELECT * INTO v_job
  FROM fulfillment_jobs
  WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;
  
  -- Calculate exponential backoff: 2^attempts * 60 seconds
  -- Attempt 1: 2 minutes
  -- Attempt 2: 4 minutes
  -- Attempt 3: 8 minutes
  v_backoff_seconds := POWER(2, v_job.attempts) * 60;
  v_next_retry := NOW() + (v_backoff_seconds || ' seconds')::INTERVAL;
  
  -- Check if max attempts reached
  IF v_job.attempts >= v_job.max_attempts THEN
    -- Move to dead letter queue
    UPDATE fulfillment_jobs
    SET 
      status = 'dead_letter',
      last_error = p_error_message,
      error_details = p_error_details,
      updated_at = NOW()
    WHERE id = p_job_id;
    
    RETURN jsonb_build_object(
      'status', 'dead_letter',
      'message', 'Max attempts reached, moved to dead letter queue'
    );
  ELSE
    -- Schedule retry
    UPDATE fulfillment_jobs
    SET 
      status = 'failed',
      last_error = p_error_message,
      error_details = p_error_details,
      scheduled_at = v_next_retry,
      updated_at = NOW()
    WHERE id = p_job_id;
    
    RETURN jsonb_build_object(
      'status', 'failed',
      'next_retry', v_next_retry,
      'backoff_seconds', v_backoff_seconds,
      'attempts_remaining', v_job.max_attempts - v_job.attempts
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."mark_job_failed"("p_job_id" "uuid", "p_error_message" "text", "p_error_details" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_job_failed"("p_job_id" "uuid", "p_error_message" "text", "p_error_details" "jsonb") IS 'Marks a job as failed with exponential backoff retry or moves to dead letter queue if max attempts reached.';



CREATE OR REPLACE FUNCTION "public"."mark_job_processing"("p_job_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE fulfillment_jobs
  SET 
    status = 'processing',
    attempts = attempts + 1,
    updated_at = NOW()
  WHERE id = p_job_id
    AND status IN ('pending', 'failed');
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."mark_job_processing"("p_job_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_job_processing"("p_job_id" "uuid") IS 'Marks a job as processing and increments attempt counter.';



CREATE OR REPLACE FUNCTION "public"."mark_job_success"("p_job_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE fulfillment_jobs
  SET 
    status = 'success',
    processed_at = NOW(),
    last_error = NULL,
    error_details = NULL,
    updated_at = NOW()
  WHERE id = p_job_id;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."mark_job_success"("p_job_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_job_success"("p_job_id" "uuid") IS 'Marks a job as successfully completed.';



CREATE OR REPLACE FUNCTION "public"."prevent_credit_transaction_updates"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Allow INSERT, block UPDATE and DELETE
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Credit transactions are immutable. Cannot update transaction %.', OLD.id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Credit transactions are immutable. Cannot delete transaction %.', OLD.id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_credit_transaction_updates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_compensating_actions_events"("batch_size" integer) RETURNS TABLE("id" "uuid", "action_type" "text", "payload" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  UPDATE compensating_actions
  SET status = 'processing'
  WHERE id IN (
    SELECT c.id
    FROM compensating_actions c
    WHERE c.status = 'pending'
      AND c.next_attempt_at <= NOW()
    ORDER BY c.next_attempt_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT batch_size
  )
  RETURNING compensating_actions.id, compensating_actions.action_type, compensating_actions.payload;
END;
$$;


ALTER FUNCTION "public"."process_compensating_actions_events"("batch_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_outbox_events"("batch_size" integer) RETURNS TABLE("id" "uuid", "event_type" "text", "payload" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  UPDATE transaction_outbox
  SET status = 'processing'
  WHERE id IN (
    SELECT o.id
    FROM transaction_outbox o
    WHERE o.status = 'pending'
      AND o.is_poison_pill = FALSE
      AND o.hard_deadline >= NOW()
      AND o.next_attempt_at <= NOW()
    ORDER BY o.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT batch_size
  )
  RETURNING transaction_outbox.id, transaction_outbox.event_type, transaction_outbox.payload;
END;
$$;


ALTER FUNCTION "public"."process_outbox_events"("batch_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_payment_success"("p_payment_id" "uuid", "p_iyzico_payment_id" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_payment RECORD;
  v_credits_added INTEGER;
  v_transaction_id UUID;
BEGIN
  -- 1. Lock payment record for update (prevent race conditions)
  SELECT * INTO v_payment
  FROM payments
  WHERE id = p_payment_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found: %', p_payment_id;
  END IF;
  
  -- 2. Idempotency check - if already processed, return success
  IF v_payment.status = 'success' AND v_payment.fulfilled_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'message', 'Payment already processed',
      'payment_id', p_payment_id
    );
  END IF;
  
  -- 3. Validate state transition (only pending/processing can become success)
  IF v_payment.status NOT IN ('pending', 'processing') THEN
    RAISE EXCEPTION 'Invalid state transition: % -> success', v_payment.status;
  END IF;
  
  -- 4. Update payment status
  UPDATE payments
  SET 
    status = 'success',
    processed_at = NOW(),
    iyzico_payment_id = COALESCE(p_iyzico_payment_id, iyzico_payment_id),
    updated_at = NOW()
  WHERE id = p_payment_id;
  
  -- 5. Process based on payment type
  IF (v_payment.metadata->>'type') = 'plan_purchase' THEN
    -- Credit purchase - add credits to user balance
    v_credits_added := (v_payment.metadata->>'credits')::INTEGER;
    
    IF v_credits_added IS NULL OR v_credits_added <= 0 THEN
      RAISE EXCEPTION 'Invalid credits amount in payment metadata';
    END IF;
    
    -- Log credit transaction (immutable audit trail)
    INSERT INTO credit_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      reference_id,
      metadata
    )
    VALUES (
      v_payment.user_id,
      v_credits_added,
      'purchase',
      'Plan purchase: ' || COALESCE(v_payment.plan_name, 'Unknown'),
      p_payment_id::TEXT,
      jsonb_build_object(
        'payment_id', p_payment_id,
        'plan_id', v_payment.plan_id,
        'plan_name', v_payment.plan_name
      )
    )
    RETURNING id INTO v_transaction_id;
    
    -- Update user balance (atomic)
    PERFORM increment_user_credits(v_payment.user_id, v_credits_added);
    
  ELSIF (v_payment.metadata->>'type') = 'doping' THEN
    -- Doping purchase - will be applied separately by doping service
    -- Just mark as fulfilled, actual doping application happens in service layer
    v_credits_added := 0;
  ELSE
    RAISE EXCEPTION 'Unknown payment type: %', v_payment.metadata->>'type';
  END IF;
  
  -- 6. Mark as fulfilled
  UPDATE payments
  SET fulfilled_at = NOW()
  WHERE id = p_payment_id;
  
  -- 7. Return success
  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'message', 'Payment processed successfully',
    'payment_id', p_payment_id,
    'credits_added', v_credits_added,
    'transaction_id', v_transaction_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Payment processing failed: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."process_payment_success"("p_payment_id" "uuid", "p_iyzico_payment_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."process_payment_success"("p_payment_id" "uuid", "p_iyzico_payment_id" "text") IS 'Atomically processes a successful payment with idempotency guarantees. 
Handles credit purchases and marks doping payments as ready for application.';



CREATE OR REPLACE FUNCTION "public"."process_payment_webhook"("p_token" "text", "p_status" "text", "p_iyzico_payment_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_payment RECORD;
  v_job_id UUID;
BEGIN
  -- 1. Atomic lock: Only one worker can set webhook_processed_at to non-null
  UPDATE public.payments
  SET 
    status = p_status,
    iyzico_payment_id = p_iyzico_payment_id,
    processed_at = now(),
    webhook_processed_at = now(),
    updated_at = now()
  WHERE iyzico_token = p_token
    AND webhook_processed_at IS NULL -- Atomic check
  RETURNING id, user_id, listing_id, package_id INTO v_payment;

  -- 2. If no payment was updated (either not found or already processed)
  IF NOT FOUND THEN
    -- Check if it was already processed
    SELECT id INTO v_payment FROM public.payments WHERE iyzico_token = p_token AND webhook_processed_at IS NOT NULL;
    IF FOUND THEN
      RETURN jsonb_build_object('success', true, 'status', 'already_processed', 'payment_id', v_payment.id);
    ELSE
      RETURN jsonb_build_object('success', false, 'status', 'not_found');
    END IF;
  END IF;

  -- 3. Queue fulfillment job if success and meta exists
  IF p_status = 'success' AND v_payment.listing_id IS NOT NULL AND v_payment.package_id IS NOT NULL THEN
    -- Using the existing create_fulfillment_job logic
    INSERT INTO public.fulfillment_jobs (
      payment_id,
      job_type,
      metadata
    ) VALUES (
      v_payment.id,
      'doping_apply',
      jsonb_build_object(
        'listing_id', v_payment.listing_id,
        'package_id', v_payment.package_id,
        'user_id', v_payment.user_id
      )
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_job_id;
  END IF;

  -- 4. Increment webhook attempts
  UPDATE public.payments
  SET webhook_attempts = COALESCE(webhook_attempts, 0) + 1
  WHERE iyzico_token = p_token;

  -- 5. Mark log as processed (the audit trail)
  UPDATE public.payment_webhook_logs
  SET status = 'processed'
  WHERE payload->>'token' = p_token;

  RETURN jsonb_build_object(
    'success', true, 
    'status', 'processed',
    'payment_id', v_payment.id, 
    'job_id', v_job_id
  );
END;
$$;


ALTER FUNCTION "public"."process_payment_webhook"("p_token" "text", "p_status" "text", "p_iyzico_payment_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_critical_table"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF (SELECT current_setting('app.confirm_bulk_delete', true)) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Bulk deletion on this critical table is forbidden. Set app.confirm_bulk_delete = true first.';
  END IF;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."protect_critical_table"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_listing_status_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- If the user is NOT an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    -- If setting to approved/rejected from outside these statuses
    IF NEW.status IN ('approved', 'rejected') AND OLD.status NOT IN ('approved', 'rejected') THEN
      RAISE EXCEPTION 'İlan durumu sadece moderatörler tarafından onaylanabilir. (Moderation bypass restricted)';
    END IF;
    
    -- Prevent changing back to approved if it was rejected
    IF OLD.status = 'rejected' AND NEW.status = 'approved' THEN
       RAISE EXCEPTION 'Reddedilen ilan onaylanamaz. (Cannot approve rejected listing)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."protect_listing_status_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_profile_sensitive_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- If the user is NOT an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    -- Prevent changing role
    IF NEW.role <> OLD.role THEN
      RAISE EXCEPTION 'Yetkisiz rol değişimi denemesi. (Role modification restricted)';
    END IF;

    -- Prevent changing balance
    IF NEW.balance_credits <> OLD.balance_credits THEN
      RAISE EXCEPTION 'Yetkisiz bakiye değişimi denemesi. (Balance modification restricted)';
    END IF;

    -- Prevent changing verification status
    IF NEW.is_verified <> OLD.is_verified THEN
      RAISE EXCEPTION 'Yetkisiz doğrulama durumu değişimi denemesi. (Verification status modification restricted)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."protect_profile_sensitive_columns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalibrate_all_market_stats"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT brand, model, year, AVG(price) AS avg_price, COUNT(*) AS listing_count
    FROM public.listings
    WHERE status = 'approved'
    GROUP BY brand, model, year
  ) LOOP
    INSERT INTO public.market_stats (brand, model, year, avg_price, listing_count, calculated_at)
    VALUES (r.brand, r.model, r.year, r.avg_price, r.listing_count, now())
    ON CONFLICT (brand, model, year)
    DO UPDATE SET
      avg_price = EXCLUDED.avg_price,
      listing_count = EXCLUDED.listing_count,
      calculated_at = EXCLUDED.calculated_at;

    UPDATE public.listings
    SET market_price_index = price / r.avg_price,
        updated_at = now()
    WHERE brand = r.brand
      AND model = r.model
      AND year = r.year
      AND status = 'approved';
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."recalibrate_all_market_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."retry_dead_letter_job"("p_job_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE fulfillment_jobs
  SET 
    status = 'pending',
    attempts = 0,
    scheduled_at = NOW(),
    last_error = NULL,
    error_details = NULL,
    updated_at = NOW()
  WHERE id = p_job_id
    AND status = 'dead_letter';
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."retry_dead_letter_job"("p_job_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."retry_dead_letter_job"("p_job_id" "uuid") IS 'Manually retries a dead letter job (admin action).';



CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_expire_old_listings"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_log_id    uuid;
  v_rows      integer := 0;
  v_err       text;
BEGIN
  -- Open log entry
  INSERT INTO public.cron_job_logs (job_name, status)
  VALUES ('expire-old-listings', 'running')
  RETURNING id INTO v_log_id;

  BEGIN
    UPDATE public.listings
    SET status     = 'archived',
        updated_at = timezone('utc', now())
    WHERE status       = 'approved'
      AND published_at < now() - INTERVAL '30 days';

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    -- Mark success
    UPDATE public.cron_job_logs
    SET status        = 'success',
        finished_at   = timezone('utc', now()),
        rows_affected = v_rows
    WHERE id = v_log_id;

  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;

    -- Mark error — never re-raise so cron doesn't crash
    UPDATE public.cron_job_logs
    SET status        = 'error',
        finished_at   = timezone('utc', now()),
        error_message = v_err
    WHERE id = v_log_id;
  END;
END;
$$;


ALTER FUNCTION "public"."run_expire_old_listings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."soft_delete_message"("p_message_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.messages
  SET deleted_at = timezone('utc', now())
  WHERE id = p_message_id 
    AND sender_id = p_user_id;
    
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."soft_delete_message"("p_message_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."soft_delete_profile"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Authorize: must be the user themselves OR an admin
  IF (SELECT auth.uid()) <> p_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Anonymize profile data
  UPDATE public.profiles
  SET 
    is_deleted = true,
    anonymized_at = timezone('utc', now()),
    full_name = 'Deleted User',
    phone = '',
    city = '',
    avatar_url = null,
    identity_number = null,
    business_name = null,
    business_address = null,
    business_logo_url = null,
    website_url = null,
    business_slug = null,
    tax_id = null,
    tax_office = null,
    is_verified = false,
    verified_business = false,
    balance_credits = 0,
    updated_at = timezone('utc', now())
  WHERE id = p_user_id;

  -- Archive listings belonging to the user
  UPDATE public.listings
  SET status = 'archived'
  WHERE seller_id = p_user_id;

  -- Expire pending offers belonging to or received by the user
  UPDATE public.offers
  SET status = 'expired',
      updated_at = timezone('utc', now())
  WHERE (buyer_id = p_user_id OR listing_id IN (SELECT id FROM public.listings WHERE seller_id = p_user_id))
    AND status = 'pending';
END;
$$;


ALTER FUNCTION "public"."soft_delete_profile"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_chat_archive"("p_chat_id" "uuid", "p_user_id" "uuid", "p_archive" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ BEGIN UPDATE public.chats SET buyer_archived = CASE WHEN buyer_id = p_user_id THEN p_archive ELSE buyer_archived END, seller_archived = CASE WHEN seller_id = p_user_id THEN p_archive ELSE seller_archived END WHERE id = p_chat_id AND (buyer_id = p_user_id OR seller_id = p_user_id); END; $$;


ALTER FUNCTION "public"."toggle_chat_archive"("p_chat_id" "uuid", "p_user_id" "uuid", "p_archive" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_chat_last_message_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.chats
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."touch_chat_last_message_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_listing_price_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO public.listing_price_history (listing_id, price)
    VALUES (NEW.id, NEW.price);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_listing_price_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_create_fulfillment_jobs"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_meta JSONB;
  v_job_id UUID;
BEGIN
  -- Only act on transition to 'success'
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    v_meta := NEW.metadata;
    
    -- a. Credit Purchase Job
    IF v_meta->>'type' = 'plan_purchase' THEN
      PERFORM create_fulfillment_job(
        NEW.id,
        'credit_add',
        jsonb_build_object('credits', v_meta->'credits')
      );
      
      -- Add notification job
      PERFORM create_fulfillment_job(
        NEW.id,
        'notification_send',
        jsonb_build_object('notification', jsonb_build_object(
          'type', 'system',
          'title', 'Paket satın alındı',
          'message', (COALESCE(NEW.plan_name, 'Paket') || ' başarıyla aktifleştirildi. ' || COALESCE(v_meta->>'credits', '0') || ' kredi hesabınıza eklendi.'),
          'href', '/dashboard/pricing'
        ))
      );
    END IF;

    -- b. Doping Application Job
    IF v_meta->>'type' = 'doping' THEN
      PERFORM create_fulfillment_job(
        NEW.id,
        'doping_apply',
        jsonb_build_object(
          'dopingTypes', v_meta->'dopingTypes',
          'durationDays', COALESCE(v_meta->'durationDays', '7')
        )
      );
      
      -- Add notification job
      PERFORM create_fulfillment_job(
        NEW.id,
        'notification_send',
        jsonb_build_object('notification', jsonb_build_object(
          'type', 'system',
          'title', 'Doping aktifleştirildi',
          'message', 'İlanınız öne çıkarıldı.',
          'href', '/dashboard/listings'
        ))
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_create_fulfillment_jobs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_chat_last_message_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.chats
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_chat_last_message_at"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_chat_last_message_at"() IS 'Automatically update chat last_message_at timestamp when new message arrives';



CREATE OR REPLACE FUNCTION "public"."update_custom_roles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_custom_roles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_fulfillment_jobs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_fulfillment_jobs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_listing_price_indices"("p_brand" "text", "p_model" "text", "p_year" integer, "p_avg_price" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.listings
  SET market_price_index = ROUND((price::numeric / p_avg_price)::numeric, 4),
      updated_at = timezone('utc', now())
  WHERE brand = p_brand
    AND model = p_model
    AND year  = p_year
    AND status = 'approved'
    AND p_avg_price > 0;
END;
$$;


ALTER FUNCTION "public"."update_listing_price_indices"("p_brand" "text", "p_model" "text", "p_year" integer, "p_avg_price" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_listing_search_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.brand, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.model, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.city, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.district, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_listing_search_vector"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_listing_with_images"("p_listing_data" "jsonb", "p_images_to_delete" "text"[], "p_images_to_upsert" "jsonb"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_listing_id uuid;
  v_seller_id uuid;
  v_updated_listing jsonb;
BEGIN
  v_listing_id := (p_listing_data->>'id')::uuid;
  
  -- 1. Get current seller_id to verify ownership
  SELECT seller_id INTO v_seller_id FROM public.listings WHERE id = v_listing_id;
  
  -- Security check
  IF auth.uid() IS NOT NULL AND auth.uid() <> v_seller_id THEN
    RAISE EXCEPTION 'unauthorized_access';
  END IF;

  -- 2. Update listing with OCC
  UPDATE public.listings
  SET 
    title = p_listing_data->>'title',
    price = (p_listing_data->>'price')::bigint, -- Updated to bigint
    description = p_listing_data->>'description',
    city = p_listing_data->>'city',
    district = p_listing_data->>'district',
    mileage = (p_listing_data->>'mileage')::integer,
    fuel_type = p_listing_data->>'fuel_type',
    transmission = p_listing_data->>'transmission',
    license_plate = p_listing_data->>'license_plate',
    vin = p_listing_data->>'vin',
    car_trim = p_listing_data->>'car_trim',
    tramer_amount = (p_listing_data->>'tramer_amount')::numeric,
    damage_status_json = (p_listing_data->'damage_status_json'),
    whatsapp_phone = p_listing_data->>'whatsapp_phone',
    version = version + 1, -- Increment on update
    updated_at = now()
  WHERE id = v_listing_id 
    AND version = (p_listing_data->>'version')::integer -- Matches current version on client
  RETURNING to_jsonb(public.listings.*) INTO v_updated_listing;

  IF v_updated_listing IS NULL THEN
    RAISE EXCEPTION 'concurrent_update_detected';
  END IF;

  -- 3. Delete orphaned images
  IF p_images_to_delete IS NOT NULL AND array_length(p_images_to_delete, 1) > 0 THEN
    DELETE FROM public.listing_images
    WHERE listing_id = v_listing_id 
      AND storage_path = ANY(p_images_to_delete);
  END IF;

  -- 4. Upsert images
  IF p_images_to_upsert IS NOT NULL AND array_length(p_images_to_upsert, 1) > 0 THEN
    INSERT INTO public.listing_images (
      listing_id, storage_path, public_url, is_cover, sort_order, placeholder_blur
    )
    SELECT 
      v_listing_id,
      (img->>'storage_path'),
      (img->>'public_url'),
      (img->>'is_cover')::boolean,
      (img->>'sort_order')::integer,
      (img->>'placeholder_blur')
    FROM unnest(p_images_to_upsert) AS img
    ON CONFLICT (listing_id, storage_path) DO UPDATE SET
      public_url = EXCLUDED.public_url,
      is_cover = EXCLUDED.is_cover,
      sort_order = EXCLUDED.sort_order,
      placeholder_blur = EXCLUDED.placeholder_blur;
  END IF;

  RETURN v_updated_listing;
END;
$$;


ALTER FUNCTION "public"."upsert_listing_with_images"("p_listing_data" "jsonb", "p_images_to_delete" "text"[], "p_images_to_upsert" "jsonb"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_market_stats"("p_brand" "text", "p_model" "text", "p_year" integer, "p_avg_price" numeric, "p_listing_count" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM public.market_stats
  WHERE brand = p_brand
    AND model = p_model
    AND year  = p_year
    AND car_trim IS NULL;

  INSERT INTO public.market_stats (brand, model, year, avg_price, listing_count, calculated_at)
  VALUES (p_brand, p_model, p_year, p_avg_price, p_listing_count, timezone('utc', now()));
END;
$$;


ALTER FUNCTION "public"."upsert_market_stats"("p_brand" "text", "p_model" "text", "p_year" integer, "p_avg_price" numeric, "p_listing_count" integer) OWNER TO "postgres";


CREATE TEXT SEARCH CONFIGURATION "public"."turkish_unaccent" (
    PARSER = "pg_catalog"."default" );

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "asciiword" WITH "turkish_stem";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "word" WITH "extensions"."unaccent", "turkish_stem";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "numword" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "email" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "url" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "host" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "sfloat" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "version" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "hword_numpart" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "hword_part" WITH "extensions"."unaccent", "turkish_stem";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "hword_asciipart" WITH "turkish_stem";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "numhword" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "asciihword" WITH "turkish_stem";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "hword" WITH "extensions"."unaccent", "turkish_stem";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "url_path" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "file" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "float" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "int" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "uint" WITH "simple";


ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."_migrations" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"(),
    "checksum" "text" NOT NULL,
    "execution_time_ms" integer DEFAULT 0,
    "rollback_sql" "text"
);


ALTER TABLE "public"."_migrations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."_migrations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."_migrations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."_migrations_id_seq" OWNED BY "public"."_migrations"."id";



CREATE TABLE IF NOT EXISTS "public"."admin_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_user_id" "uuid" NOT NULL,
    "target_type" "public"."moderation_target_type" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "action" "public"."moderation_action" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."admin_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_rate_limits" (
    "key" "text" NOT NULL,
    "count" integer DEFAULT 0 NOT NULL,
    "reset_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."api_rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "image_url" "text"
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."canonical_search_cache" (
    "query_hash" "text" NOT NULL,
    "query_string" "text" NOT NULL,
    "results_count" integer,
    "last_checked_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."canonical_search_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."car_trims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."car_trims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid",
    "buyer_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_message_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "buyer_archived" boolean DEFAULT false,
    "seller_archived" boolean DEFAULT false,
    CONSTRAINT "chats_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."chats" OWNER TO "postgres";


COMMENT ON TABLE "public"."chats" IS 'Chat conversations between buyers and sellers';



CREATE TABLE IF NOT EXISTS "public"."cities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "plate_code" integer NOT NULL
);


ALTER TABLE "public"."cities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compensating_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_id" "text" NOT NULL,
    "action_type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "retry_count" integer DEFAULT 0,
    "max_retries" integer DEFAULT 10,
    "last_error" "text",
    "next_attempt_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "is_poison_pill" boolean DEFAULT false,
    "hard_deadline" timestamp with time zone DEFAULT ("now"() + '48:00:00'::interval),
    CONSTRAINT "compensating_actions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'manual_intervention_required'::"text"])))
);


ALTER TABLE "public"."compensating_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_abuse_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "ip_address" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."contact_abuse_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."contact_abuse_log" IS 'Tracks all contact form abuse attempts for analysis and blocking';



CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "transaction_type" "text" NOT NULL,
    "description" "text",
    "reference_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cron_job_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_name" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "finished_at" timestamp with time zone,
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    "rows_affected" integer,
    "error_message" "text",
    "details" "jsonb"
);


ALTER TABLE "public"."cron_job_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "permissions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_system" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "custom_roles_name_length" CHECK ((("char_length"("name") >= 2) AND ("char_length"("name") <= 64))),
    CONSTRAINT "custom_roles_permissions_not_empty" CHECK (("array_length"("permissions", 1) > 0))
);


ALTER TABLE "public"."custom_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."custom_roles" IS 'User-defined and system roles for admin panel access control. System roles (is_system=true) are immutable and cannot be deleted or updated.';



CREATE TABLE IF NOT EXISTS "public"."districts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "city_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."districts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."doping_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "doping_type" "text" NOT NULL,
    "duration_days" integer NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "payment_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."doping_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."doping_packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "price" integer NOT NULL,
    "duration_days" integer NOT NULL,
    "type" "text" NOT NULL,
    "features" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."doping_packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."doping_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "package_id" "uuid" NOT NULL,
    "payment_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "starts_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."doping_purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "user_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fulfillment_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "uuid" NOT NULL,
    "job_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer DEFAULT 3 NOT NULL,
    "last_error" "text",
    "error_details" "jsonb",
    "scheduled_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "fulfillment_jobs_job_type_check" CHECK (("job_type" = ANY (ARRAY['credit_add'::"text", 'doping_apply'::"text", 'notification_send'::"text"]))),
    CONSTRAINT "fulfillment_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'success'::"text", 'failed'::"text", 'dead_letter'::"text"])))
);


ALTER TABLE "public"."fulfillment_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."fulfillment_jobs" IS 'Background job queue for payment fulfillments. Supports retry with exponential backoff and dead letter queue.';



CREATE TABLE IF NOT EXISTS "public"."gallery_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "viewer_ip" "text",
    "viewer_id" "uuid",
    "viewed_on" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."gallery_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ip_banlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_address" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "banned_by" "uuid",
    "banned_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."ip_banlist" OWNER TO "postgres";


COMMENT ON TABLE "public"."ip_banlist" IS 'IP addresses banned from using contact form (manual or automatic)';



CREATE SEQUENCE IF NOT EXISTS "public"."listing_display_id_seq"
    START WITH 1000000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."listing_display_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listing_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "public_url" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_cover" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "placeholder_blur" "text"
);


ALTER TABLE "public"."listing_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listing_price_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "price" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "listing_price_history_price_check" CHECK (("price" > 0))
);


ALTER TABLE "public"."listing_price_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listing_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_public" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."listing_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listing_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "viewer_id" "uuid",
    "viewer_ip" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "viewed_on" "date" DEFAULT CURRENT_DATE NOT NULL
);


ALTER TABLE "public"."listing_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "brand" "text" NOT NULL,
    "model" "text" NOT NULL,
    "year" integer NOT NULL,
    "mileage" integer NOT NULL,
    "fuel_type" "public"."fuel_type" NOT NULL,
    "transmission" "public"."transmission_type" NOT NULL,
    "price" bigint NOT NULL,
    "city" "text" NOT NULL,
    "district" "text" NOT NULL,
    "description" "text" NOT NULL,
    "whatsapp_phone" "text" NOT NULL,
    "status" "public"."listing_status" DEFAULT 'pending'::"public"."listing_status" NOT NULL,
    "featured" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "tramer_amount" bigint,
    "damage_status_json" "jsonb",
    "fraud_score" integer DEFAULT 0 NOT NULL,
    "fraud_reason" "text",
    "view_count" integer DEFAULT 0 NOT NULL,
    "featured_until" timestamp with time zone,
    "urgent_until" timestamp with time zone,
    "highlighted_until" timestamp with time zone,
    "market_price_index" numeric(12,2),
    "license_plate" "text",
    "vin" "text",
    "bumped_at" timestamp with time zone,
    "car_trim" "text",
    "expert_inspection" "jsonb",
    "search_vector" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"public"."turkish_unaccent"'::"regconfig", ((((((((((COALESCE("title", ''::"text") || ' '::"text") || COALESCE("brand", ''::"text")) || ' '::"text") || COALESCE("model", ''::"text")) || ' '::"text") || COALESCE("city", ''::"text")) || ' '::"text") || COALESCE("district", ''::"text")) || ' '::"text") || COALESCE("description", ''::"text")))) STORED,
    "locked_until" timestamp with time zone,
    "locked_by" "uuid",
    "deletion_deadline" timestamp with time zone,
    "display_id" bigint DEFAULT "nextval"('"public"."listing_display_id_seq"'::"regclass"),
    "status_updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 0 NOT NULL,
    "category" "public"."vehicle_category" DEFAULT 'otomobil'::"public"."vehicle_category",
    "is_featured" boolean DEFAULT false,
    "is_urgent" boolean DEFAULT false,
    "frame_color" "text",
    "gallery_priority" integer DEFAULT 0,
    "tramer_score" integer,
    "tramer_last_query" timestamp with time zone,
    "vehicle_history" "jsonb",
    "ogis_report_url" "text",
    "last_inspection_date" timestamp with time zone,
    "small_photo_until" timestamp with time zone,
    "homepage_showcase_until" timestamp with time zone,
    "category_showcase_until" timestamp with time zone,
    "top_rank_until" timestamp with time zone,
    "detailed_search_showcase_until" timestamp with time zone,
    "bold_frame_until" timestamp with time zone,
    CONSTRAINT "listings_damage_status_json_check" CHECK ("public"."is_valid_damage_status_json"("damage_status_json")),
    CONSTRAINT "listings_fraud_score_check" CHECK ((("fraud_score" >= 0) AND ("fraud_score" <= 100))),
    CONSTRAINT "listings_mileage_check" CHECK (("mileage" >= 0)),
    CONSTRAINT "listings_price_check" CHECK (("price" > 0)),
    CONSTRAINT "listings_tramer_amount_check" CHECK (("tramer_amount" >= 0)),
    CONSTRAINT "listings_year_check" CHECK ((("year" >= 1950) AND ("year" <= 2100)))
);


ALTER TABLE "public"."listings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."listings"."license_plate" IS 'Vehicle license plate for traceability and auto-fill support.';



COMMENT ON CONSTRAINT "listings_tramer_amount_check" ON "public"."listings" IS 'Enforces that tramer_amount cannot be negative';



CREATE TABLE IF NOT EXISTS "public"."market_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand" "text" NOT NULL,
    "model" "text" NOT NULL,
    "year" integer NOT NULL,
    "avg_price" bigint NOT NULL,
    "listing_count" integer NOT NULL,
    "calculated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "car_trim" "text"
);


ALTER TABLE "public"."market_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chat_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "message_type" "text" DEFAULT 'text'::"text" NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "messages_type_check" CHECK (("message_type" = ANY (ARRAY['text'::"text", 'image'::"text", 'system'::"text", 'file'::"text"])))
);

ALTER TABLE ONLY "public"."messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."messages" IS 'Messages within chat conversations';



CREATE TABLE IF NOT EXISTS "public"."missing_resource_logs" (
    "id" bigint NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_key" "text" NOT NULL,
    "hit_count" integer DEFAULT 1,
    "last_requested_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."missing_resource_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."missing_resource_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."missing_resource_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."missing_resource_logs_id_seq" OWNED BY "public"."missing_resource_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."models" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "user_id" "uuid" NOT NULL,
    "notify_favorite" boolean DEFAULT true NOT NULL,
    "notify_moderation" boolean DEFAULT true NOT NULL,
    "notify_message" boolean DEFAULT true NOT NULL,
    "notify_price_drop" boolean DEFAULT true NOT NULL,
    "notify_saved_search" boolean DEFAULT true NOT NULL,
    "email_moderation" boolean DEFAULT true NOT NULL,
    "email_expiry_warning" boolean DEFAULT true NOT NULL,
    "email_saved_search" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "href" "text",
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "offered_price" bigint NOT NULL,
    "message" "text",
    "status" "public"."offer_status" DEFAULT 'pending'::"public"."offer_status" NOT NULL,
    "counter_price" bigint,
    "counter_message" "text",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "offers_offered_price_check" CHECK (("offered_price" > 0))
);


ALTER TABLE "public"."offers" OWNER TO "postgres";


COMMENT ON TABLE "public"."offers" IS 'Fiyat teklif akışı — alıcı teklif verir, satıcı kabul/red/karşı teklif yapar.';



CREATE TABLE IF NOT EXISTS "public"."payment_webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" DEFAULT 'iyzico'::"text" NOT NULL,
    "token" "text",
    "payload" "jsonb" NOT NULL,
    "headers" "jsonb" NOT NULL,
    "status" "text" NOT NULL,
    "error_message" "text",
    "processing_ms" integer,
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."payment_webhook_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."payment_webhook_logs" IS 'Immutable audit trail for all incoming payment webhooks for debugging and failure analysis.';



CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "amount" bigint NOT NULL,
    "currency" "text" DEFAULT 'TRY'::"text" NOT NULL,
    "provider" "text" NOT NULL,
    "status" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "plan_id" "uuid",
    "plan_name" "text",
    "iyzico_token" "text",
    "iyzico_payment_id" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "listing_id" "uuid",
    "processed_at" timestamp with time zone,
    "fulfilled_at" timestamp with time zone,
    "notified_at" timestamp with time zone,
    "idempotency_key" "text",
    "webhook_attempts" integer DEFAULT 0,
    "package_id" "text",
    "webhook_processed_at" timestamp with time zone,
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'success'::"text", 'failure'::"text", 'refunded'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."phone_reveal_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "viewer_ip" "text",
    "revealed_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."phone_reveal_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."platform_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "price" bigint NOT NULL,
    "credits" integer NOT NULL,
    "features" "jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "listing_quota" integer DEFAULT 3 NOT NULL
);


ALTER TABLE "public"."pricing_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" DEFAULT ''::"text" NOT NULL,
    "phone" "text" DEFAULT ''::"text" NOT NULL,
    "city" "text" DEFAULT ''::"text" NOT NULL,
    "avatar_url" "text",
    "role" "public"."user_role" DEFAULT 'user'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_type" "public"."user_type" DEFAULT 'individual'::"public"."user_type" NOT NULL,
    "balance_credits" integer DEFAULT 0 NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL,
    "business_name" "text",
    "business_address" "text",
    "business_logo_url" "text",
    "business_description" "text",
    "tax_id" "text",
    "tax_office" "text",
    "website_url" "text",
    "verified_business" boolean DEFAULT false NOT NULL,
    "business_slug" "text",
    "is_banned" boolean DEFAULT false NOT NULL,
    "ban_reason" "text",
    "trust_score" integer DEFAULT 0,
    "is_wallet_verified" boolean DEFAULT false,
    "storage_usage_bytes" bigint DEFAULT 0,
    "subscription_synced_at" timestamp with time zone DEFAULT "now"(),
    "verification_status" "public"."verification_status" DEFAULT 'none'::"public"."verification_status" NOT NULL,
    "identity_number" "text",
    "business_cover_url" "text",
    "business_galery_photos" "text"[],
    "business_hours" "jsonb",
    "business_employees" integer,
    "total_listings_count" integer DEFAULT 0 NOT NULL,
    "total_sold_count" integer DEFAULT 0 NOT NULL,
    "verification_requested_at" timestamp with time zone,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "anonymized_at" timestamp with time zone,
    CONSTRAINT "balance_no_negative" CHECK (("balance_credits" >= 0))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."business_slug" IS 'Galeri URL slug (ör: /galeri/oto-burada)';



COMMENT ON COLUMN "public"."profiles"."identity_number" IS 'TC Kimlik Numarası (KVKK - Hassas Kişisel Veri). Şifrelenmiş saklanmalı.';



COMMENT ON COLUMN "public"."profiles"."business_cover_url" IS 'Galeri kapak fotoğrafı';



COMMENT ON COLUMN "public"."profiles"."business_hours" IS 'Çalışma saatleri JSON';



COMMENT ON COLUMN "public"."profiles"."verification_requested_at" IS 'Timestamp when business verification was requested';



CREATE OR REPLACE VIEW "public"."public_profiles" AS
 SELECT "id",
    "full_name",
    "avatar_url",
    "city",
    "role",
    "user_type",
    "business_name",
    "business_logo_url",
    "is_verified",
    "is_banned",
    "ban_reason",
    "verified_business",
    "verification_status",
    "trust_score",
    "business_slug",
    "created_at",
    "updated_at"
   FROM "public"."profiles";


ALTER VIEW "public"."public_profiles" OWNER TO "postgres";


COMMENT ON VIEW "public"."public_profiles" IS 'Publicly accessible profile fields. Excludes sensitive data like phone and identity_number for GDPR/KVKK compliance. Runs securely with view owner privileges.';



CREATE TABLE IF NOT EXISTS "public"."realized_sales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid",
    "category_id" "uuid" NOT NULL,
    "brand" "text" NOT NULL,
    "model" "text" NOT NULL,
    "year" integer NOT NULL,
    "sale_price" numeric(15,2) NOT NULL,
    "sold_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."realized_sales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "reason" "public"."report_reason" NOT NULL,
    "description" "text",
    "status" "public"."report_status" DEFAULT 'open'::"public"."report_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "permissions" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_searches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "filters" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "notifications_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."saved_searches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_blacklist_patterns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pattern_name" "text" NOT NULL,
    "regex_pattern" "text" NOT NULL,
    "action" "text" DEFAULT 'mask'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "security_blacklist_patterns_action_check" CHECK (("action" = ANY (ARRAY['mask'::"text", 'block'::"text", 'flag'::"text"])))
);


ALTER TABLE "public"."security_blacklist_patterns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seller_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "listing_id" "uuid",
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "seller_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."seller_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."storage_objects_registry" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "source_entity_type" "text",
    "source_entity_id" "uuid",
    "file_name" "text",
    "file_size" bigint,
    "mime_type" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "lifecycle_tier" "text" DEFAULT 'hot'::"text",
    "tier_moved_at" timestamp with time zone,
    CONSTRAINT "storage_objects_registry_lifecycle_tier_check" CHECK (("lifecycle_tier" = ANY (ARRAY['hot'::"text", 'warm'::"text", 'cold'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."storage_objects_registry" OWNER TO "postgres";


COMMENT ON TABLE "public"."storage_objects_registry" IS 'Immutable registry of files uploaded through the application API, used for robust ownership verification and storage auditing.';



CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "subject" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "public"."ticket_status" DEFAULT 'open'::"public"."ticket_status",
    "priority" "public"."ticket_priority" DEFAULT 'medium'::"public"."ticket_priority",
    "category" "text" DEFAULT 'general'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "admin_response" "text",
    "resolved_at" timestamp with time zone,
    "listing_id" "uuid"
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_outbox" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "idempotency_key" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    "is_poison_pill" boolean DEFAULT false,
    "hard_deadline" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval),
    "next_attempt_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "transaction_outbox_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."transaction_outbox" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_encryption_keys" (
    "user_id" "uuid" NOT NULL,
    "encryption_key" "text" NOT NULL,
    "algorithm" "text" DEFAULT 'aes-256-gcm'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_encryption_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_quotas" (
    "user_id" "uuid" NOT NULL,
    "listing_credits" integer DEFAULT 3,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_quotas_listing_credits_check" CHECK (("listing_credits" >= 0))
);


ALTER TABLE "public"."user_quotas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_read_writes_tracker" (
    "user_id" "uuid" NOT NULL,
    "last_write_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_read_writes_tracker" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid",
    "vin" "text" NOT NULL,
    "query_result" "jsonb" NOT NULL,
    "tramer_details" "jsonb",
    "accident_count" integer DEFAULT 0,
    "ownership_count" integer DEFAULT 0,
    "last_km" integer,
    "queried_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vehicle_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."vehicle_history" IS 'OGS/TRAMER araç geçmişi sorgu sonuçları — cache.';



ALTER TABLE ONLY "public"."_migrations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."_migrations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."missing_resource_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."missing_resource_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."_migrations"
    ADD CONSTRAINT "_migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."_migrations"
    ADD CONSTRAINT "_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_actions"
    ADD CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_rate_limits"
    ADD CONSTRAINT "api_rate_limits_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."canonical_search_cache"
    ADD CONSTRAINT "canonical_search_cache_pkey" PRIMARY KEY ("query_hash");



ALTER TABLE ONLY "public"."car_trims"
    ADD CONSTRAINT "car_trims_model_id_name_key" UNIQUE ("model_id", "name");



ALTER TABLE ONLY "public"."car_trims"
    ADD CONSTRAINT "car_trims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_listing_id_buyer_id_seller_id_key" UNIQUE ("listing_id", "buyer_id", "seller_id");



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_plate_code_key" UNIQUE ("plate_code");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."compensating_actions"
    ADD CONSTRAINT "compensating_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_abuse_log"
    ADD CONSTRAINT "contact_abuse_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cron_job_logs"
    ADD CONSTRAINT "cron_job_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_roles"
    ADD CONSTRAINT "custom_roles_name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."custom_roles"
    ADD CONSTRAINT "custom_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."districts"
    ADD CONSTRAINT "districts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."doping_applications"
    ADD CONSTRAINT "doping_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."doping_packages"
    ADD CONSTRAINT "doping_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."doping_packages"
    ADD CONSTRAINT "doping_packages_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."doping_purchases"
    ADD CONSTRAINT "doping_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id", "listing_id");



ALTER TABLE ONLY "public"."fulfillment_jobs"
    ADD CONSTRAINT "fulfillment_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_views"
    ADD CONSTRAINT "gallery_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ip_banlist"
    ADD CONSTRAINT "ip_banlist_ip_address_key" UNIQUE ("ip_address");



ALTER TABLE ONLY "public"."ip_banlist"
    ADD CONSTRAINT "ip_banlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_images"
    ADD CONSTRAINT "listing_images_listing_id_sort_order_key" UNIQUE ("listing_id", "sort_order");



ALTER TABLE ONLY "public"."listing_images"
    ADD CONSTRAINT "listing_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_price_history"
    ADD CONSTRAINT "listing_price_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_questions"
    ADD CONSTRAINT "listing_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_views"
    ADD CONSTRAINT "listing_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_stats"
    ADD CONSTRAINT "market_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."missing_resource_logs"
    ADD CONSTRAINT "missing_resource_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_brand_id_name_key" UNIQUE ("brand_id", "name");



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_webhook_logs"
    ADD CONSTRAINT "payment_webhook_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_idempotency_key_unique" UNIQUE ("idempotency_key");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phone_reveal_logs"
    ADD CONSTRAINT "phone_reveal_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."pricing_plans"
    ADD CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_business_slug_key" UNIQUE ("business_slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."realized_sales"
    ADD CONSTRAINT "realized_sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_blacklist_patterns"
    ADD CONSTRAINT "security_blacklist_patterns_pattern_name_key" UNIQUE ("pattern_name");



ALTER TABLE ONLY "public"."security_blacklist_patterns"
    ADD CONSTRAINT "security_blacklist_patterns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seller_reviews"
    ADD CONSTRAINT "seller_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."storage_objects_registry"
    ADD CONSTRAINT "storage_objects_registry_bucket_id_storage_path_key" UNIQUE ("bucket_id", "storage_path");



ALTER TABLE ONLY "public"."storage_objects_registry"
    ADD CONSTRAINT "storage_objects_registry_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_outbox"
    ADD CONSTRAINT "transaction_outbox_idempotency_key_key" UNIQUE ("idempotency_key");



ALTER TABLE ONLY "public"."transaction_outbox"
    ADD CONSTRAINT "transaction_outbox_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fulfillment_jobs"
    ADD CONSTRAINT "unique_payment_job" UNIQUE ("payment_id", "job_type");



ALTER TABLE ONLY "public"."user_encryption_keys"
    ADD CONSTRAINT "user_encryption_keys_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_quotas"
    ADD CONSTRAINT "user_quotas_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_read_writes_tracker"
    ADD CONSTRAINT "user_read_writes_tracker_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."vehicle_history"
    ADD CONSTRAINT "vehicle_history_pkey" PRIMARY KEY ("id");



CREATE INDEX "api_rate_limits_reset_at_idx" ON "public"."api_rate_limits" USING "btree" ("reset_at");



CREATE INDEX "cron_job_logs_job_name_idx" ON "public"."cron_job_logs" USING "btree" ("job_name", "started_at" DESC);



CREATE INDEX "doping_purchases_package_id_idx" ON "public"."doping_purchases" USING "btree" ("package_id");



CREATE INDEX "doping_purchases_payment_id_idx" ON "public"."doping_purchases" USING "btree" ("payment_id");



CREATE UNIQUE INDEX "gallery_views_ip_daily_idx" ON "public"."gallery_views" USING "btree" ("seller_id", "viewer_ip", "viewed_on") WHERE (("viewer_ip" IS NOT NULL) AND ("viewer_id" IS NULL));



CREATE INDEX "gallery_views_seller_idx" ON "public"."gallery_views" USING "btree" ("seller_id", "created_at" DESC);



CREATE UNIQUE INDEX "gallery_views_user_daily_idx" ON "public"."gallery_views" USING "btree" ("seller_id", "viewer_id", "viewed_on") WHERE ("viewer_id" IS NOT NULL);



CREATE INDEX "idx_admin_actions_admin_user_id" ON "public"."admin_actions" USING "btree" ("admin_user_id");



CREATE INDEX "idx_admin_actions_brin_created" ON "public"."admin_actions" USING "brin" ("created_at");



CREATE INDEX "idx_car_trims_model_id" ON "public"."car_trims" USING "btree" ("model_id");



CREATE INDEX "idx_car_trims_sort_order" ON "public"."car_trims" USING "btree" ("sort_order");



CREATE INDEX "idx_chats_buyer_id" ON "public"."chats" USING "btree" ("buyer_id");



CREATE INDEX "idx_chats_buyer_last_message_at" ON "public"."chats" USING "btree" ("buyer_id", "last_message_at" DESC);



CREATE INDEX "idx_chats_seller_id" ON "public"."chats" USING "btree" ("seller_id");



CREATE INDEX "idx_chats_seller_last_message_at" ON "public"."chats" USING "btree" ("seller_id", "last_message_at" DESC);



CREATE INDEX "idx_chats_status" ON "public"."chats" USING "btree" ("status");



CREATE INDEX "idx_compensating_pending" ON "public"."compensating_actions" USING "btree" ("next_attempt_at") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_contact_abuse_log_created_at" ON "public"."contact_abuse_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_contact_abuse_log_email" ON "public"."contact_abuse_log" USING "btree" ("email", "created_at" DESC);



CREATE INDEX "idx_contact_abuse_log_ip" ON "public"."contact_abuse_log" USING "btree" ("ip_address", "created_at" DESC);



CREATE INDEX "idx_credit_transactions_reference" ON "public"."credit_transactions" USING "btree" ("reference_id") WHERE ("reference_id" IS NOT NULL);



CREATE INDEX "idx_credit_transactions_user_id" ON "public"."credit_transactions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_custom_roles_created_by" ON "public"."custom_roles" USING "btree" ("created_by");



CREATE INDEX "idx_custom_roles_is_system" ON "public"."custom_roles" USING "btree" ("is_system");



CREATE INDEX "idx_custom_roles_name" ON "public"."custom_roles" USING "btree" ("name");



CREATE INDEX "idx_districts_city_id" ON "public"."districts" USING "btree" ("city_id");



CREATE INDEX "idx_districts_name" ON "public"."districts" USING "btree" ("name");



CREATE INDEX "idx_doping_applications_expiry" ON "public"."doping_applications" USING "btree" ("expires_at", "listing_id");



CREATE INDEX "idx_doping_applications_listing" ON "public"."doping_applications" USING "btree" ("listing_id");



CREATE INDEX "idx_doping_applications_payment_id" ON "public"."doping_applications" USING "btree" ("payment_id");



CREATE INDEX "idx_doping_applications_user_id" ON "public"."doping_applications" USING "btree" ("user_id");



CREATE INDEX "idx_doping_purchases_active" ON "public"."doping_purchases" USING "btree" ("listing_id", "status", "expires_at") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_doping_purchases_listing_id" ON "public"."doping_purchases" USING "btree" ("listing_id");



CREATE INDEX "idx_doping_purchases_status" ON "public"."doping_purchases" USING "btree" ("status");



CREATE INDEX "idx_doping_purchases_user_id" ON "public"."doping_purchases" USING "btree" ("user_id");



CREATE INDEX "idx_favorites_listing_id" ON "public"."favorites" USING "btree" ("listing_id");



CREATE INDEX "idx_favorites_user_id" ON "public"."favorites" USING "btree" ("user_id");



CREATE INDEX "idx_fulfillment_jobs_dead_letter" ON "public"."fulfillment_jobs" USING "btree" ("status", "created_at") WHERE ("status" = 'dead_letter'::"text");



CREATE INDEX "idx_fulfillment_jobs_payment_id" ON "public"."fulfillment_jobs" USING "btree" ("payment_id");



CREATE INDEX "idx_fulfillment_jobs_status_scheduled" ON "public"."fulfillment_jobs" USING "btree" ("status", "scheduled_at") WHERE ("status" = ANY (ARRAY['pending'::"text", 'failed'::"text"]));



CREATE INDEX "idx_gallery_views_viewer_id" ON "public"."gallery_views" USING "btree" ("viewer_id");



CREATE INDEX "idx_ip_banlist_banned_by" ON "public"."ip_banlist" USING "btree" ("banned_by");



CREATE INDEX "idx_ip_banlist_expires_at" ON "public"."ip_banlist" USING "btree" ("expires_at") WHERE ("expires_at" IS NOT NULL);



CREATE INDEX "idx_ip_banlist_ip" ON "public"."ip_banlist" USING "btree" ("ip_address");



CREATE INDEX "idx_listing_images_listing_id" ON "public"."listing_images" USING "btree" ("listing_id");



CREATE INDEX "idx_listing_questions_asker" ON "public"."listing_questions" USING "btree" ("user_id");



CREATE INDEX "idx_listing_questions_listing_status" ON "public"."listing_questions" USING "btree" ("listing_id", "status");



CREATE INDEX "idx_listing_views_viewer_id" ON "public"."listing_views" USING "btree" ("viewer_id");



CREATE INDEX "idx_listings_brand" ON "public"."listings" USING "btree" ("brand");



CREATE INDEX "idx_listings_brand_model_year" ON "public"."listings" USING "btree" ("brand", "model", "year") WHERE ("status" = 'approved'::"public"."listing_status");



CREATE INDEX "idx_listings_car_trim" ON "public"."listings" USING "btree" ("car_trim");



CREATE INDEX "idx_listings_category" ON "public"."listings" USING "btree" ("category");



CREATE INDEX "idx_listings_city_district_price" ON "public"."listings" USING "btree" ("city", "district", "price") WHERE ("status" = 'approved'::"public"."listing_status");



CREATE INDEX "idx_listings_created_at" ON "public"."listings" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_listings_deletion_deadline" ON "public"."listings" USING "btree" ("deletion_deadline") WHERE ("deletion_deadline" IS NOT NULL);



CREATE UNIQUE INDEX "idx_listings_display_id" ON "public"."listings" USING "btree" ("display_id");



CREATE INDEX "idx_listings_expert_inspection_gin" ON "public"."listings" USING "gin" ("expert_inspection") WHERE ("expert_inspection" IS NOT NULL);



CREATE INDEX "idx_listings_featured" ON "public"."listings" USING "btree" ("featured");



CREATE INDEX "idx_listings_featured_active" ON "public"."listings" USING "btree" ("featured", "featured_until") WHERE (("featured" = true) AND ("status" = 'approved'::"public"."listing_status"));



CREATE INDEX "idx_listings_filter_approved_brand_model_year_price" ON "public"."listings" USING "btree" ("brand", "model", "year", "price") WHERE ("status" = 'approved'::"public"."listing_status");



CREATE INDEX "idx_listings_gallery_priority" ON "public"."listings" USING "btree" ("gallery_priority" DESC) WHERE (("gallery_priority" > 0) AND ("status" = 'approved'::"public"."listing_status"));



CREATE INDEX "idx_listings_homepage_showcase_until" ON "public"."listings" USING "btree" ("homepage_showcase_until" DESC) WHERE ("homepage_showcase_until" IS NOT NULL);



CREATE INDEX "idx_listings_locked_by" ON "public"."listings" USING "btree" ("locked_by");



CREATE INDEX "idx_listings_locked_until" ON "public"."listings" USING "btree" ("locked_until") WHERE ("locked_until" IS NOT NULL);



CREATE INDEX "idx_listings_marketplace_approved_created_at" ON "public"."listings" USING "btree" ("created_at" DESC) WHERE ("status" = 'approved'::"public"."listing_status");



CREATE INDEX "idx_listings_marketplace_search" ON "public"."listings" USING "btree" ("status", "brand", "model", "year", "price", "city") INCLUDE ("slug", "title", "mileage", "fuel_type", "transmission", "bumped_at") WHERE ("status" = 'approved'::"public"."listing_status");



CREATE INDEX "idx_listings_model" ON "public"."listings" USING "btree" ("model");



CREATE INDEX "idx_listings_plate_active" ON "public"."listings" USING "btree" ("license_plate") WHERE (("license_plate" IS NOT NULL) AND ("btrim"("license_plate") <> ''::"text"));



CREATE INDEX "idx_listings_price" ON "public"."listings" USING "btree" ("price");



CREATE INDEX "idx_listings_published_at" ON "public"."listings" USING "btree" ("published_at") WHERE ("status" = 'approved'::"public"."listing_status");



CREATE INDEX "idx_listings_search_vector" ON "public"."listings" USING "gin" ("search_vector") WHERE ("status" = 'approved'::"public"."listing_status");



CREATE INDEX "idx_listings_seller_status" ON "public"."listings" USING "btree" ("seller_id", "status");



CREATE INDEX "idx_listings_slug_lookup" ON "public"."listings" USING "btree" ("slug") WHERE ("status" <> 'archived'::"public"."listing_status");



CREATE INDEX "idx_listings_small_photo_until" ON "public"."listings" USING "btree" ("small_photo_until" DESC) WHERE ("small_photo_until" IS NOT NULL);



CREATE INDEX "idx_listings_status" ON "public"."listings" USING "btree" ("status");



CREATE INDEX "idx_listings_status_brand" ON "public"."listings" USING "btree" ("status", "brand");



CREATE INDEX "idx_listings_status_bumped" ON "public"."listings" USING "btree" ("status", "bumped_at" DESC NULLS LAST);



CREATE INDEX "idx_listings_status_city" ON "public"."listings" USING "btree" ("status", "city");



CREATE INDEX "idx_listings_status_created" ON "public"."listings" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_listings_status_fuel_type" ON "public"."listings" USING "btree" ("status", "fuel_type");



CREATE INDEX "idx_listings_status_mileage" ON "public"."listings" USING "btree" ("status", "mileage");



CREATE INDEX "idx_listings_status_price" ON "public"."listings" USING "btree" ("status", "price");



CREATE INDEX "idx_listings_status_transmission" ON "public"."listings" USING "btree" ("status", "transmission");



CREATE INDEX "idx_listings_status_year" ON "public"."listings" USING "btree" ("status", "year");



CREATE INDEX "idx_listings_top_rank_until" ON "public"."listings" USING "btree" ("top_rank_until" DESC) WHERE ("top_rank_until" IS NOT NULL);



CREATE INDEX "idx_listings_tramer_amount" ON "public"."listings" USING "btree" ("tramer_amount") WHERE ("tramer_amount" IS NOT NULL);



CREATE INDEX "idx_listings_urgent_active" ON "public"."listings" USING "btree" ("is_urgent", "urgent_until") WHERE (("is_urgent" = true) AND ("status" = 'approved'::"public"."listing_status"));



CREATE UNIQUE INDEX "idx_listings_vin_unique_active" ON "public"."listings" USING "btree" ("vin") WHERE (("vin" IS NOT NULL) AND ("btrim"("vin") <> ''::"text") AND ("status" = ANY (ARRAY['pending'::"public"."listing_status", 'approved'::"public"."listing_status"])));



CREATE INDEX "idx_listings_year" ON "public"."listings" USING "btree" ("year");



CREATE INDEX "idx_market_stats_lookup" ON "public"."market_stats" USING "btree" ("brand", "model", "year");



CREATE INDEX "idx_messages_chat_created_at" ON "public"."messages" USING "btree" ("chat_id", "created_at");



CREATE INDEX "idx_messages_chat_id" ON "public"."messages" USING "btree" ("chat_id");



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_messages_is_read" ON "public"."messages" USING "btree" ("is_read");



CREATE INDEX "idx_messages_sender_id" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_migrations_executed_at" ON "public"."_migrations" USING "btree" ("executed_at");



CREATE INDEX "idx_migrations_name" ON "public"."_migrations" USING "btree" ("name");



CREATE UNIQUE INDEX "idx_missing_resource_key" ON "public"."missing_resource_logs" USING "btree" ("resource_type", "resource_key");



CREATE INDEX "idx_models_brand_id" ON "public"."models" USING "btree" ("brand_id");



CREATE INDEX "idx_models_sort_order" ON "public"."models" USING "btree" ("sort_order");



CREATE INDEX "idx_notifications_unread_user" ON "public"."notifications" USING "btree" ("user_id") WHERE ("read" = false);



CREATE INDEX "idx_notifications_user_read" ON "public"."notifications" USING "btree" ("user_id", "read", "created_at" DESC);



CREATE INDEX "idx_offers_buyer" ON "public"."offers" USING "btree" ("buyer_id");



CREATE INDEX "idx_offers_listing" ON "public"."offers" USING "btree" ("listing_id");



CREATE INDEX "idx_offers_seller" ON "public"."offers" USING "btree" ("listing_id", "status");



CREATE INDEX "idx_outbox_next_attempt" ON "public"."transaction_outbox" USING "btree" ("next_attempt_at") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_outbox_pending" ON "public"."transaction_outbox" USING "btree" ("status") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_payment_webhook_logs_created_at" ON "public"."payment_webhook_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_payment_webhook_logs_token" ON "public"."payment_webhook_logs" USING "btree" ("token") WHERE ("token" IS NOT NULL);



CREATE INDEX "idx_payments_idempotency_key" ON "public"."payments" USING "btree" ("idempotency_key") WHERE ("idempotency_key" IS NOT NULL);



CREATE INDEX "idx_payments_iyzico_token" ON "public"."payments" USING "btree" ("iyzico_token") WHERE ("iyzico_token" IS NOT NULL);



CREATE INDEX "idx_payments_listing_id" ON "public"."payments" USING "btree" ("listing_id");



CREATE INDEX "idx_payments_webhook_processed_at" ON "public"."payments" USING "btree" ("webhook_processed_at") WHERE ("webhook_processed_at" IS NULL);



CREATE INDEX "idx_phone_reveal_logs_ip" ON "public"."phone_reveal_logs" USING "btree" ("viewer_ip", "revealed_at" DESC) WHERE ("viewer_ip" IS NOT NULL);



CREATE INDEX "idx_phone_reveal_logs_listing" ON "public"."phone_reveal_logs" USING "btree" ("listing_id", "revealed_at" DESC);



CREATE INDEX "idx_phone_reveal_logs_user" ON "public"."phone_reveal_logs" USING "btree" ("user_id", "revealed_at" DESC) WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_price_history_listing_created" ON "public"."listing_price_history" USING "btree" ("listing_id", "created_at");



CREATE INDEX "idx_profiles_business_name" ON "public"."profiles" USING "btree" ("business_name") WHERE ("user_type" = 'professional'::"public"."user_type");



CREATE INDEX "idx_profiles_business_slug" ON "public"."profiles" USING "btree" ("business_slug") WHERE ("user_type" = 'professional'::"public"."user_type");



CREATE INDEX "idx_profiles_professional" ON "public"."profiles" USING "btree" ("user_type") WHERE ("user_type" = 'professional'::"public"."user_type");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_profiles_verification_requested_at" ON "public"."profiles" USING "btree" ("verification_requested_at") WHERE ("verification_requested_at" IS NOT NULL);



CREATE INDEX "idx_profiles_verification_status" ON "public"."profiles" USING "btree" ("verification_status") WHERE ("verification_status" = ANY (ARRAY['pending'::"public"."verification_status", 'approved'::"public"."verification_status"]));



CREATE INDEX "idx_realized_sales_listing_id" ON "public"."realized_sales" USING "btree" ("listing_id");



CREATE INDEX "idx_realized_sales_lookup" ON "public"."realized_sales" USING "btree" ("category_id", "brand", "model", "year");



CREATE INDEX "idx_reports_reporter_id" ON "public"."reports" USING "btree" ("reporter_id");



CREATE INDEX "idx_reports_status" ON "public"."reports" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_saved_searches_user_id" ON "public"."saved_searches" USING "btree" ("user_id");



CREATE INDEX "idx_seller_reviews_listing_id" ON "public"."seller_reviews" USING "btree" ("listing_id");



CREATE INDEX "idx_seller_reviews_reviewer_id" ON "public"."seller_reviews" USING "btree" ("reviewer_id");



CREATE INDEX "idx_seller_reviews_seller_id" ON "public"."seller_reviews" USING "btree" ("seller_id");



CREATE INDEX "idx_storage_registry_entity" ON "public"."storage_objects_registry" USING "btree" ("source_entity_type", "source_entity_id");



CREATE INDEX "idx_storage_registry_owner" ON "public"."storage_objects_registry" USING "btree" ("owner_id");



CREATE INDEX "idx_tickets_listing_id" ON "public"."tickets" USING "btree" ("listing_id");



CREATE INDEX "idx_tickets_user_id" ON "public"."tickets" USING "btree" ("user_id");



CREATE INDEX "idx_vehicle_history_listing" ON "public"."vehicle_history" USING "btree" ("listing_id");



CREATE INDEX "idx_vehicle_history_vin" ON "public"."vehicle_history" USING "btree" ("vin");



CREATE INDEX "listing_images_listing_idx" ON "public"."listing_images" USING "btree" ("listing_id", "sort_order");



CREATE INDEX "listing_questions_listing_id_idx" ON "public"."listing_questions" USING "btree" ("listing_id");



CREATE UNIQUE INDEX "listing_views_anonymous_daily_dedup_idx" ON "public"."listing_views" USING "btree" ("listing_id", "viewer_ip", "viewed_on") WHERE (("viewer_id" IS NULL) AND ("viewer_ip" IS NOT NULL));



CREATE INDEX "listing_views_listing_idx" ON "public"."listing_views" USING "btree" ("listing_id", "created_at" DESC);



CREATE UNIQUE INDEX "listing_views_user_daily_dedup_idx" ON "public"."listing_views" USING "btree" ("listing_id", "viewer_id", "viewed_on") WHERE ("viewer_id" IS NOT NULL);



CREATE INDEX "listings_bumped_at_idx" ON "public"."listings" USING "btree" ("bumped_at" DESC NULLS LAST) WHERE ("bumped_at" IS NOT NULL);



CREATE INDEX "listings_city_exact_idx" ON "public"."listings" USING "btree" ("city");



CREATE INDEX "listings_district_exact_idx" ON "public"."listings" USING "btree" ("district");



CREATE INDEX "listings_featured_until_idx" ON "public"."listings" USING "btree" ("featured_until") WHERE ("featured_until" IS NOT NULL);



CREATE INDEX "listings_fraud_score_idx" ON "public"."listings" USING "btree" ("fraud_score") WHERE ("fraud_score" > 0);



CREATE INDEX "listings_highlighted_until_idx" ON "public"."listings" USING "btree" ("highlighted_until") WHERE ("highlighted_until" IS NOT NULL);



CREATE UNIQUE INDEX "listings_license_plate_unique_active_idx" ON "public"."listings" USING "btree" ("license_plate") WHERE (("status" <> ALL (ARRAY['archived'::"public"."listing_status", 'rejected'::"public"."listing_status"])) AND ("license_plate" IS NOT NULL));



CREATE INDEX "listings_published_at_idx" ON "public"."listings" USING "btree" ("published_at") WHERE ("published_at" IS NOT NULL);



CREATE INDEX "listings_search_vector_idx" ON "public"."listings" USING "gin" ("search_vector");



CREATE INDEX "listings_seller_id_idx" ON "public"."listings" USING "btree" ("seller_id");



CREATE INDEX "listings_seller_idx" ON "public"."listings" USING "btree" ("seller_id", "updated_at" DESC);



CREATE UNIQUE INDEX "listings_slug_unique_active_idx" ON "public"."listings" USING "btree" ("slug") WHERE ("status" <> 'archived'::"public"."listing_status");



CREATE INDEX "listings_status_idx" ON "public"."listings" USING "btree" ("status", "updated_at" DESC);



CREATE INDEX "listings_urgent_until_idx" ON "public"."listings" USING "btree" ("urgent_until") WHERE ("urgent_until" IS NOT NULL);



CREATE UNIQUE INDEX "listings_vin_unique_active_idx" ON "public"."listings" USING "btree" ("vin") WHERE ("status" <> ALL (ARRAY['archived'::"public"."listing_status", 'rejected'::"public"."listing_status"]));



CREATE UNIQUE INDEX "market_stats_brand_model_year_idx" ON "public"."market_stats" USING "btree" ("brand", "model", "year") WHERE ("car_trim" IS NULL);



CREATE UNIQUE INDEX "payments_iyzico_token_idx" ON "public"."payments" USING "btree" ("iyzico_token") WHERE ("iyzico_token" IS NOT NULL);



CREATE INDEX "payments_plan_id_idx" ON "public"."payments" USING "btree" ("plan_id") WHERE ("plan_id" IS NOT NULL);



CREATE INDEX "payments_user_id_created_at_idx" ON "public"."payments" USING "btree" ("user_id", "created_at" DESC);



CREATE UNIQUE INDEX "profiles_business_slug_idx" ON "public"."profiles" USING "btree" ("business_slug") WHERE ("business_slug" IS NOT NULL);



CREATE UNIQUE INDEX "reports_active_per_user_listing_idx" ON "public"."reports" USING "btree" ("listing_id", "reporter_id") WHERE ("status" = ANY (ARRAY['open'::"public"."report_status", 'reviewing'::"public"."report_status"]));



CREATE INDEX "reports_status_idx" ON "public"."reports" USING "btree" ("status", "updated_at" DESC);



CREATE OR REPLACE TRIGGER "enforce_message_rate_limit" BEFORE INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."check_message_rate_limit"();



CREATE OR REPLACE TRIGGER "fulfillment_jobs_updated_at" BEFORE UPDATE ON "public"."fulfillment_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_fulfillment_jobs_updated_at"();



CREATE OR REPLACE TRIGGER "listings_protect_status" BEFORE UPDATE ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."protect_listing_status_column"();



CREATE OR REPLACE TRIGGER "listings_set_updated_at" BEFORE UPDATE ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "listings_track_price_change" AFTER UPDATE OF "price" ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."track_listing_price_change"();



CREATE OR REPLACE TRIGGER "messages_touch_chat_last_message_at" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_chat_last_message_at"();



CREATE OR REPLACE TRIGGER "offers_updated_at" BEFORE UPDATE ON "public"."offers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "prevent_credit_transaction_modifications" BEFORE DELETE OR UPDATE ON "public"."credit_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_credit_transaction_updates"();



COMMENT ON TRIGGER "prevent_credit_transaction_modifications" ON "public"."credit_transactions" IS 'Enforces immutability of credit_transactions table (append-only ledger).';



CREATE OR REPLACE TRIGGER "profiles_protect_sensitive_columns" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."protect_profile_sensitive_columns"();



CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "reports_set_updated_at" BEFORE UPDATE ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_custom_roles_updated_at" BEFORE UPDATE ON "public"."custom_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_custom_roles_updated_at"();



CREATE OR REPLACE TRIGGER "set_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_saved_searches_updated_at" BEFORE UPDATE ON "public"."saved_searches" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_tickets_updated_at" BEFORE UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tr_create_fulfillment_jobs" AFTER UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_create_fulfillment_jobs"();



CREATE OR REPLACE TRIGGER "tr_update_chat_last_message_at" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_chat_last_message_at"();



CREATE OR REPLACE TRIGGER "trg_listings_search_vector" BEFORE INSERT OR UPDATE OF "title", "brand", "model", "city", "district", "description" ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_listing_search_vector"();



CREATE OR REPLACE TRIGGER "trigger_protect_quotas" BEFORE DELETE ON "public"."user_quotas" FOR EACH ROW EXECUTE FUNCTION "public"."protect_critical_table"();



ALTER TABLE ONLY "public"."admin_actions"
    ADD CONSTRAINT "admin_actions_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."car_trims"
    ADD CONSTRAINT "car_trims_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."custom_roles"
    ADD CONSTRAINT "custom_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."districts"
    ADD CONSTRAINT "districts_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."doping_applications"
    ADD CONSTRAINT "doping_applications_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."doping_applications"
    ADD CONSTRAINT "doping_applications_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."doping_applications"
    ADD CONSTRAINT "doping_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."doping_purchases"
    ADD CONSTRAINT "doping_purchases_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id");



ALTER TABLE ONLY "public"."doping_purchases"
    ADD CONSTRAINT "doping_purchases_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."doping_packages"("id");



ALTER TABLE ONLY "public"."doping_purchases"
    ADD CONSTRAINT "doping_purchases_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id");



ALTER TABLE ONLY "public"."doping_purchases"
    ADD CONSTRAINT "doping_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fulfillment_jobs"
    ADD CONSTRAINT "fulfillment_jobs_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gallery_views"
    ADD CONSTRAINT "gallery_views_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gallery_views"
    ADD CONSTRAINT "gallery_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ip_banlist"
    ADD CONSTRAINT "ip_banlist_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."listing_images"
    ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_price_history"
    ADD CONSTRAINT "listing_price_history_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_questions"
    ADD CONSTRAINT "listing_questions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_questions"
    ADD CONSTRAINT "listing_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_views"
    ADD CONSTRAINT "listing_views_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_views"
    ADD CONSTRAINT "listing_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."pricing_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."phone_reveal_logs"
    ADD CONSTRAINT "phone_reveal_logs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phone_reveal_logs"
    ADD CONSTRAINT "phone_reveal_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."realized_sales"
    ADD CONSTRAINT "realized_sales_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seller_reviews"
    ADD CONSTRAINT "seller_reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."seller_reviews"
    ADD CONSTRAINT "seller_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."seller_reviews"
    ADD CONSTRAINT "seller_reviews_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."storage_objects_registry"
    ADD CONSTRAINT "storage_objects_registry_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id");



ALTER TABLE ONLY "public"."user_encryption_keys"
    ADD CONSTRAINT "user_encryption_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_quotas"
    ADD CONSTRAINT "user_quotas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_read_writes_tracker"
    ADD CONSTRAINT "user_read_writes_tracker_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_history"
    ADD CONSTRAINT "vehicle_history_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete banlist" ON "public"."ip_banlist" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can insert banlist" ON "public"."ip_banlist" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view abuse logs" ON "public"."contact_abuse_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view banlist" ON "public"."ip_banlist" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Allow public read-only access for car_trims" ON "public"."car_trims" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Allow public read-only access for models" ON "public"."models" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Doping packages are public for read" ON "public"."doping_packages" FOR SELECT USING (true);



CREATE POLICY "Service role can insert abuse logs" ON "public"."contact_abuse_log" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can read banlist" ON "public"."ip_banlist" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Users can update own identity_number" ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update their own reviews" ON "public"."seller_reviews" FOR UPDATE USING (("reviewer_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own identity_number" ON "public"."profiles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."_migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_actions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_actions_admin_only" ON "public"."admin_actions" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "admin_all_webhook_logs" ON "public"."payment_webhook_logs" USING ("public"."is_admin"());



ALTER TABLE "public"."api_rate_limits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "api_rate_limits_service_only" ON "public"."api_rate_limits" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."brands" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brands_select_public" ON "public"."brands" FOR SELECT USING (true);



ALTER TABLE "public"."canonical_search_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."car_trims" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chat_buyer_insert" ON "public"."chats" FOR INSERT WITH CHECK (("buyer_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "chat_participants_select" ON "public"."chats" FOR SELECT USING ((("buyer_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("seller_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "chat_participants_update" ON "public"."chats" FOR UPDATE USING ((("buyer_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("seller_id" = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."chats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cities_select_public" ON "public"."cities" FOR SELECT USING (true);



ALTER TABLE "public"."compensating_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_abuse_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "credit_transactions_select_own" ON "public"."credit_transactions" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR "public"."is_admin"()));



ALTER TABLE "public"."cron_job_logs" ENABLE ROW LEVEL SECURITY;





ALTER TABLE "public"."custom_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "custom_roles_admin_delete" ON "public"."custom_roles" FOR DELETE TO "authenticated" USING ((("is_system" = false) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"public"."user_role"))))));



CREATE POLICY "custom_roles_admin_insert" ON "public"."custom_roles" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "custom_roles_admin_read" ON "public"."custom_roles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "custom_roles_admin_update" ON "public"."custom_roles" FOR UPDATE TO "authenticated" USING ((("is_system" = false) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"public"."user_role"))))));



ALTER TABLE "public"."districts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "districts_select_public" ON "public"."districts" FOR SELECT USING (true);



ALTER TABLE "public"."doping_applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "doping_applications_select_own" ON "public"."doping_applications" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR "public"."is_admin"()));



ALTER TABLE "public"."doping_packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."doping_purchases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "doping_purchases_select" ON "public"."doping_purchases" FOR SELECT USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_admin"() AS "is_admin")));



ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "favorites_delete_own" ON "public"."favorites" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "favorites_insert_own" ON "public"."favorites" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "favorites_select_own" ON "public"."favorites" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."fulfillment_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gallery_views" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "gallery_views_insert_anyone" ON "public"."gallery_views" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "gallery_views"."seller_id") AND ("profiles"."user_type" = 'professional'::"public"."user_type")))));



CREATE POLICY "gallery_views_select_owner_or_admin" ON "public"."gallery_views" FOR SELECT USING ((( SELECT "public"."is_admin"() AS "is_admin") OR ("seller_id" = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."ip_banlist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_images" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "listing_images_delete_owner" ON "public"."listing_images" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_images"."listing_id") AND (("listings"."seller_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"())))));



CREATE POLICY "listing_images_delete_owner_or_admin" ON "public"."listing_images" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_images"."listing_id") AND (("listings"."seller_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_admin"() AS "is_admin"))))));



CREATE POLICY "listing_images_insert_owner" ON "public"."listing_images" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_images"."listing_id") AND (("listings"."seller_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"())))));



CREATE POLICY "listing_images_insert_owner_or_admin" ON "public"."listing_images" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_images"."listing_id") AND (("listings"."seller_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_admin"() AS "is_admin"))))));



CREATE POLICY "listing_images_select_visible" ON "public"."listing_images" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_images"."listing_id") AND (("listings"."status" = 'approved'::"public"."listing_status") OR ("listings"."seller_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_admin"() AS "is_admin"))))));



CREATE POLICY "listing_images_update_owner" ON "public"."listing_images" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_images"."listing_id") AND (("listings"."seller_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"())))));



CREATE POLICY "listing_images_update_owner_or_admin" ON "public"."listing_images" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_images"."listing_id") AND (("listings"."seller_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_admin"() AS "is_admin")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_images"."listing_id") AND (("listings"."seller_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_admin"() AS "is_admin"))))));



ALTER TABLE "public"."listing_price_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_questions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "listing_questions_admin_all_v2" ON "public"."listing_questions" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "listing_questions_insert_asker" ON "public"."listing_questions" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_questions"."listing_id") AND ("listings"."seller_id" <> ( SELECT "auth"."uid"() AS "uid")) AND ("listings"."status" = 'approved'::"public"."listing_status"))))));



CREATE POLICY "listing_questions_select_v3" ON "public"."listing_questions" FOR SELECT USING (("public"."is_admin"() OR (( SELECT "auth"."uid"() AS "uid") = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_questions"."listing_id") AND ("listings"."seller_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR (("status" = 'approved'::"text") AND ("is_public" = true))));



CREATE POLICY "listing_questions_update_owner" ON "public"."listing_questions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_questions"."listing_id") AND ("listings"."seller_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."listing_views" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "listing_views_insert_anyone" ON "public"."listing_views" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE ("listings"."id" = "listing_views"."listing_id"))));



CREATE POLICY "listing_views_select_owner_or_admin" ON "public"."listing_views" FOR SELECT USING ((( SELECT "public"."is_admin"() AS "is_admin") OR (EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_views"."listing_id") AND ("listings"."seller_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."listings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "listings_delete_owner_archived_or_admin" ON "public"."listings" FOR DELETE USING ((((( SELECT "auth"."uid"() AS "uid") = "seller_id") AND ("status" = 'archived'::"public"."listing_status")) OR ( SELECT "public"."is_admin"() AS "is_admin")));



CREATE POLICY "listings_insert_owner_or_admin" ON "public"."listings" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "seller_id") OR ( SELECT "public"."is_admin"() AS "is_admin")));



CREATE POLICY "listings_select_visible" ON "public"."listings" FOR SELECT USING ((("status" = 'approved'::"public"."listing_status") OR (( SELECT "auth"."uid"() AS "uid") = "seller_id") OR ( SELECT "public"."is_admin"() AS "is_admin")));



CREATE POLICY "listings_update_owner_or_admin" ON "public"."listings" FOR UPDATE USING (((( SELECT "auth"."uid"() AS "uid") = "seller_id") OR ( SELECT "public"."is_admin"() AS "is_admin"))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "seller_id") OR ( SELECT "public"."is_admin"() AS "is_admin")));



ALTER TABLE "public"."market_stats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "market_stats_select_all" ON "public"."market_stats" FOR SELECT USING (true);



CREATE POLICY "message_participant_insert" ON "public"."messages" FOR INSERT WITH CHECK ((("sender_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."chats"
  WHERE (("chats"."id" = "messages"."chat_id") AND (("chats"."buyer_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("chats"."seller_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "message_participants_select" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."chats"
  WHERE (("chats"."id" = "messages"."chat_id") AND (("chats"."buyer_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("chats"."seller_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_update_chat_participants" ON "public"."messages" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."chats"
  WHERE (("chats"."id" = "messages"."chat_id") AND ((( SELECT "auth"."uid"() AS "uid") = "chats"."buyer_id") OR (( SELECT "auth"."uid"() AS "uid") = "chats"."seller_id")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."chats"
  WHERE (("chats"."id" = "messages"."chat_id") AND ((( SELECT "auth"."uid"() AS "uid") = "chats"."buyer_id") OR (( SELECT "auth"."uid"() AS "uid") = "chats"."seller_id"))))));



ALTER TABLE "public"."missing_resource_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."models" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notif_prefs_own" ON "public"."notification_preferences" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_delete_own" ON "public"."notifications" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "notifications_insert_service_or_admin" ON "public"."notifications" FOR INSERT WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "notifications_select_own" ON "public"."notifications" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "notifications_update_own" ON "public"."notifications" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "offers_insert" ON "public"."offers" FOR INSERT WITH CHECK ((("buyer_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "offers"."listing_id") AND ("l"."seller_id" <> ( SELECT "auth"."uid"() AS "uid")))))));



COMMENT ON POLICY "offers_insert" ON "public"."offers" IS 'Sadece alıcı teklif verebilir, kendi ilanına teklif veremez.';



CREATE POLICY "offers_select" ON "public"."offers" FOR SELECT USING ((("buyer_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "offers"."listing_id") AND ("l"."seller_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR "public"."is_admin"()));



CREATE POLICY "offers_update_buyer" ON "public"."offers" FOR UPDATE USING ((("buyer_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "offers"."listing_id") AND ("l"."seller_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR "public"."is_admin"()));



ALTER TABLE "public"."payment_webhook_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payments_insert_self" ON "public"."payments" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "payments_select_own" ON "public"."payments" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ( SELECT "public"."is_admin"() AS "is_admin")));



ALTER TABLE "public"."phone_reveal_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "phone_reveal_logs_insert_approved_listing" ON "public"."phone_reveal_logs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "phone_reveal_logs"."listing_id") AND ("listings"."status" = 'approved'::"public"."listing_status")))));



CREATE POLICY "phone_reveal_logs_select_owner_or_admin" ON "public"."phone_reveal_logs" FOR SELECT USING ((( SELECT "public"."is_admin"() AS "is_admin") OR (EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "phone_reveal_logs"."listing_id") AND ("listings"."seller_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."platform_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "platform_settings_admin_delete" ON "public"."platform_settings" FOR DELETE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "platform_settings_admin_update" ON "public"."platform_settings" FOR UPDATE USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "platform_settings_admin_write" ON "public"."platform_settings" FOR INSERT WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "platform_settings_select_all" ON "public"."platform_settings" FOR SELECT USING (true);



CREATE POLICY "price_history_insert_service" ON "public"."listing_price_history" FOR INSERT WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "price_history_select_owner_or_admin" ON "public"."listing_price_history" FOR SELECT USING ((( SELECT "public"."is_admin"() AS "is_admin") OR (EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_price_history"."listing_id") AND ("listings"."seller_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."pricing_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pricing_plans_select_all" ON "public"."pricing_plans" FOR SELECT USING (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_self_or_admin" ON "public"."profiles" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "id") OR ( SELECT "public"."is_admin"() AS "is_admin")));



CREATE POLICY "profiles_select_self_or_admin" ON "public"."profiles" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR "public"."is_admin"()));



CREATE POLICY "profiles_update_self_or_admin" ON "public"."profiles" FOR UPDATE USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR ( SELECT "public"."is_admin"() AS "is_admin"))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "id") OR ( SELECT "public"."is_admin"() AS "is_admin")));



ALTER TABLE "public"."realized_sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reports_insert_self" ON "public"."reports" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "reporter_id"));



CREATE POLICY "reports_select_self_or_admin" ON "public"."reports" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "reporter_id") OR ( SELECT "public"."is_admin"() AS "is_admin")));



CREATE POLICY "reports_update_admin_only" ON "public"."reports" FOR UPDATE USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "roles_admin_all" ON "public"."roles" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."saved_searches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "saved_searches_manage_own" ON "public"."saved_searches" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."security_blacklist_patterns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seller_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "seller_reviews_delete_self" ON "public"."seller_reviews" FOR DELETE USING (((( SELECT "auth"."uid"() AS "uid") = "reviewer_id") OR ( SELECT "public"."is_admin"() AS "is_admin")));



CREATE POLICY "seller_reviews_insert_self" ON "public"."seller_reviews" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "reviewer_id"));



CREATE POLICY "seller_reviews_select_public" ON "public"."seller_reviews" FOR SELECT USING (true);



CREATE POLICY "service_role_only" ON "public"."_migrations" TO "service_role" USING (true);



CREATE POLICY "service_role_only" ON "public"."canonical_search_cache" TO "service_role" USING (true);



CREATE POLICY "service_role_only" ON "public"."compensating_actions" TO "service_role" USING (true);



CREATE POLICY "service_role_only" ON "public"."fulfillment_jobs" TO "service_role" USING (true);



CREATE POLICY "service_role_only" ON "public"."missing_resource_logs" TO "service_role" USING (true);



CREATE POLICY "service_role_only" ON "public"."realized_sales" TO "service_role" USING (true);



CREATE POLICY "service_role_only" ON "public"."security_blacklist_patterns" TO "service_role" USING (true);



CREATE POLICY "service_role_only" ON "public"."transaction_outbox" TO "service_role" USING (true);



CREATE POLICY "service_role_only" ON "public"."user_encryption_keys" TO "service_role" USING (true);



CREATE POLICY "service_role_only" ON "public"."user_quotas" TO "service_role" USING (true);



CREATE POLICY "service_role_only" ON "public"."user_read_writes_tracker" TO "service_role" USING (true);



ALTER TABLE "public"."storage_objects_registry" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "storage_registry_manage_owner" ON "public"."storage_objects_registry" USING (((( SELECT "auth"."uid"() AS "uid") = "owner_id") OR "public"."is_admin"()));



ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tickets_insert_own" ON "public"."tickets" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "tickets_select_own_or_admin" ON "public"."tickets" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ( SELECT "public"."is_admin"() AS "is_admin")));



CREATE POLICY "tickets_update_own_open_or_admin" ON "public"."tickets" FOR UPDATE USING ((((( SELECT "auth"."uid"() AS "uid") = "user_id") AND ("status" = 'open'::"public"."ticket_status")) OR ( SELECT "public"."is_admin"() AS "is_admin"))) WITH CHECK ((((( SELECT "auth"."uid"() AS "uid") = "user_id") AND ("status" = 'open'::"public"."ticket_status")) OR ( SELECT "public"."is_admin"() AS "is_admin")));



ALTER TABLE "public"."transaction_outbox" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_encryption_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_quotas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_read_writes_tracker" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vehicle_history_insert" ON "public"."vehicle_history" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "vehicle_history"."listing_id") AND ("l"."seller_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR "public"."is_admin"()));



CREATE POLICY "vehicle_history_select" ON "public"."vehicle_history" FOR SELECT USING (("listing_id" IN ( SELECT "listings"."id"
   FROM "public"."listings"
  WHERE (("listings"."seller_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"()))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."activate_doping"("p_user_id" "uuid", "p_listing_id" "uuid", "p_package_id" "uuid", "p_payment_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."activate_doping"("p_user_id" "uuid", "p_listing_id" "uuid", "p_package_id" "uuid", "p_payment_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."activate_doping"("p_user_id" "uuid", "p_listing_id" "uuid", "p_package_id" "uuid", "p_payment_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."activate_free_pricing_plan"("p_user_id" "uuid", "p_plan_id" "uuid", "p_plan_name" "text", "p_credits" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."activate_free_pricing_plan"("p_user_id" "uuid", "p_plan_id" "uuid", "p_plan_name" "text", "p_credits" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."activate_free_pricing_plan"("p_user_id" "uuid", "p_plan_id" "uuid", "p_plan_name" "text", "p_credits" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."adjust_user_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "text", "p_metadata" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."adjust_user_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "text", "p_metadata" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."adjust_user_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "text", "p_metadata" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."adjust_user_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "uuid", "p_metadata" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."adjust_user_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "uuid", "p_metadata" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."adjust_user_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_description" "text", "p_reference_id" "uuid", "p_metadata" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."admin_update_ticket"("p_ticket_id" "uuid", "p_status" "text", "p_admin_response" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_update_ticket"("p_ticket_id" "uuid", "p_status" "text", "p_admin_response" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_listing_doping"("p_listing_id" "uuid", "p_user_id" "uuid", "p_doping_types" "text"[], "p_duration_days" integer, "p_payment_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_listing_doping"("p_listing_id" "uuid", "p_user_id" "uuid", "p_doping_types" "text"[], "p_duration_days" integer, "p_payment_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."apply_listing_doping"("p_listing_id" "uuid", "p_user_id" "uuid", "p_doping_types" "text"[], "p_duration_days" integer, "p_payment_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."atomic_moderate_listing"("p_listing_id" "uuid", "p_status" "text", "p_admin_id" "uuid", "p_note" "text", "p_outbox_payload" "jsonb", "p_notification_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."atomic_moderate_listing"("p_listing_id" "uuid", "p_status" "text", "p_admin_id" "uuid", "p_note" "text", "p_outbox_payload" "jsonb", "p_notification_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."atomic_moderate_listing"("p_listing_id" "uuid", "p_status" "text", "p_admin_id" "uuid", "p_note" "text", "p_outbox_payload" "jsonb", "p_notification_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."atomic_moderate_listing"("p_listing_id" "uuid", "p_status" "text", "p_admin_id" "uuid", "p_note" "text", "p_outbox_payload" "jsonb", "p_notification_payload" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."ban_user_atomic"("p_user_id" "uuid", "p_reason" "text", "p_preserve_metadata" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ban_user_atomic"("p_user_id" "uuid", "p_reason" "text", "p_preserve_metadata" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."ban_user_atomic"("p_user_id" "uuid", "p_reason" "text", "p_preserve_metadata" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."check_and_reserve_listing_quota"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_and_reserve_listing_quota"("p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."check_and_reserve_listing_quota"("p_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."check_api_rate_limit"("p_key" "text", "p_limit" integer, "p_window_ms" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_api_rate_limit"("p_key" "text", "p_limit" integer, "p_window_ms" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."check_api_rate_limit"("p_key" "text", "p_limit" integer, "p_window_ms" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."check_api_rate_limit"("p_key" "text", "p_limit" integer, "p_window_ms" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."check_contact_abuse"("p_email" "text", "p_ip" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_contact_abuse"("p_email" "text", "p_ip" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."check_contact_abuse"("p_email" "text", "p_ip" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_contact_abuse"("p_email" "text", "p_ip" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."check_listing_quota_atomic"("p_user_id" "uuid", "p_monthly_limit" integer, "p_yearly_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_listing_quota_atomic"("p_user_id" "uuid", "p_monthly_limit" integer, "p_yearly_limit" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."check_listing_quota_atomic"("p_user_id" "uuid", "p_monthly_limit" integer, "p_yearly_limit" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."check_message_rate_limit"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_message_rate_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_message_rate_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_message_rate_limit"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_expired_rate_limits"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_expired_rate_limits"() TO "service_role";
GRANT ALL ON FUNCTION "public"."cleanup_expired_rate_limits"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."confirm_payment_success"("p_iyzico_token" "text", "p_user_id" "uuid", "p_iyzico_payment_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."confirm_payment_success"("p_iyzico_token" "text", "p_user_id" "uuid", "p_iyzico_payment_id" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."confirm_payment_success"("p_iyzico_token" "text", "p_user_id" "uuid", "p_iyzico_payment_id" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_chat_atomic"("p_listing_id" "uuid", "p_buyer_id" "uuid", "p_seller_id" "uuid", "p_system_message" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_chat_atomic"("p_listing_id" "uuid", "p_buyer_id" "uuid", "p_seller_id" "uuid", "p_system_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_chat_atomic"("p_listing_id" "uuid", "p_buyer_id" "uuid", "p_seller_id" "uuid", "p_system_message" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_fulfillment_job"("p_payment_id" "uuid", "p_job_type" "text", "p_metadata" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_fulfillment_job"("p_payment_id" "uuid", "p_job_type" "text", "p_metadata" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_fulfillment_job"("p_payment_id" "uuid", "p_job_type" "text", "p_metadata" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_listing_with_images"("p_listing_data" "jsonb", "p_images_to_upsert" "jsonb"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_listing_with_images"("p_listing_data" "jsonb", "p_images_to_upsert" "jsonb"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_listing_with_images"("p_listing_data" "jsonb", "p_images_to_upsert" "jsonb"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_listing_with_images"("p_listing_data" "jsonb", "p_images_to_upsert" "jsonb"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_public_ticket"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text", "p_listing_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_public_ticket"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text", "p_listing_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_public_ticket"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text", "p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_public_ticket"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text", "p_listing_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_user_ticket"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text", "p_listing_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_user_ticket"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text", "p_listing_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_user_ticket"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text", "p_listing_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_active_brand_city_combinations"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_active_brand_city_combinations"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_active_brand_city_combinations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_brand_city_combinations"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_active_dopings_for_listing"("p_listing_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_active_dopings_for_listing"("p_listing_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_active_dopings_for_listing"("p_listing_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_dead_letter_jobs"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_dead_letter_jobs"("p_limit" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."get_dead_letter_jobs"("p_limit" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_listings_by_brand_count"("p_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_listings_by_brand_count"("p_status" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_listings_by_brand_count"("p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_listings_by_brand_count"("p_status" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_listings_by_city_count"("p_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_listings_by_city_count"("p_status" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_listings_by_city_count"("p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_listings_by_city_count"("p_status" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_listings_by_status_count"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_listings_by_status_count"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_listings_by_status_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_listings_by_status_count"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_ready_fulfillment_jobs"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_ready_fulfillment_jobs"("p_limit" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."get_ready_fulfillment_jobs"("p_limit" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."increment_compensating_retry"("p_id" "uuid", "p_error" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_compensating_retry"("p_id" "uuid", "p_error" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_compensating_retry"("p_id" "uuid", "p_error" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."increment_listing_view"("target_listing_id" "uuid", "target_viewer_id" "uuid", "target_viewer_ip" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."increment_listing_view"("target_listing_id" "uuid", "target_viewer_id" "uuid", "target_viewer_ip" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."increment_listing_view"("target_listing_id" "uuid", "target_viewer_id" "uuid", "target_viewer_ip" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_listing_view"("target_listing_id" "uuid", "target_viewer_id" "uuid", "target_viewer_ip" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."increment_outbox_retry"("p_id" "uuid", "p_error" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_outbox_retry"("p_id" "uuid", "p_error" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_outbox_retry"("p_id" "uuid", "p_error" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."increment_user_credits"("p_user_id" "uuid", "p_credits" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."increment_user_credits"("p_user_id" "uuid", "p_credits" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."increment_user_credits"("p_user_id" "uuid", "p_credits" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."increment_webhook_attempts"("p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."increment_webhook_attempts"("p_token" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."increment_webhook_attempts"("p_token" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."is_user_banned"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_user_banned"("p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_user_banned"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_banned"("p_user_id" "uuid") TO "anon";



REVOKE ALL ON FUNCTION "public"."is_valid_damage_status_json"("data" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_valid_damage_status_json"("data" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_valid_damage_status_json"("data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_valid_damage_status_json"("data" "jsonb") TO "anon";



REVOKE ALL ON FUNCTION "public"."log_contact_abuse"("p_email" "text", "p_ip" "text", "p_reason" "text", "p_user_agent" "text", "p_metadata" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_contact_abuse"("p_email" "text", "p_ip" "text", "p_reason" "text", "p_user_agent" "text", "p_metadata" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."log_contact_abuse"("p_email" "text", "p_ip" "text", "p_reason" "text", "p_user_agent" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_contact_abuse"("p_email" "text", "p_ip" "text", "p_reason" "text", "p_user_agent" "text", "p_metadata" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."mark_job_failed"("p_job_id" "uuid", "p_error_message" "text", "p_error_details" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_job_failed"("p_job_id" "uuid", "p_error_message" "text", "p_error_details" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."mark_job_failed"("p_job_id" "uuid", "p_error_message" "text", "p_error_details" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."mark_job_processing"("p_job_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_job_processing"("p_job_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."mark_job_processing"("p_job_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."mark_job_success"("p_job_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_job_success"("p_job_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."mark_job_success"("p_job_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."prevent_credit_transaction_updates"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prevent_credit_transaction_updates"() TO "service_role";
GRANT ALL ON FUNCTION "public"."prevent_credit_transaction_updates"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."process_compensating_actions_events"("batch_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."process_compensating_actions_events"("batch_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_compensating_actions_events"("batch_size" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_outbox_events"("batch_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."process_outbox_events"("batch_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_outbox_events"("batch_size" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."process_payment_success"("p_payment_id" "uuid", "p_iyzico_payment_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_payment_success"("p_payment_id" "uuid", "p_iyzico_payment_id" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."process_payment_success"("p_payment_id" "uuid", "p_iyzico_payment_id" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."process_payment_webhook"("p_token" "text", "p_status" "text", "p_iyzico_payment_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_payment_webhook"("p_token" "text", "p_status" "text", "p_iyzico_payment_id" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."process_payment_webhook"("p_token" "text", "p_status" "text", "p_iyzico_payment_id" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."protect_critical_table"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."protect_critical_table"() TO "service_role";
GRANT ALL ON FUNCTION "public"."protect_critical_table"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."protect_listing_status_column"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."protect_listing_status_column"() TO "service_role";
GRANT ALL ON FUNCTION "public"."protect_listing_status_column"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."protect_profile_sensitive_columns"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."protect_profile_sensitive_columns"() TO "service_role";
GRANT ALL ON FUNCTION "public"."protect_profile_sensitive_columns"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."recalibrate_all_market_stats"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."recalibrate_all_market_stats"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."retry_dead_letter_job"("p_job_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."retry_dead_letter_job"("p_job_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."retry_dead_letter_job"("p_job_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."run_expire_old_listings"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."run_expire_old_listings"() TO "service_role";
GRANT ALL ON FUNCTION "public"."run_expire_old_listings"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."soft_delete_message"("p_message_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."soft_delete_message"("p_message_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_message"("p_message_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."soft_delete_profile"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."soft_delete_profile"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."soft_delete_profile"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_profile"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."toggle_chat_archive"("p_chat_id" "uuid", "p_user_id" "uuid", "p_archive" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."toggle_chat_archive"("p_chat_id" "uuid", "p_user_id" "uuid", "p_archive" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."toggle_chat_archive"("p_chat_id" "uuid", "p_user_id" "uuid", "p_archive" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."touch_chat_last_message_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."touch_chat_last_message_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."touch_chat_last_message_at"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."track_listing_price_change"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."track_listing_price_change"() TO "service_role";
GRANT ALL ON FUNCTION "public"."track_listing_price_change"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."trigger_create_fulfillment_jobs"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trigger_create_fulfillment_jobs"() TO "service_role";
GRANT ALL ON FUNCTION "public"."trigger_create_fulfillment_jobs"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_chat_last_message_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_chat_last_message_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_chat_last_message_at"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_custom_roles_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_custom_roles_updated_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_custom_roles_updated_at"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_fulfillment_jobs_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_fulfillment_jobs_updated_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_fulfillment_jobs_updated_at"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_listing_price_indices"("p_brand" "text", "p_model" "text", "p_year" integer, "p_avg_price" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_listing_price_indices"("p_brand" "text", "p_model" "text", "p_year" integer, "p_avg_price" numeric) TO "service_role";
GRANT ALL ON FUNCTION "public"."update_listing_price_indices"("p_brand" "text", "p_model" "text", "p_year" integer, "p_avg_price" numeric) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_listing_search_vector"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_listing_search_vector"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_listing_search_vector"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."upsert_listing_with_images"("p_listing_data" "jsonb", "p_images_to_delete" "text"[], "p_images_to_upsert" "jsonb"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_listing_with_images"("p_listing_data" "jsonb", "p_images_to_delete" "text"[], "p_images_to_upsert" "jsonb"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_listing_with_images"("p_listing_data" "jsonb", "p_images_to_delete" "text"[], "p_images_to_upsert" "jsonb"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_listing_with_images"("p_listing_data" "jsonb", "p_images_to_delete" "text"[], "p_images_to_upsert" "jsonb"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_market_stats"("p_brand" "text", "p_model" "text", "p_year" integer, "p_avg_price" numeric, "p_listing_count" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_market_stats"("p_brand" "text", "p_model" "text", "p_year" integer, "p_avg_price" numeric, "p_listing_count" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."upsert_market_stats"("p_brand" "text", "p_model" "text", "p_year" integer, "p_avg_price" numeric, "p_listing_count" integer) TO "authenticated";



GRANT ALL ON TABLE "public"."_migrations" TO "anon";
GRANT ALL ON TABLE "public"."_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."_migrations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."_migrations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."_migrations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."_migrations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."admin_actions" TO "anon";
GRANT ALL ON TABLE "public"."admin_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_actions" TO "service_role";



GRANT ALL ON TABLE "public"."api_rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."api_rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."api_rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."brands" TO "anon";
GRANT ALL ON TABLE "public"."brands" TO "authenticated";
GRANT ALL ON TABLE "public"."brands" TO "service_role";



GRANT ALL ON TABLE "public"."canonical_search_cache" TO "anon";
GRANT ALL ON TABLE "public"."canonical_search_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."canonical_search_cache" TO "service_role";



GRANT ALL ON TABLE "public"."car_trims" TO "anon";
GRANT ALL ON TABLE "public"."car_trims" TO "authenticated";
GRANT ALL ON TABLE "public"."car_trims" TO "service_role";



GRANT ALL ON TABLE "public"."chats" TO "anon";
GRANT ALL ON TABLE "public"."chats" TO "authenticated";
GRANT ALL ON TABLE "public"."chats" TO "service_role";



GRANT ALL ON TABLE "public"."cities" TO "anon";
GRANT ALL ON TABLE "public"."cities" TO "authenticated";
GRANT ALL ON TABLE "public"."cities" TO "service_role";



GRANT ALL ON TABLE "public"."compensating_actions" TO "anon";
GRANT ALL ON TABLE "public"."compensating_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."compensating_actions" TO "service_role";



GRANT ALL ON TABLE "public"."contact_abuse_log" TO "anon";
GRANT ALL ON TABLE "public"."contact_abuse_log" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_abuse_log" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."cron_job_logs" TO "anon";
GRANT ALL ON TABLE "public"."cron_job_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."cron_job_logs" TO "service_role";



GRANT ALL ON TABLE "public"."custom_roles" TO "anon";
GRANT ALL ON TABLE "public"."custom_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_roles" TO "service_role";



GRANT ALL ON TABLE "public"."districts" TO "anon";
GRANT ALL ON TABLE "public"."districts" TO "authenticated";
GRANT ALL ON TABLE "public"."districts" TO "service_role";



GRANT ALL ON TABLE "public"."doping_applications" TO "anon";
GRANT ALL ON TABLE "public"."doping_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."doping_applications" TO "service_role";



GRANT ALL ON TABLE "public"."doping_packages" TO "anon";
GRANT ALL ON TABLE "public"."doping_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."doping_packages" TO "service_role";



GRANT ALL ON TABLE "public"."doping_purchases" TO "anon";
GRANT ALL ON TABLE "public"."doping_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."doping_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."favorites" TO "anon";
GRANT ALL ON TABLE "public"."favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites" TO "service_role";



GRANT ALL ON TABLE "public"."fulfillment_jobs" TO "anon";
GRANT ALL ON TABLE "public"."fulfillment_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."fulfillment_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."gallery_views" TO "anon";
GRANT ALL ON TABLE "public"."gallery_views" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_views" TO "service_role";



GRANT ALL ON TABLE "public"."ip_banlist" TO "anon";
GRANT ALL ON TABLE "public"."ip_banlist" TO "authenticated";
GRANT ALL ON TABLE "public"."ip_banlist" TO "service_role";



GRANT ALL ON SEQUENCE "public"."listing_display_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."listing_display_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."listing_display_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."listing_images" TO "anon";
GRANT ALL ON TABLE "public"."listing_images" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_images" TO "service_role";



GRANT ALL ON TABLE "public"."listing_price_history" TO "anon";
GRANT ALL ON TABLE "public"."listing_price_history" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_price_history" TO "service_role";



GRANT ALL ON TABLE "public"."listing_questions" TO "anon";
GRANT ALL ON TABLE "public"."listing_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_questions" TO "service_role";



GRANT ALL ON TABLE "public"."listing_views" TO "anon";
GRANT ALL ON TABLE "public"."listing_views" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_views" TO "service_role";



GRANT ALL ON TABLE "public"."listings" TO "anon";
GRANT ALL ON TABLE "public"."listings" TO "authenticated";
GRANT ALL ON TABLE "public"."listings" TO "service_role";



GRANT ALL ON TABLE "public"."market_stats" TO "anon";
GRANT ALL ON TABLE "public"."market_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."market_stats" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."missing_resource_logs" TO "anon";
GRANT ALL ON TABLE "public"."missing_resource_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."missing_resource_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."missing_resource_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."missing_resource_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."missing_resource_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."models" TO "anon";
GRANT ALL ON TABLE "public"."models" TO "authenticated";
GRANT ALL ON TABLE "public"."models" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."offers" TO "anon";
GRANT ALL ON TABLE "public"."offers" TO "authenticated";
GRANT ALL ON TABLE "public"."offers" TO "service_role";



GRANT ALL ON TABLE "public"."payment_webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."payment_webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_webhook_logs" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."phone_reveal_logs" TO "anon";
GRANT ALL ON TABLE "public"."phone_reveal_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."phone_reveal_logs" TO "service_role";



GRANT ALL ON TABLE "public"."platform_settings" TO "anon";
GRANT ALL ON TABLE "public"."platform_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_settings" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_plans" TO "anon";
GRANT ALL ON TABLE "public"."pricing_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_plans" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."public_profiles" TO "anon";
GRANT ALL ON TABLE "public"."public_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."public_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."realized_sales" TO "anon";
GRANT ALL ON TABLE "public"."realized_sales" TO "authenticated";
GRANT ALL ON TABLE "public"."realized_sales" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."saved_searches" TO "anon";
GRANT ALL ON TABLE "public"."saved_searches" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_searches" TO "service_role";



GRANT ALL ON TABLE "public"."security_blacklist_patterns" TO "anon";
GRANT ALL ON TABLE "public"."security_blacklist_patterns" TO "authenticated";
GRANT ALL ON TABLE "public"."security_blacklist_patterns" TO "service_role";



GRANT ALL ON TABLE "public"."seller_reviews" TO "anon";
GRANT ALL ON TABLE "public"."seller_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."seller_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."storage_objects_registry" TO "anon";
GRANT ALL ON TABLE "public"."storage_objects_registry" TO "authenticated";
GRANT ALL ON TABLE "public"."storage_objects_registry" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_outbox" TO "anon";
GRANT ALL ON TABLE "public"."transaction_outbox" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_outbox" TO "service_role";



GRANT ALL ON TABLE "public"."user_encryption_keys" TO "anon";
GRANT ALL ON TABLE "public"."user_encryption_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."user_encryption_keys" TO "service_role";



GRANT ALL ON TABLE "public"."user_quotas" TO "anon";
GRANT ALL ON TABLE "public"."user_quotas" TO "authenticated";
GRANT ALL ON TABLE "public"."user_quotas" TO "service_role";



GRANT ALL ON TABLE "public"."user_read_writes_tracker" TO "anon";
GRANT ALL ON TABLE "public"."user_read_writes_tracker" TO "authenticated";
GRANT ALL ON TABLE "public"."user_read_writes_tracker" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_history" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_history" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_history" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







