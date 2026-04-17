-- Analytics aggregation RPC functions
-- These replace the in-memory GROUP BY done in getAdminAnalytics().
-- Run once against your Supabase project via the SQL editor or migration tool.

-- Brand count by status
create or replace function public.get_listings_by_brand_count(p_status text default 'approved')
returns table(brand text, count bigint)
language sql
stable
security definer
as $$
  select brand, count(*) as count
  from public.listings
  where status = p_status::public.listing_status
  group by brand
  order by count desc
  limit 10;
$$;

-- City count by status
create or replace function public.get_listings_by_city_count(p_status text default 'approved')
returns table(city text, count bigint)
language sql
stable
security definer
as $$
  select city, count(*) as count
  from public.listings
  where status = p_status::public.listing_status
  group by city
  order by count desc
  limit 10;
$$;

-- Status breakdown across all listings
create or replace function public.get_listings_by_status_count()
returns table(status text, count bigint)
language sql
stable
security definer
as $$
  select status::text, count(*) as count
  from public.listings
  group by status;
$$;

-- Grant execute to authenticated and service role
grant execute on function public.get_listings_by_brand_count(text) to authenticated, service_role;
grant execute on function public.get_listings_by_city_count(text) to authenticated, service_role;
grant execute on function public.get_listings_by_status_count() to authenticated, service_role;
