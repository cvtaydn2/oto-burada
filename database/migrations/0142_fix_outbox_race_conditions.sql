CREATE OR REPLACE FUNCTION process_outbox_events(batch_size INT)
RETURNS TABLE (id UUID, event_type TEXT, payload JSONB)
LANGUAGE plpgsql
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

CREATE OR REPLACE FUNCTION process_compensating_actions_events(batch_size INT)
RETURNS TABLE (id UUID, action_type TEXT, payload JSONB)
LANGUAGE plpgsql
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

CREATE OR REPLACE FUNCTION increment_outbox_retry(p_id UUID, p_error TEXT)
RETURNS VOID
LANGUAGE plpgsql
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

CREATE OR REPLACE FUNCTION increment_compensating_retry(p_id UUID, p_error TEXT)
RETURNS VOID
LANGUAGE plpgsql
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
