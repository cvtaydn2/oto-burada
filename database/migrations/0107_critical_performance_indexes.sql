-- ═══════════════════════════════════════════════════════════════
-- Migration: 0107_critical_performance_indexes
-- Description: Critical performance indexes for N+1 query prevention
-- Issues Fixed: Kritik-04 (N+1 Query), Kritik-05 (Missing Indexes)
-- Date: 2026-04-27
-- ═══════════════════════════════════════════════════════════════

-- ── Issue Kritik-04: N+1 Query Prevention - Listing Images ────
-- Composite index for listing images with cover priority
-- Prevents N+1 queries when fetching listings with images
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_cover 
ON listing_images(listing_id, sort_order) 
WHERE is_cover = true;

-- General listing images index for joins
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id 
ON listing_images(listing_id);

-- ── Issue Kritik-05: Missing Foreign Key Indexes ──────────────

-- Listings table - seller_id (most queried foreign key)
CREATE INDEX IF NOT EXISTS idx_listings_seller_id 
ON listings(seller_id);

-- Listings table - composite index for marketplace queries
-- Covers: status + created_at (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_listings_marketplace 
ON listings(status, created_at DESC) 
WHERE status = 'approved';

-- Listings table - composite index for seller dashboard
-- Covers: seller_id + status + created_at
CREATE INDEX IF NOT EXISTS idx_listings_seller_status 
ON listings(seller_id, status, created_at DESC);

-- Listings table - brand filtering (common in search)
CREATE INDEX IF NOT EXISTS idx_listings_brand 
ON listings(brand) 
WHERE status = 'approved';

-- Listings table - city filtering (common in search)
CREATE INDEX IF NOT EXISTS idx_listings_city 
ON listings(city) 
WHERE status = 'approved';

-- Listings table - composite for brand + model + year (fraud detection)
CREATE INDEX IF NOT EXISTS idx_listings_fraud_comparison 
ON listings(brand, model, year, status);

-- Listings table - slug uniqueness (already exists but ensure it's there)
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_slug_unique 
ON listings(slug);

-- Favorites table - user_id for dashboard queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id 
ON favorites(user_id, created_at DESC);

-- Favorites table - listing_id for reverse lookups
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id 
ON favorites(listing_id);

-- Favorites table - composite for checking if favorited
CREATE INDEX IF NOT EXISTS idx_favorites_user_listing 
ON favorites(user_id, listing_id);

-- Notifications table - user_id + read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, created_at DESC) 
WHERE is_read = false;

-- Payments table - user_id for payment history
CREATE INDEX IF NOT EXISTS idx_payments_user_id 
ON payments(user_id, created_at DESC);

-- Payments table - iyzico_token for callback lookups
CREATE INDEX IF NOT EXISTS idx_payments_iyzico_token 
ON payments(iyzico_token) 
WHERE iyzico_token IS NOT NULL;

-- Payments table - status for pending payment cleanup
CREATE INDEX IF NOT EXISTS idx_payments_pending_cleanup 
ON payments(status, created_at) 
WHERE status IN ('pending', 'processing');

-- Doping applications table - listing_id for active dopings
CREATE INDEX IF NOT EXISTS idx_doping_applications_listing 
ON doping_applications(listing_id, expires_at) 
WHERE expires_at > NOW();

-- Messages table - conversation participants
CREATE INDEX IF NOT EXISTS idx_messages_sender 
ON messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver 
ON messages(receiver_id, created_at DESC);

-- Listing views table - listing_id for view counts
CREATE INDEX IF NOT EXISTS idx_listing_views_listing 
ON listing_views(listing_id, viewed_at DESC);

-- Listing views table - user_id for user history
CREATE INDEX IF NOT EXISTS idx_listing_views_user 
ON listing_views(user_id, viewed_at DESC);

-- ── Performance Optimization: Partial Indexes ─────────────────

-- Active listings only (reduces index size)
CREATE INDEX IF NOT EXISTS idx_listings_active_only 
ON listings(created_at DESC) 
WHERE status IN ('approved', 'pending', 'flagged');

-- Featured listings (for homepage queries)
CREATE INDEX IF NOT EXISTS idx_listings_featured 
ON listings(featured, created_at DESC) 
WHERE status = 'approved' AND featured = true;

-- ── Covering Indexes for Hot Queries ──────────────────────────

-- Marketplace card query covering index
-- Includes all fields needed for listing cards to avoid heap lookups
CREATE INDEX IF NOT EXISTS idx_listings_marketplace_covering 
ON listings(status, created_at DESC) 
INCLUDE (id, slug, title, brand, model, year, price, city, mileage, fuel_type, transmission)
WHERE status = 'approved';

-- ═══════════════════════════════════════════════════════════════
-- Verification Queries
-- ═══════════════════════════════════════════════════════════════

-- Check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Check index sizes:
-- SELECT schemaname, tablename, indexname, 
--        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;
