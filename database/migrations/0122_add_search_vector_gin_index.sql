-- 0122_add_search_vector_gin_index.sql
-- PERFORMANCE: Issue PERF-03 - Full-Text Search GIN Index
-- Adds a GIN index on the search_vector column to prevent sequential scans
-- during full-text search queries.

CREATE INDEX IF NOT EXISTS idx_listings_search_vector 
ON public.listings USING GIN (search_vector) 
WHERE status = 'approved';

-- Analyze table to update statistics for the new index
ANALYZE public.listings;
