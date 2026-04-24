-- 0083: Teklif / Fiyat Müzakere Akışı
-- offers table

-- ── offer_status enum ───────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status') THEN
        CREATE TYPE public.offer_status AS ENUM (
            'pending','accepted','rejected','counter_offer','expired','completed'
        );
    END IF;
END $$;

-- ── offers table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.offers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id      uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id        uuid NOT NULL REFERENCES profiles(id),
    offered_price   bigint NOT NULL CHECK (offered_price > 0),
    message         text,
    status          offer_status NOT NULL DEFAULT 'pending',
    counter_price   bigint,
    counter_message text,
    expires_at      timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE public.offers IS
    'Fiyat teklif akışı — alıcı teklif verir, satıcı kabul/red/karşı teklif yapar.';

-- ── Index ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_offers_listing
    ON public.offers(listing_id);

CREATE INDEX IF NOT EXISTS idx_offers_buyer
    ON public.offers(buyer_id);

CREATE INDEX IF NOT EXISTS idx_offers_seller
    ON public.offers(listing_id, status);

-- ── RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offers_select" ON public.offers;
CREATE POLICY "offers_select" ON public.offers
    FOR SELECT USING (
        buyer_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM listings l
            WHERE l.id = listing_id AND l.seller_id = (SELECT auth.uid())
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "offers_insert" ON public.offers;
CREATE POLICY "offers_insert" ON public.offers
    FOR INSERT WITH CHECK (
        buyer_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1 FROM listings l
            WHERE l.id = listing_id AND l.seller_id <> (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "offers_update_buyer" ON public.offers;
CREATE POLICY "offers_update_buyer" ON public.offers
    FOR UPDATE USING (
        buyer_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM listings l
            WHERE l.id = listing_id AND l.seller_id = (SELECT auth.uid())
        )
        OR public.is_admin()
    );

COMMENT ON POLICY "offers_insert" ON public.offers IS
    'Sadece alıcı teklif verebilir, kendi ilanına teklif veremez.';