-- Analytics: Privacy-first, free-tier compatible event tracking
-- Uses RLS to ensure users can only write their own events
-- Denormalized aggregates on listings and profiles for fast dashboard queries

BEGIN;

-- Create analytics_events table for raw event ingestion
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_properties JSONB DEFAULT '{}',
    page_url TEXT NOT NULL,
    referrer_url TEXT,
    user_agent TEXT,
    ip_address INET,
    -- Denormalized aggregates for fast dashboard queries
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    -- Indexes for query patterns
    UNIQUE(event_name, created_at, session_id, user_id)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_listing_id ON analytics_events(listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_seller_id ON analytics_events(seller_id) WHERE seller_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id, created_at DESC);

-- Denormalized aggregates on listings for fast view/contact counts
ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS contact_count INTEGER DEFAULT 0;

-- Denormalized aggregates on profiles for fast seller dashboard
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS total_listing_views INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_contact_clicks INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS avg_conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS last_analytics_update TIMESTAMPTZ DEFAULT NOW();

-- Funzione per aggregare metriche per listing
CREATE OR REPLACE FUNCTION aggregate_listing_metrics(p_listing_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE listings l
    SET
        view_count = COALESCE((
            SELECT COUNT(*) FROM analytics_events e
            WHERE e.event_name = 'listing_view'
            AND e.listing_id = l.id
        ), 0),
        contact_count = COALESCE((
            SELECT COUNT(*) FROM analytics_events e
            WHERE e.event_name = 'contact_cta_clicked'
            AND e.listing_id = l.id
        ), 0),
        updated_at = NOW()
    WHERE l.id = p_listing_id;
END;
$$;

-- Funzione per aggregare metriche per seller
CREATE OR REPLACE FUNCTION aggregate_seller_metrics(p_seller_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_views INTEGER;
    v_total_contacts INTEGER;
    v_conversion_rate DECIMAL(5,2);
BEGIN
    SELECT
        COALESCE(SUM(view_count), 0),
        COALESCE(SUM(contact_count), 0)
    INTO v_total_views, v_total_contacts
    FROM listings
    WHERE seller_id = p_seller_id;

    IF v_total_views > 0 THEN
        v_conversion_rate := ROUND((v_total_contacts::DECIMAL / v_total_views) * 100, 2);
    ELSE
        v_conversion_rate := 0.00;
    END IF;

    UPDATE profiles p
    SET
        total_listing_views = v_total_views,
        total_contact_clicks = v_total_contacts,
        avg_conversion_rate = v_conversion_rate,
        last_analytics_update = NOW()
    WHERE p.id = p_seller_id;
END;
$$;

-- RLS policy: Users can only insert their own events (authenticated)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert their own events"
    ON analytics_events FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Service role can insert (for server-side tracking, endpoint uses service_role bypass via supabase client)
CREATE POLICY "Service role can insert all events"
    ON analytics_events FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Read access: service role only (for aggregation functions and admin)
CREATE POLICY "Service role read access"
    ON analytics_events FOR SELECT
    TO service_role
    USING (true);

-- Grant permissions for service role functions
GRANT EXECUTE ON FUNCTION aggregate_listing_metrics(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION aggregate_seller_metrics(UUID) TO service_role;

-- Grant insert on analytics_events to authenticated (for app-side tracking via service role client)
GRANT INSERT ON analytics_events TO authenticated;

-- Grant select for aggregation queries
GRANT SELECT ON analytics_events TO service_role;

-- Comments
COMMENT ON TABLE analytics_events IS 'Privacy-first analytics event ingestion table. User correlation via user_id for authenticated sessions.';
COMMENT ON COLUMN analytics_events.user_id IS 'Authenticated user ID; NULL for guest sessions (tracked by session_id only)';
COMMENT ON COLUMN analytics_events.session_id IS 'Browser session identifier for anonymous and authenticated visit stitching';
COMMENT ON COLUMN analytics_events.event_properties IS 'Event-specific attributes (filter values, CTA type, etc.) as JSONB';
COMMENT ON COLUMN listings.view_count IS 'Denormalized count of listing_view + page_view events';
COMMENT ON COLUMN listings.contact_count IS 'Denormalized count of contact_cta_clicked events';
COMMENT ON COLUMN profiles.total_listing_views IS 'Cached sum of all seller listing view_count aggregates';
COMMENT ON COLUMN profiles.total_contact_clicks IS 'Cached sum of all seller listing contact_count aggregates';
COMMENT ON COLUMN profiles.avg_conversion_rate IS 'Cached conversion rate (contacts/views * 100) for seller dashboard';

COMMIT;