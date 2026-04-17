-- Migration: Add published_at column and fix listing expiry cron
-- Run this against your Supabase database via the SQL editor or psql
-- Safe to run multiple times (idempotent)

-- 1. Add published_at column to listings
alter table public.listings
  add column if not exists published_at timestamptz;

-- 2. Backfill: for already-approved listings, set published_at = updated_at
--    (best approximation since we don't have the exact approval timestamp)
update public.listings
set published_at = updated_at
where status = 'approved'
  and published_at is null;

-- 3. Index for expiry queries (status + published_at)
create index if not exists idx_listings_published_at
  on public.listings (published_at)
  where status = 'approved';

-- 4. Fix the pg_cron job to use published_at instead of the missing column
--    First drop the old broken job if it exists
do $$
begin
  if exists (select 1 from cron.job where jobname = 'expire-old-listings') then
    perform cron.unschedule('expire-old-listings');
  end if;
exception
  when undefined_table then null;
  when others then null;
end
$$;

-- 5. Re-create the cron job with the correct column
do $$
begin
  perform cron.schedule(
    'expire-old-listings',
    '0 2 * * *',
    $job$
      update public.listings
      set status = 'archived',
          updated_at = timezone('utc', now())
      where status = 'approved'
        and published_at is not null
        and published_at < now() - interval '60 days';
    $job$
  );
exception
  when undefined_table then
    raise notice 'pg_cron not available — skipping cron job creation';
  when others then
    raise notice 'Could not create cron job: %', sqlerrm;
end
$$;

-- 6. Add seller_reviews table if it doesn't exist
create table if not exists public.seller_reviews (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.profiles(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  listing_id  uuid references public.listings(id) on delete set null,
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default timezone('utc', now()),
  -- One review per reviewer per seller
  unique (seller_id, reviewer_id)
);

-- RLS for seller_reviews
alter table public.seller_reviews enable row level security;

-- Policies: drop first to make this script idempotent, then recreate
-- (CREATE POLICY IF NOT EXISTS is not supported in PostgreSQL)
do $$
begin
  drop policy if exists "seller_reviews_select_public"    on public.seller_reviews;
  drop policy if exists "seller_reviews_insert_authenticated" on public.seller_reviews;
  drop policy if exists "seller_reviews_delete_own"       on public.seller_reviews;
end
$$;

create policy "seller_reviews_select_public"
  on public.seller_reviews for select
  using (true);

create policy "seller_reviews_insert_authenticated"
  on public.seller_reviews for insert
  with check (auth.uid() = reviewer_id);

create policy "seller_reviews_delete_own"
  on public.seller_reviews for delete
  using (auth.uid() = reviewer_id);

-- Index for fast seller rating lookups
create index if not exists idx_seller_reviews_seller_id
  on public.seller_reviews (seller_id);
