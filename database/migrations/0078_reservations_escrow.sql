-- 0078: Akıllı Kapora Escrow (OtoPay)
-- reservations + reservation_events tables

-- ── reservation_status enum ──────────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
        CREATE TYPE public.reservation_status AS ENUM (
            'pending_payment','active','completed',
            'cancelled_by_buyer','cancelled_by_seller','expired'
        );
    END IF;
END $$;

-- ── reservations ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reservations (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id          uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id            uuid NOT NULL REFERENCES profiles(id),
    seller_id          uuid NOT NULL REFERENCES profiles(id),
    amount_deposit      numeric(12,2) NOT NULL CHECK (amount_deposit > 0),
    platform_fee        numeric(12,2) NOT NULL DEFAULT 0,
    status              reservation_status NOT NULL DEFAULT 'pending_payment',
    iyzico_payment_id  text,
    appointment_at     timestamptz,
    expires_at         timestamptz NOT NULL,
    notes              text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT reservations_unique_buyer_listing
        UNIQUE (listing_id, buyer_id)
);

CREATE TRIGGER reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE public.reservations IS 'Kapora rezervasyonları — buyer/seller escrow akışı.';

-- ── reservation_events ───────────────────────────────────────────────���──────────
CREATE TABLE IF NOT EXISTS public.reservation_events (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    actor_id       uuid REFERENCES profiles(id),
    event_type     text NOT NULL,
    payload        jsonb DEFAULT '{}',
    created_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.reservation_events IS 'Rezervasyon audit log.';

-- ── Index'ler ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reservations_listing_active
    ON public.reservations(listing_id)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_reservations_buyer
    ON public.reservations(buyer_id);

CREATE INDEX IF NOT EXISTS idx_reservations_expires
    ON public.reservations(expires_at)
    WHERE status NOT IN ('completed','cancelled_by_buyer','cancelled_by_seller');

CREATE INDEX IF NOT EXISTS idx_reservation_events_reservation
    ON public.reservation_events(reservation_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_events ENABLE ROW LEVEL SECURITY;

-- ── Policies: reservations ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "reservations_select" ON public.reservations;
CREATE POLICY "reservations_select" ON public.reservations
    FOR SELECT USING (
        buyer_id = (SELECT auth.uid())
        OR seller_id = (SELECT auth.uid())
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "reservations_insert" ON public.reservations;
CREATE POLICY "reservations_insert" ON public.reservations
    FOR INSERT WITH CHECK (
        buyer_id = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS "reservations_update_by_seller" ON public.reservations;
CREATE POLICY "reservations_update_by_seller" ON public.reservations
    FOR UPDATE USING (
        seller_id = (SELECT auth.uid())
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "reservations_update_by_buyer" ON public.reservations;
CREATE POLICY "reservations_update_by_buyer" ON public.reservations
    FOR UPDATE USING (
        buyer_id = (SELECT auth.uid())
        OR public.is_admin()
    );

-- ── Policies: reservation_events ────────────────────────────────────────────
DROP POLICY IF EXISTS "reservation_events_select" ON public.reservation_events;
CREATE POLICY "reservation_events_select" ON public.reservation_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reservations r
            WHERE r.id = reservation_id
              AND (r.buyer_id = (SELECT auth.uid()) OR r.seller_id = (SELECT auth.uid()))
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "reservation_events_insert" ON public.reservation_events;
CREATE POLICY "reservation_events_insert" ON public.reservation_events
    FOR INSERT WITH CHECK (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.reservations r
            WHERE r.id = reservation_id
              AND (r.buyer_id = (SELECT auth.uid()) OR r.seller_id = (SELECT auth.uid()))
        )
    );

COMMENT ON POLICY "reservations_insert" ON public.reservations IS
    'Sadece alıcı rezervasyon başlatabilir.';
COMMENT ON POLICY "reservations_update_by_seller" ON public.reservations IS
    'Satıcı onaylayabilir/iptal edebilir.';
COMMENT ON POLICY "reservations_update_by_buyer" ON public.reservations IS
    'Alıcı iptal edebilir.';