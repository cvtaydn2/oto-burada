CREATE OR REPLACE FUNCTION public.get_listings_by_brand_count(p_status text DEFAULT 'approved')
RETURNS TABLE(brand text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$

CREATE OR REPLACE FUNCTION public.get_listings_by_city_count(p_status text DEFAULT 'approved')
RETURNS TABLE(city text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$

CREATE OR REPLACE FUNCTION public.get_listings_by_status_count()
RETURNS TABLE(status text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$

CREATE OR REPLACE FUNCTION public.increment_user_credits(
  p_user_id uuid,
  p_credits integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$

CREATE OR REPLACE FUNCTION public.track_listing_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$

CREATE OR REPLACE FUNCTION public.update_listing_price_indices(
  p_brand text,
  p_model text,
  p_year integer,
  p_avg_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$

CREATE OR REPLACE FUNCTION public.upsert_market_stats(
  p_brand         text,
  p_model         text,
  p_year          integer,
  p_avg_price     numeric,
  p_listing_count integer,
  p_min_price     bigint DEFAULT NULL,
  p_max_price     bigint DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$

create or replace function public.cleanup_expired_rate_limits()
returns void
language sql
security definer
set search_path = 'public'
as $$

CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_key text,
  p_limit integer,
  p_window_ms bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$

CREATE OR REPLACE FUNCTION public.run_expire_old_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$

CREATE OR REPLACE FUNCTION public.is_valid_damage_status_json(data jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$

CREATE OR REPLACE FUNCTION public.touch_chat_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$

CREATE OR REPLACE FUNCTION public.update_listing_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$

CREATE OR REPLACE FUNCTION public.update_chat_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.increment_listing_view(
  target_listing_id uuid,
  target_viewer_id uuid DEFAULT NULL,
  target_viewer_ip text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$

CREATE OR REPLACE FUNCTION public.record_listing_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$

CREATE OR REPLACE FUNCTION public.recalibrate_all_market_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.protect_listing_status_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.check_contact_abuse(
  p_email TEXT,
  p_ip TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.log_contact_abuse(
  p_email TEXT,
  p_ip TEXT,
  p_reason TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.create_public_ticket(
  p_subject TEXT,
  p_description TEXT,
  p_category TEXT,
  p_priority TEXT DEFAULT 'medium',
  p_listing_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.create_user_ticket(
  p_subject TEXT,
  p_description TEXT,
  p_category TEXT,
  p_priority TEXT DEFAULT 'medium',
  p_listing_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.admin_update_ticket(
  p_ticket_id UUID,
  p_status TEXT,
  p_admin_response TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION prevent_credit_transaction_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION process_payment_success(
  p_payment_id UUID,
  p_iyzico_payment_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION apply_listing_doping(
  p_listing_id UUID,
  p_user_id UUID,
  p_doping_types TEXT[],
  p_duration_days INTEGER DEFAULT 7,
  p_payment_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION process_payment_webhook(
  p_iyzico_token TEXT,
  p_status TEXT,
  p_iyzico_payment_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION update_fulfillment_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$

CREATE OR REPLACE FUNCTION create_fulfillment_job(
  p_payment_id UUID,
  p_job_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION get_ready_fulfillment_jobs(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  payment_id UUID,
  job_type TEXT,
  attempts INTEGER,
  max_attempts INTEGER,
  metadata JSONB,
  payment_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION mark_job_processing(
  p_job_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION mark_job_success(
  p_job_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION mark_job_failed(
  p_job_id UUID,
  p_error_message TEXT,
  p_error_details JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION get_dead_letter_jobs(
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  payment_id UUID,
  job_type TEXT,
  attempts INTEGER,
  last_error TEXT,
  error_details JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  payment_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION retry_dead_letter_job(
  p_job_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION update_custom_roles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.adjust_user_credits_atomic(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION increment_listing_view_buffered(p_listing_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION sync_listing_views_buffer()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION reserve_listing_atomic(
  p_listing_id UUID,
  p_user_id UUID,
  p_duration_minutes INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.is_user_banned(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.check_interaction_exists(p_user_a UUID, p_user_b UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.validate_idempotency_key(
  p_key TEXT,
  p_ttl_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION protect_critical_table() 
RETURNS TRIGGER AS $$

CREATE OR REPLACE FUNCTION public.activate_free_pricing_plan(
  p_user_id uuid,
  p_plan_id uuid,
  p_plan_name text,
  p_credits integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.activate_doping(
  p_user_id UUID,
  p_listing_id UUID,
  p_package_id UUID,
  p_payment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.get_active_dopings_for_listing(p_listing_id uuid)
RETURNS TABLE (
  doping_type text,
  expires_at timestamptz,
  package_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id uuid,
  p_activity_type text,
  p_metadata jsonb DEFAULT '{}',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.cleanup_old_user_activities()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.expire_dopings_atomic()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.increment_webhook_attempts(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.get_default_listing_expiry()
RETURNS timestamptz AS $$

CREATE OR REPLACE FUNCTION public.set_listing_expiry()
RETURNS TRIGGER AS $$

CREATE OR REPLACE FUNCTION sync_seller_review_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$

CREATE OR REPLACE FUNCTION public.confirm_payment_success(
  p_iyzico_token      text,
  p_user_id           uuid,
  p_iyzico_payment_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.toggle_chat_archive(
  p_chat_id uuid,
  p_user_id uuid,
  p_archive boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.soft_delete_message(
  p_message_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.create_chat_atomic(
  p_listing_id uuid,
  p_buyer_id uuid,
  p_seller_id uuid,
  p_system_message text DEFAULT 'Chat başlatıldı.'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION check_listing_quota_atomic(
  p_user_id     UUID,
  p_monthly_limit INT DEFAULT 2,
  p_yearly_limit  INT DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.get_revenue_stats(p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS TABLE(total_amount NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.get_daily_listing_trend(p_days INTEGER)
RETURNS TABLE(day DATE, count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.process_payment_webhook(
  p_token TEXT,
  p_status TEXT,
  p_iyzico_payment_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.check_and_reserve_listing_quota(
  p_user_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.get_user_listing_stats(
  p_user_id uuid,
  p_start_of_month timestamptz,
  p_start_of_year timestamptz
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION delete_listing_atomic(
  p_listing_id uuid,
  p_version int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.upsert_listing_with_images(
  p_listing_data jsonb,
  p_images_to_delete text[],
  p_images_to_upsert jsonb[]
) RETURNS jsonb AS $$

CREATE OR REPLACE FUNCTION public.apply_listing_doping(
  p_listing_id UUID,
  p_user_id UUID,
  p_doping_types TEXT[],
  p_duration_days INTEGER DEFAULT 7,
  p_payment_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION public.create_listing_with_images(
  p_listing_data jsonb,
  p_images_to_upsert jsonb[]
) RETURNS jsonb AS $$

CREATE OR REPLACE FUNCTION public.atomic_moderate_listing(
  p_listing_id      UUID,
  p_status          TEXT,
  p_admin_id        UUID,
  p_note            TEXT,
  p_outbox_payload  JSONB,
  p_notification_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

CREATE OR REPLACE FUNCTION check_message_rate_limit()
RETURNS TRIGGER AS $$

CREATE OR REPLACE FUNCTION ban_user_atomic(
  p_user_id uuid,
  p_reason text,
  p_preserve_metadata boolean DEFAULT true
)
RETURNS jsonb AS $$

CREATE OR REPLACE FUNCTION process_outbox_events(batch_size INT)
RETURNS TABLE (id UUID, event_type TEXT, payload JSONB)
LANGUAGE plpgsql
AS $$

CREATE OR REPLACE FUNCTION process_compensating_actions_events(batch_size INT)
RETURNS TABLE (id UUID, action_type TEXT, payload JSONB)
LANGUAGE plpgsql
AS $$

CREATE OR REPLACE FUNCTION increment_outbox_retry(p_id UUID, p_error TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$

CREATE OR REPLACE FUNCTION increment_compensating_retry(p_id UUID, p_error TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$

CREATE OR REPLACE FUNCTION public.soft_delete_profile(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$