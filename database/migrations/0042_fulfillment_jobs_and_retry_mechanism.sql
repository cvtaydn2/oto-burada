-- Migration: Fulfillment Jobs & Retry Mechanism
-- Purpose: Add background job processing for payment fulfillments
-- Issues Fixed:
--   1. Webhook timeout risk (Iyzico 30s limit)
--   2. Failed fulfillment retry
--   3. Silent failures
--   4. No observability for failed operations
-- Date: 2026-04-19

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Fulfillment Jobs Table
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS fulfillment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('credit_add', 'doping_apply', 'notification_send')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  error_details JSONB,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for efficient job processing
CREATE INDEX IF NOT EXISTS idx_fulfillment_jobs_status_scheduled 
  ON fulfillment_jobs(status, scheduled_at) 
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_fulfillment_jobs_payment_id 
  ON fulfillment_jobs(payment_id);

CREATE INDEX IF NOT EXISTS idx_fulfillment_jobs_dead_letter 
  ON fulfillment_jobs(status, created_at) 
  WHERE status = 'dead_letter';

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Auto-update updated_at Trigger
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_fulfillment_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$;

DROP TRIGGER IF EXISTS fulfillment_jobs_updated_at ON fulfillment_jobs;

CREATE TRIGGER fulfillment_jobs_updated_at
  BEFORE UPDATE ON fulfillment_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_fulfillment_jobs_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. Create Fulfillment Job Function
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION create_fulfillment_job(
  p_payment_id UUID,
  p_job_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
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
$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Get Ready Jobs Function
-- ══════════════════════════════════════════════════════════════════════════════

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
AS $
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
$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. Mark Job Processing Function
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION mark_job_processing(
  p_job_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
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
$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. Mark Job Success Function
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION mark_job_success(
  p_job_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
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
$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. Mark Job Failed Function (with exponential backoff)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION mark_job_failed(
  p_job_id UUID,
  p_error_message TEXT,
  p_error_details JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
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
$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. Get Dead Letter Jobs Function (for admin monitoring)
-- ══════════════════════════════════════════════════════════════════════════════

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
AS $
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
$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 9. Retry Dead Letter Job Function (manual admin action)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION retry_dead_letter_job(
  p_job_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
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
$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 10. Grant Permissions
-- ══════════════════════════════════════════════════════════════════════════════

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_fulfillment_job TO authenticated;
GRANT EXECUTE ON FUNCTION get_ready_fulfillment_jobs TO authenticated;
GRANT EXECUTE ON FUNCTION mark_job_processing TO authenticated;
GRANT EXECUTE ON FUNCTION mark_job_success TO authenticated;
GRANT EXECUTE ON FUNCTION mark_job_failed TO authenticated;
GRANT EXECUTE ON FUNCTION get_dead_letter_jobs TO authenticated;
GRANT EXECUTE ON FUNCTION retry_dead_letter_job TO authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- 11. Comments for Documentation
-- ══════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE fulfillment_jobs IS 
'Background job queue for payment fulfillments. Supports retry with exponential backoff and dead letter queue.';

COMMENT ON FUNCTION create_fulfillment_job IS 
'Creates a new fulfillment job with idempotency. Returns existing job ID if already exists.';

COMMENT ON FUNCTION get_ready_fulfillment_jobs IS 
'Gets jobs ready for processing with SKIP LOCKED to prevent concurrent processing.';

COMMENT ON FUNCTION mark_job_processing IS 
'Marks a job as processing and increments attempt counter.';

COMMENT ON FUNCTION mark_job_success IS 
'Marks a job as successfully completed.';

COMMENT ON FUNCTION mark_job_failed IS 
'Marks a job as failed with exponential backoff retry or moves to dead letter queue if max attempts reached.';

COMMENT ON FUNCTION get_dead_letter_jobs IS 
'Gets jobs that have failed all retry attempts for admin review.';

COMMENT ON FUNCTION retry_dead_letter_job IS 
'Manually retries a dead letter job (admin action).';

