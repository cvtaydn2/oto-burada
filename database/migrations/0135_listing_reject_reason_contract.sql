-- listing_reject_reason_contract
-- UP

ALTER TABLE public.admin_actions
ADD COLUMN IF NOT EXISTS reason_code text;

CREATE OR REPLACE FUNCTION public.atomic_moderate_listing(
  p_listing_id uuid,
  p_status text,
  p_admin_id uuid,
  p_note text,
  p_reason_code text DEFAULT NULL,
  p_outbox_payload jsonb DEFAULT '{}'::jsonb,
  p_notification_payload jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
AS $$
DECLARE
  v_listing RECORD;
  v_action_id UUID;
  v_outbox_id UUID;
  v_notif_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Security violation: Admin access required.';
  END IF;

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

  INSERT INTO public.admin_actions (
    action,
    admin_user_id,
    note,
    reason_code,
    target_id,
    target_type
  ) VALUES (
    CASE WHEN p_status = 'approved' THEN 'approve' ELSE 'reject' END,
    p_admin_id,
    p_note,
    CASE WHEN p_status = 'rejected' THEN p_reason_code ELSE NULL END,
    p_listing_id,
    'listing'
  ) RETURNING id INTO v_action_id;

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

REVOKE EXECUTE ON FUNCTION public.atomic_moderate_listing(
  uuid,
  text,
  uuid,
  text,
  text,
  jsonb,
  jsonb
) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_moderate_listing(
  uuid,
  text,
  uuid,
  text,
  text,
  jsonb,
  jsonb
) TO service_role;

-- DOWN
ALTER TABLE public.admin_actions
DROP COLUMN IF EXISTS reason_code;
