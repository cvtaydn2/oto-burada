-- ⚡ Bolt: Add database indexes on frequently queried fields
-- Missing indexes on these fields can cause slow sequential scans when filtering or sorting large lists.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_brand_model ON public.listings(brand, model);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
