-- Migration: add-min-max-to-market-stats.sql
ALTER TABLE public.market_stats
  ADD COLUMN IF NOT EXISTS min_price bigint,
  ADD COLUMN IF NOT EXISTS max_price bigint;

-- Update upsert_market_stats to include min/max
CREATE OR REPLACE FUNCTION public.upsert_market_stats(
  p_brand         text,
  p_model         text,
  p_year          integer,
  p_avg_price     numeric,
  p_listing_count integer,
  p_min_price     bigint DEFAULT NULL,
  p_max_price     bigint DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.market_stats
  WHERE brand = p_brand
    AND model = p_model
    AND year  = p_year
    AND car_trim IS NULL;

  INSERT INTO public.market_stats (
    brand, model, year, avg_price, listing_count, min_price, max_price, calculated_at
  )
  VALUES (
    p_brand, p_model, p_year, p_avg_price, p_listing_count, p_min_price, p_max_price, timezone('utc', now())
  );
END;
$$;
