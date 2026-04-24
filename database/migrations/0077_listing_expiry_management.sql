-- F05: Listing Auto-Archive + Duration Management
-- Adds expires_at column to listings for 60-day expiry management

-- 1. Add expires_at column to listings
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 2. Add listing_status enum value if needed (already exists in schema)
-- The cron job to expire old listings already exists in migration 0009

-- 3. Function to calculate expires_at for new listings (60 days from now)
CREATE OR REPLACE FUNCTION public.get_default_listing_expiry()
RETURNS timestamptz AS $$
BEGIN
  RETURN timezone('utc', now()) + (60 || ' days')::interval;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Trigger to set expires_at on new listing insert
CREATE OR REPLACE FUNCTION public.set_listing_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL AND NEW.status IN ('approved', 'published') THEN
    NEW.expires_at := timezone('utc', now()) + (60 || ' days')::interval;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_listing_expiry_trigger ON public.listings;
CREATE TRIGGER set_listing_expiry_trigger
  BEFORE INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_listing_expiry();

-- 5. Create index for expiry queries
CREATE INDEX IF NOT EXISTS idx_listings_expires_at 
ON public.listings(expires_at) 
WHERE expires_at IS NOT NULL;

-- 6. Add index for status + expires_at queries
CREATE INDEX IF NOT EXISTS idx_listings_status_expires_at 
ON public.listings(status, expires_at) 
WHERE status NOT IN ('archived', 'expired');

COMMENT ON COLUMN public.listings.expires_at IS 'When the listing expires and should be auto-archived';