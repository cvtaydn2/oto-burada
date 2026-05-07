-- Harden SECURITY DEFINER functions that should not be callable by anon/authenticated
-- and fix mutable search_path for outbox / compensating job helpers.

-- 1) search_path hardening for helper functions flagged by advisors
ALTER FUNCTION public.process_outbox_events(integer) SET search_path = public;
ALTER FUNCTION public.process_compensating_actions_events(integer) SET search_path = public;
ALTER FUNCTION public.increment_outbox_retry(uuid, text) SET search_path = public;
ALTER FUNCTION public.increment_compensating_retry(uuid, text) SET search_path = public;

-- 2) SECURITY INVOKER view for public profile projection
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id,
  full_name,
  avatar_url,
  city,
  role,
  user_type,
  business_name,
  business_logo_url,
  is_verified,
  is_banned,
  ban_reason,
  verified_business,
  verification_status,
  trust_score,
  business_slug,
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated, service_role;

COMMENT ON VIEW public.public_profiles IS
  'Publicly accessible profile fields. Excludes sensitive data like phone and identity_number for GDPR/KVKK compliance. Uses SECURITY INVOKER semantics.';

-- 3) Revoke anon/authenticated EXECUTE from sensitive SECURITY DEFINER functions.
-- Keep intentionally public RPCs untouched: check_api_rate_limit, check_contact_abuse,
-- log_contact_abuse, increment_listing_view, get_active_brand_city_combinations,
-- get_listings_by_brand_count, get_listings_by_city_count, get_listings_by_status_count,
-- is_valid_damage_status_json, create_public_ticket, is_user_banned, is_admin,
-- get_active_dopings_for_listing.

REVOKE EXECUTE ON FUNCTION public.atomic_moderate_listing(uuid, text, uuid, text, jsonb, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_listing_with_images(jsonb, jsonb[]) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.soft_delete_profile(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_listing_with_images(jsonb, text[], jsonb[]) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_doping(uuid, uuid, uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_user_credits_atomic(uuid, integer, text, text, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_user_credits_atomic(uuid, integer, text, text, uuid, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_listing_doping(uuid, uuid, text[], integer, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_and_reserve_listing_quota(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_listing_quota_atomic(uuid, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_rate_limits() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_payment_success(text, uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_chat_atomic(uuid, uuid, uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_fulfillment_job(uuid, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_user_ticket(text, text, text, text, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_dead_letter_jobs(integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_ready_fulfillment_jobs(integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_user_credits(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_webhook_attempts(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_job_failed(uuid, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_job_processing(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_job_success(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_payment_success(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_payment_webhook(text, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_critical_table() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_listing_status_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_sensitive_columns() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.retry_dead_letter_job(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_expire_old_listings() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.soft_delete_message(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.toggle_chat_archive(uuid, uuid, boolean) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_chat_last_message_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.track_listing_price_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_create_fulfillment_jobs() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_chat_last_message_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_custom_roles_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_listing_price_indices(text, text, integer, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_listing_search_vector() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_market_stats(text, text, integer, numeric, integer) FROM anon, authenticated;
