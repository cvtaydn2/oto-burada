-- 1. Security: Enable RLS and add policies for internal tables
-- These tables were identified by the security advisor as having RLS enabled but no policies.
-- We restrict access to service_role only for maximum security.

DO $$ 
BEGIN
    -- public.canonical_search_cache
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canonical_search_cache' AND policyname = 'service_role_only') THEN
        CREATE POLICY "service_role_only" ON public.canonical_search_cache FOR ALL USING (auth.role() = 'service_role');
    END IF;

    -- public.compensating_actions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'compensating_actions' AND policyname = 'service_role_only') THEN
        CREATE POLICY "service_role_only" ON public.compensating_actions FOR ALL USING (auth.role() = 'service_role');
    END IF;

    -- public.missing_resource_logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'missing_resource_logs' AND policyname = 'service_role_only') THEN
        CREATE POLICY "service_role_only" ON public.missing_resource_logs FOR ALL USING (auth.role() = 'service_role');
    END IF;

    -- public.security_blacklist_patterns
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_blacklist_patterns' AND policyname = 'service_role_only') THEN
        CREATE POLICY "service_role_only" ON public.security_blacklist_patterns FOR ALL USING (auth.role() = 'service_role');
    END IF;

    -- public.user_encryption_keys
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_encryption_keys' AND policyname = 'service_role_only') THEN
        CREATE POLICY "service_role_only" ON public.user_encryption_keys FOR ALL USING (auth.role() = 'service_role');
    END IF;

    -- public.user_read_writes_tracker
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_read_writes_tracker' AND policyname = 'service_role_only') THEN
        CREATE POLICY "service_role_only" ON public.user_read_writes_tracker FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- 2. Performance: Add missing indexes for foreign keys
-- These were identified by the performance advisor as unindexed foreign keys.

-- custom_roles.created_by
CREATE INDEX IF NOT EXISTS idx_custom_roles_created_by ON public.custom_roles (created_by);

-- doping_applications
CREATE INDEX IF NOT EXISTS idx_doping_applications_payment_id ON public.doping_applications (payment_id);
CREATE INDEX IF NOT EXISTS idx_doping_applications_user_id ON public.doping_applications (user_id);

-- favorites
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON public.favorites (listing_id);

-- gallery_views (if table exists, checking snapshot showed listing_views but advisor mentioned gallery_views)
-- Checking advisor detail: "Table public.gallery_views has a foreign key gallery_views_viewer_id_fkey"
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gallery_views') THEN
        CREATE INDEX IF NOT EXISTS idx_gallery_views_viewer_id ON public.gallery_views (viewer_id);
    END IF;
END $$;

-- ip_banlist
CREATE INDEX IF NOT EXISTS idx_ip_banlist_banned_by ON public.ip_banlist (banned_by);

-- listing_views
CREATE INDEX IF NOT EXISTS idx_listing_views_viewer_id ON public.listing_views (viewer_id);

-- listings
CREATE INDEX IF NOT EXISTS idx_listings_locked_by ON public.listings (locked_by);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_listing_id ON public.payments (listing_id);

-- realized_sales
CREATE INDEX IF NOT EXISTS idx_realized_sales_listing_id ON public.realized_sales (listing_id);

-- reports
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports (reporter_id);

-- seller_reviews
CREATE INDEX IF NOT EXISTS idx_seller_reviews_listing_id ON public.seller_reviews (listing_id);

-- tickets
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_listing_id ON public.tickets (listing_id);

-- 3. Cleanup: Fix duplicate indexes
-- Drop listings_search_vector_gin_idx as it is identical to listings_search_vector_idx
DROP INDEX IF EXISTS public.listings_search_vector_gin_idx;

-- 4. Cleanup: Remove redundant/unused indexes that might be safe to remove
-- The advisor mentioned listings_vin_idx is unused, but we keep it just in case of future unique constraints or searches.
-- However, we can drop idx_listings_status_mileage if it's truly unused and we have others.
-- For now, let's focus on duplicates and missing ones.
