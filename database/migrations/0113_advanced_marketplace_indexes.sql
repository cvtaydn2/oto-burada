-- ── PERFORMANCE FIX: Advanced Marketplace Composite Indexes ───
-- Optimization for common filter combinations in the car marketplace

-- 1. Brand & Model deep search
CREATE INDEX IF NOT EXISTS idx_listings_brand_model_status 
ON public.listings (brand, model, status, created_at DESC) 
WHERE status = 'approved';

-- 2. Location deep search (City & District)
CREATE INDEX IF NOT EXISTS idx_listings_city_district_status 
ON public.listings (city, district, status, created_at DESC) 
WHERE status = 'approved';

-- 3. Technical details filter
CREATE INDEX IF NOT EXISTS idx_listings_tech_specs_status 
ON public.listings (fuel_type, transmission, year DESC, status, created_at DESC) 
WHERE status = 'approved';

-- 4. Professional vs Individual filtering
CREATE INDEX IF NOT EXISTS idx_listings_user_type_status 
ON public.listings (status, created_at DESC) 
INCLUDE (seller_id)
WHERE status = 'approved';

-- 5. Price sorting with status
CREATE INDEX IF NOT EXISTS idx_listings_price_status_sort 
ON public.listings (status, price ASC, created_at DESC) 
WHERE status = 'approved';

-- 6. Mileage filtering with status
CREATE INDEX IF NOT EXISTS idx_listings_mileage_status 
ON public.listings (status, mileage ASC, created_at DESC) 
WHERE status = 'approved';
