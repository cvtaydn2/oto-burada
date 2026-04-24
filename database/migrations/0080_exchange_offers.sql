-- 0080: Akıllı Takas Modülü
-- exchange_offers table + takas filter + listing enable column

-- ── listings: add exchange_enabled ──────────────────────────────────────────
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_exchange boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_listings_exchange
    ON public.listings(is_exchange) WHERE is_exchange = true;

-- ── exchange_status enum ──────────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exchange_status') THEN
        CREATE TYPE public.exchange_status AS ENUM (
            'pending','accepted','rejected','completed','cancelled'
        );
    END IF;
END $$;

-- ── exchange_offers table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exchange_offers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id       uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    offerer_id      uuid NOT NULL REFERENCES profiles(id),
    target_listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
    target_car_desc  text NOT NULL,
    target_price    bigint,
    target_brand    text,
    target_model    text,
    target_year     integer,
    target_mileage  integer,
    notes           text,
    status          exchange_status NOT NULL DEFAULT 'pending',
    expires_at      timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER exchange_offers_updated_at
    BEFORE UPDATE ON exchange_offers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE public.exchange_offers IS 'Takas teklifleri — alıcının aracını önerdiği akış.';

-- ── Index ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_exchange_offers_listing
    ON public.exchange_offers(listing_id);

CREATE INDEX IF NOT EXISTS idx_exchange_offers_offerer
    ON public.exchange_offers(offerer_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.exchange_offers ENABLE ROW LEVEL SECURITY;

-- ── Policies ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "exchange_offers_select" ON public.exchange_offers;
CREATE POLICY "exchange_offers_select" ON public.exchange_offers
    FOR SELECT USING (
        offerer_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM listings l
            WHERE l.id = listing_id AND l.seller_id = (SELECT auth.uid())
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "exchange_offers_insert" ON public.exchange_offers;
CREATE POLICY "exchange_offers_insert" ON public.exchange_offers
    FOR INSERT WITH CHECK (
        offerer_id = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS "exchange_offers_update" ON public.exchange_offers;
CREATE POLICY "exchange_offers_update" ON public.exchange_offers
    FOR UPDATE USING (
        offerer_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM listings l
            WHERE l.id = listing_id AND l.seller_id = (SELECT auth.uid())
        )
        OR public.is_admin()
    );

COMMENT ON POLICY "exchange_offers_update" ON public.exchange_offers IS
    'Satıcı onaylayabilir/iptal edebilir, teklif sahibi iptal edebilir.';