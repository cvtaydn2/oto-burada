-- 0082: Ekspertiz Entegrasyonu (OGS/TRAMER)
-- OGS API entegrasyon katmanı + vehicle_history

-- ── listings: add OGS fields ─────────────────────────────────────────
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS tramer_score integer;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS tramer_last_query timestamptz;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS vehicle_history jsonb;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS ogis_report_url text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS last_inspection_date timestamptz;

-- ── vehicle_history table (cache) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehicle_history (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id      uuid REFERENCES listings(id) ON DELETE CASCADE,
    vin             text NOT NULL,
    query_result    jsonb NOT NULL,
    tramer_details jsonb,
    accident_count integer DEFAULT 0,
    ownership_count integer DEFAULT 0,
    last_km         integer,
    queried_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_history_listing
    ON public.vehicle_history(listing_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_history_vin
    ON public.vehicle_history(vin);

COMMENT ON TABLE public.vehicle_history IS
    'OGS/TRAMER araç geçmişi sorgu sonuçları — cache.';

-- ── RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE public.vehicle_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_history_select" ON public.vehicle_history;
CREATE POLICY "vehicle_history_select" ON public.vehicle_history
    FOR SELECT USING (
        listing_id IN (
            SELECT id FROM listings WHERE seller_id = (SELECT auth.uid())
            OR public.is_admin()
        )
    );

DROP POLICY IF EXISTS "vehicle_history_insert" ON public.vehicle_history;
CREATE POLICY "vehicle_history_insert" ON public.vehicle_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM listings l
            WHERE l.id = listing_id AND l.seller_id = (SELECT auth.uid())
        )
        OR public.is_admin()
    );