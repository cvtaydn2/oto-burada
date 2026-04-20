-- Migration: Concurrency and Race Condition Protection
-- Purpose: Implement safe booking/reservation logic using SELECT FOR UPDATE.
-- Date: 2026-04-21

-- Add reservation status to listings if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_reservation_status') THEN
    CREATE TYPE listing_reservation_status AS ENUM ('available', 'reserved', 'sold');
  END IF;
END $$;

-- Track reservations
CREATE TABLE IF NOT EXISTS listing_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PILL: Issue 10 - Atomic Reservation with Pessimistic Locking ──────────────
-- Prevents two people from paying for the same car simultaneously.
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
DECLARE
  v_listing RECORD;
  v_reservation_id UUID;
BEGIN
  -- 1. Lock the listing row strictly (SELECT FOR UPDATE)
  -- This blocks other transactions until this one finishes.
  SELECT * INTO v_listing
  FROM listings
  WHERE id = p_listing_id
  FOR UPDATE; 

  -- 2. Check availability
  IF v_listing.status != 'published' THEN
    RETURN jsonb_build_object('success', false, 'error', 'İlan şu an müsait değil.');
  END IF;

  -- 3. Check for existing active reservations
  IF EXISTS (
    SELECT 1 FROM listing_reservations 
    WHERE listing_id = p_listing_id 
      AND status = 'confirmed' 
      AND expires_at > NOW()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bu araç şu an bir başkası tarafından rezerve edilmiş.');
  END IF;

  -- 4. Create reservation
  INSERT INTO listing_reservations (listing_id, user_id, expires_at)
  VALUES (p_listing_id, p_user_id, NOW() + (p_duration_minutes || ' minutes')::INTERVAL)
  RETURNING id INTO v_reservation_id;

  -- 5. Optional: Emit event or update listing status to 'reserved' (denormalization)
  -- UPDATE listings SET reservation_status = 'reserved' WHERE id = p_listing_id;

  RETURN jsonb_build_object(
    'success', true, 
    'reservation_id', v_reservation_id, 
    'expires_at', NOW() + (p_duration_minutes || ' minutes')::INTERVAL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION reserve_listing_atomic TO authenticated;
