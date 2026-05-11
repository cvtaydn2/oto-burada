-- Migration: Automated Analytics Aggregation and Reporting Utility
-- Sets up lightweight triggers to keep denormalized listing & profile counters incremented
-- without costly aggregation scans on every view event.

BEGIN;

-- 1. Trigger function for highly efficient incremental updates
CREATE OR REPLACE FUNCTION public.handle_analytics_event_inserted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_views INTEGER;
    v_contacts INTEGER;
BEGIN
    -- Increment Listing Specific counters
    IF NEW.listing_id IS NOT NULL THEN
        IF NEW.event_name = 'listing_view' THEN
            UPDATE listings SET view_count = view_count + 1, updated_at = NOW() WHERE id = NEW.listing_id;
        ELSIF NEW.event_name = 'contact_cta_clicked' THEN
            UPDATE listings SET contact_count = contact_count + 1, updated_at = NOW() WHERE id = NEW.listing_id;
        END IF;
    END IF;

    -- Increment Profile Specific counters & recalculate conversion rate
    IF NEW.seller_id IS NOT NULL THEN
        IF NEW.event_name = 'listing_view' THEN
            UPDATE profiles 
            SET total_listing_views = total_listing_views + 1,
                avg_conversion_rate = ROUND((total_contact_clicks::DECIMAL / NULLIF(total_listing_views + 1, 0)) * 100, 2),
                last_analytics_update = NOW()
            WHERE id = NEW.seller_id;
        ELSIF NEW.event_name = 'contact_cta_clicked' THEN
            UPDATE profiles 
            SET total_contact_clicks = total_contact_clicks + 1,
                avg_conversion_rate = ROUND(((total_contact_clicks + 1)::DECIMAL / NULLIF(total_listing_views, 0)) * 100, 2),
                last_analytics_update = NOW()
            WHERE id = NEW.seller_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Attach Trigger to table
DROP TRIGGER IF EXISTS tr_analytics_event_inserted ON analytics_events;
CREATE TRIGGER tr_analytics_event_inserted
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION handle_analytics_event_inserted();

-- 3. RPC to fetch daily timeseries for charts
CREATE OR REPLACE FUNCTION public.get_seller_daily_activity(p_seller_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    activity_date DATE,
    views BIGINT,
    contacts BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        -- Generate range of dates for consistent axis filling
        SELECT (CURRENT_DATE - (d || ' days')::interval)::DATE AS d_date
        FROM generate_series(0, p_days - 1) d
    ),
    event_counts AS (
        -- Bucket aggregated count by day
        SELECT 
            DATE(created_at) as e_date,
            COUNT(*) FILTER (WHERE event_name = 'listing_view') as daily_views,
            COUNT(*) FILTER (WHERE event_name = 'contact_cta_clicked') as daily_contacts
        FROM analytics_events
        WHERE seller_id = p_seller_id
          AND created_at >= (CURRENT_DATE - (p_days || ' days')::interval)
        GROUP BY DATE(created_at)
    )
    SELECT 
        ds.d_date as activity_date,
        COALESCE(ec.daily_views, 0)::BIGINT as views,
        COALESCE(ec.daily_contacts, 0)::BIGINT as contacts
    FROM date_series ds
    LEFT JOIN event_counts ec ON ds.d_date = ec.e_date
    ORDER BY ds.d_date ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_seller_daily_activity(UUID, INTEGER) TO authenticated;

COMMIT;
