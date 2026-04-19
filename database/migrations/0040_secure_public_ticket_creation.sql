-- Migration: Secure Public Ticket Creation via RPC
-- Purpose: Replace admin client usage with security definer RPC that respects RLS
-- Issue: createPublicTicket() uses admin client, bypassing RLS entirely

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Security Definer RPC for Public Ticket Creation
-- ══════════════════════════════════════════════════════════════════════════════

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

-- Grant execute to anon (public contact form) and authenticated users
GRANT EXECUTE ON FUNCTION public.create_public_ticket(TEXT, TEXT, TEXT, TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_ticket(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION public.create_public_ticket IS 'Creates a public support ticket (user_id = NULL) via security definer RPC, respecting RLS policies';

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Security Definer RPC for Authenticated User Ticket Creation
-- ══════════════════════════════════════════════════════════════════════════════

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

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.create_user_ticket(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION public.create_user_ticket IS 'Creates an authenticated user support ticket via security definer RPC, respecting RLS policies';

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. Admin Ticket Update RPC (already admin-only, but make it explicit)
-- ══════════════════════════════════════════════════════════════════════════════

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

-- Grant execute to authenticated users (is_admin() check inside function)
GRANT EXECUTE ON FUNCTION public.admin_update_ticket(UUID, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.admin_update_ticket IS 'Admin-only ticket update via security definer RPC';
