-- Marketplace Composite Indexes for High Performance Filtering
-- Optimization for 'approved' listings which is the most frequent query path.

-- 1. Main marketplace search/filter index
-- Covers status filter + brand/model drill-down + year range + price range
CREATE INDEX IF NOT EXISTS idx_listings_marketplace_composite 
  ON public.listings (status, brand, model, year, price) 
  WHERE status = 'approved';

-- 2. Fuel and Transmission combination filters
-- Covers fuel_type, transmission_type and price sorting/filtering
CREATE INDEX IF NOT EXISTS idx_listings_fuel_transmission_composite
  ON public.listings (status, fuel_type, transmission, price)
  WHERE status = 'approved';

-- 3. Location-based search optimization
-- Covers city/district filters for active listings
CREATE INDEX IF NOT EXISTS idx_listings_location_composite
  ON public.listings (status, city, district, price)
  WHERE status = 'approved';
