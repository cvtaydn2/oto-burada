-- Oto Burada
-- Target Supabase schema for the MVP domain model.
-- Current runtime still uses cookie/local persistence for some flows, but this file
-- describes the intended Postgres + RLS structure the app can migrate onto next.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_type') then
    create type public.user_type as enum ('individual', 'professional');
  end if;

  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('user', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'listing_status') then
    create type public.listing_status as enum ('draft', 'pending', 'approved', 'rejected', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'fuel_type') then
    create type public.fuel_type as enum ('benzin', 'dizel', 'lpg', 'hibrit', 'elektrik');
  end if;

  if not exists (select 1 from pg_type where typname = 'transmission_type') then
    create type public.transmission_type as enum ('manuel', 'otomatik', 'yari_otomatik');
  end if;

  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
  end if;

  if not exists (select 1 from pg_type where typname = 'report_reason') then
    create type public.report_reason as enum ('fake_listing', 'wrong_info', 'spam', 'price_manipulation', 'invalid_eids', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum ('favorite', 'moderation', 'report', 'system');
  end if;

  if not exists (select 1 from pg_type where typname = 'moderation_target_type') then
    create type public.moderation_target_type as enum ('listing', 'report', 'user');
  end if;

  if not exists (select 1 from pg_type where typname = 'moderation_action') then
    create type public.moderation_action as enum ('approve', 'reject', 'review', 'resolve', 'dismiss', 'archive', 'edit');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumtypid = 'public.user_type'::regtype
      and enumlabel = 'staff'
  ) then
    alter type public.user_type add value 'staff';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumtypid = 'public.moderation_target_type'::regtype
      and enumlabel = 'user'
  ) then
    alter type public.moderation_target_type add value 'user';
  end if;

  if not exists (
    select 1 from pg_enum 
    where enumtypid = 'public.moderation_action'::regtype 
    and enumlabel = 'edit'
  ) then
    alter type public.moderation_action add value 'edit';
  end if;
exception
  when duplicate_object then null;
end
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create extension if not exists pg_cron;

-- Automatically archive approved listings older than 30 days
do $$
begin
  if not exists (select 1 from cron.job where jobname = 'expire-old-listings') then
    perform cron.schedule(
      'expire-old-listings',
      '0 2 * * *',
      $job$
        update public.listings
        set status = 'archived',
            updated_at = timezone('utc', now())
        where status = 'approved'
          and published_at < now() - interval '30 days';
      $job$
    );
  end if;
exception
  when undefined_table then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  city text not null default '',
  avatar_url text,
  role public.user_role not null default 'user',
  user_type public.user_type not null default 'individual',
  balance_credits integer not null default 0,
  is_verified boolean not null default false,
  tc_verified_at timestamptz,
  eids_id text unique, -- E-Devlet provider ID
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists business_name text;
alter table public.profiles add column if not exists business_address text;
alter table public.profiles add column if not exists business_logo_url text;
alter table public.profiles add column if not exists business_description text;
alter table public.profiles add column if not exists tax_id text;
alter table public.profiles add column if not exists tax_office text;
alter table public.profiles add column if not exists website_url text;
alter table public.profiles add column if not exists verified_business boolean not null default false;
alter table public.profiles add column if not exists business_slug text;
alter table public.profiles add column if not exists is_banned boolean not null default false;
alter table public.profiles add column if not exists ban_reason text;

create unique index if not exists profiles_business_slug_idx
  on public.profiles (business_slug)
  where business_slug is not null;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique,
  title text not null,
  brand text not null,
  model text not null,
  year integer not null check (year between 1950 and 2100),
  mileage integer not null check (mileage >= 0),
  fuel_type public.fuel_type not null,
  transmission public.transmission_type not null,
  price bigint not null check (price > 0),
  city text not null,
  district text not null,
  description text not null,
  whatsapp_phone text not null,
  vin text,
  license_plate text,
  car_trim text,
  tramer_amount numeric default 0,
  damage_status_json jsonb,
  fraud_score integer not null default 0 check (fraud_score between 0 and 100),
  fraud_reason text,
  status public.listing_status not null default 'pending',
  eids_verification_json jsonb, -- Logs for EİDS verification (owner_check, death_check, etc.)
  market_price_index decimal(12,2), -- Estimated fair market value for comparison
  featured boolean not null default false,
  expert_inspection jsonb,
  published_at timestamptz,
  bumped_at timestamptz,
  featured_until timestamptz,
  urgent_until timestamptz,
  highlighted_until timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Ensure VIN is unique among active listings to prevent cloning
create unique index if not exists listings_vin_active_idx
  on public.listings (vin)
  where status in ('approved', 'pending');

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (listing_id, sort_order)
);

alter table public.listing_images add column if not exists placeholder_blur text;

create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, listing_id)
);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  filters jsonb not null default '{}'::jsonb,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason public.report_reason not null,
  description text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  unique (brand_id, name)
);

-- Car Trims (Levels within a model, e.g., BMW 320i -> M Sport, Sport Line)
CREATE TABLE IF NOT EXISTS public.car_trims (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  name text not null,
  slug text not null,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(model_id, name)
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  plate_code integer not null unique
);

create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  name text not null,
  slug text not null,
  is_active boolean not null default true
);


create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.moderation_target_type not null,
  target_id uuid not null,
  action public.moderation_action not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);


create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount decimal(12,2) not null,
  currency text not null default 'TRY',
  provider text not null, -- 'stripe', 'iyzico', 'manual'
  status text not null, -- 'pending', 'completed', 'failed'
  description text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price decimal(12,2) not null,
  credits integer not null,
  features jsonb,
  is_active boolean not null default true
);

alter table public.payments enable row level security;
alter table public.pricing_plans enable row level security;

create policy "payments_select_own" on public.payments for select using ((select auth.uid()) = user_id or (select public.is_admin()));
create policy "pricing_plans_select_all" on public.pricing_plans for select using (true);

create table if not exists public.eids_audit_logs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  verified_by uuid not null references public.profiles (id),
  verification_method text not null, -- 'e-devlet', 'manual'
  status text not null, -- 'success', 'denied'
  raw_response jsonb, -- Sanitized response from gov gateway
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.market_stats (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  year integer not null,
  avg_price decimal(12,2) not null,
  listing_count integer not null,
  calculated_at timestamptz not null default timezone('utc', now())
);

alter table public.eids_audit_logs enable row level security;
alter table public.market_stats enable row level security;

create policy "eids_audit_select_admin" on public.eids_audit_logs for select using ((select public.is_admin()));
create policy "market_stats_select_all" on public.market_stats for select using (true);

create unique index if not exists reports_active_per_user_listing_idx
  on public.reports (listing_id, reporter_id)
  where status in ('open', 'reviewing');

create index if not exists listings_status_idx on public.listings (status, updated_at desc);
create index if not exists listings_seller_idx on public.listings (seller_id, updated_at desc);
create index if not exists saved_searches_user_idx on public.saved_searches (user_id, updated_at desc);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists reports_status_idx on public.reports (status, updated_at desc);
create index if not exists listing_images_listing_idx on public.listing_images (listing_id, sort_order);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
before update on public.listings
for each row
execute function public.set_updated_at();

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
before update on public.reports
for each row
execute function public.set_updated_at();

drop trigger if exists saved_searches_set_updated_at on public.saved_searches;
create trigger saved_searches_set_updated_at
before update on public.saved_searches
for each row
execute function public.set_updated_at();

drop trigger if exists notifications_set_updated_at on public.notifications;
create trigger notifications_set_updated_at
before update on public.notifications
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.favorites enable row level security;
alter table public.saved_searches enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.admin_actions enable row level security;
alter table public.brands enable row level security;
alter table public.models enable row level security;
alter table public.cities enable row level security;
alter table public.districts enable row level security;

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint chats_distinct_participants check (buyer_id <> seller_id),
  constraint chats_unique_listing_pair unique (listing_id, buyer_id, seller_id)
);

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles
for select
using (
  (select auth.uid()) = id
  or (select public.is_admin())
  or exists (
    select 1
    from public.chats
    where ((select auth.uid()) = chats.buyer_id or (select auth.uid()) = chats.seller_id)
      and (public.profiles.id = chats.buyer_id or public.profiles.id = chats.seller_id)
  )
);

drop policy if exists "brands_select_public" on public.brands;
create policy "brands_select_public" on public.brands for select using (true);

drop policy if exists "models_select_public" on public.models;
create policy "models_select_public" on public.models for select using (true);

drop policy if exists "cities_select_public" on public.cities;
create policy "cities_select_public" on public.cities for select using (true);

drop policy if exists "districts_select_public" on public.districts;
create policy "districts_select_public" on public.districts for select using (true);

drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
create policy "profiles_insert_self_or_admin"
on public.profiles
for insert
with check ((select auth.uid()) = id or (select public.is_admin()));

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
using ((select auth.uid()) = id or (select public.is_admin()))
with check ((select auth.uid()) = id or (select public.is_admin()));

drop policy if exists "listings_select_visible" on public.listings;
create policy "listings_select_visible"
on public.listings
for select
using (status = 'approved' or (select auth.uid()) = seller_id or (select public.is_admin()));

drop policy if exists "listings_insert_owner_or_admin" on public.listings;
create policy "listings_insert_owner_or_admin"
on public.listings
for insert
with check ((select auth.uid()) = seller_id or (select public.is_admin()));

drop policy if exists "listings_update_owner_or_admin" on public.listings;
create policy "listings_update_owner_or_admin"
on public.listings
for update
using ((select auth.uid()) = seller_id or (select public.is_admin()))
with check ((select auth.uid()) = seller_id or (select public.is_admin()));

drop policy if exists "listing_images_select_visible" on public.listing_images;
create policy "listing_images_select_visible"
on public.listing_images
for select
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and (listings.status = 'approved' or listings.seller_id = (select auth.uid()) or (select public.is_admin()))
  )
);

drop policy if exists "listing_images_manage_owner_or_admin" on public.listing_images;
create policy "listing_images_manage_owner_or_admin"
on public.listing_images
for all
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and (listings.seller_id = (select auth.uid()) or (select public.is_admin()))
  )
)
with check (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and (listings.seller_id = (select auth.uid()) or (select public.is_admin()))
  )
);

drop policy if exists "favorites_manage_own" on public.favorites;
create policy "favorites_manage_own"
on public.favorites
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "saved_searches_manage_own" on public.saved_searches;
create policy "saved_searches_manage_own"
on public.saved_searches
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "notifications_manage_own" on public.notifications;
create policy "notifications_manage_own"
on public.notifications
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "reports_select_self_or_admin" on public.reports;
create policy "reports_select_self_or_admin"
on public.reports
for select
using ((select auth.uid()) = reporter_id or (select public.is_admin()));

drop policy if exists "reports_insert_self" on public.reports;
create policy "reports_insert_self"
on public.reports
for insert
with check ((select auth.uid()) = reporter_id);

drop policy if exists "reports_update_admin_only" on public.reports;
create policy "reports_update_admin_only"
on public.reports
for update
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "admin_actions_admin_only" on public.admin_actions;
create policy "admin_actions_admin_only"
on public.admin_actions
for all
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Storage intent:
-- 1. Create a public-read bucket named `listing-images` for listing media.
-- 2. Create a private bucket named `listing-documents` for ekspertiz and similar documents.
-- 3. Optionally create an `avatars` bucket for profile images.
-- 4. Enforce JPG/PNG/WebP/PDF validation from the application layer and serve documents via signed URLs.

-- ── B-09: Full-Text Search ──────────────────────────────────────────────
-- Generated tsvector column for fast text search across listing fields.

alter table public.listings add column if not exists
  search_vector tsvector generated always as (
    to_tsvector('simple',
      coalesce(title, '') || ' ' ||
      coalesce(brand, '') || ' ' ||
      coalesce(model, '') || ' ' ||
      coalesce(city, '')  || ' ' ||
      coalesce(district, '') || ' ' ||
      coalesce(description, '')
    )
  ) stored;

create index if not exists listings_search_vector_idx
  on public.listings using gin (search_vector);

-- Additional performance indexes for filtering
create index if not exists listings_brand_idx on public.listings (brand);
create index if not exists listings_city_idx on public.listings (city);
create index if not exists listings_price_idx on public.listings (price);
create index if not exists listings_year_idx on public.listings (year);
create index if not exists listings_mileage_idx on public.listings (mileage);

-- ── B-08: Listing View Counter ──────────────────────────────────────────

create table if not exists public.listing_views (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  viewer_id uuid references public.profiles (id) on delete set null,
  viewer_ip text,
  viewed_on date not null default current_date,
  created_at timestamptz not null default timezone('utc', now())
);

drop index if exists listing_views_user_dedup_idx;

create unique index if not exists listing_views_user_daily_dedup_idx
  on public.listing_views (listing_id, viewer_id, viewed_on)
  where viewer_id is not null;

create unique index if not exists listing_views_anonymous_daily_dedup_idx
  on public.listing_views (listing_id, viewer_ip, viewed_on)
  where viewer_id is null and viewer_ip is not null;

create index if not exists listing_views_listing_idx
  on public.listing_views (listing_id, created_at desc);

-- Materialized count for fast reads (optional, can use COUNT() directly for MVP)
alter table public.listings add column if not exists view_count integer not null default 0;

alter table public.listing_views enable row level security;

-- Anyone can insert a view (anonymous or authenticated)
drop policy if exists "listing_views_insert_anyone" on public.listing_views;
create policy "listing_views_insert_anyone"
on public.listing_views
for insert
with check (true);

-- Only admins and listing owners can read views
drop policy if exists "listing_views_select_owner_or_admin" on public.listing_views;
create policy "listing_views_select_owner_or_admin"
on public.listing_views
for select
using (
  public.is_admin() or
  exists (
    select 1 from public.listings
    where listings.id = listing_views.listing_id
      and listings.seller_id = (select auth.uid())
  )
);

-- ── B-12: Listing Delete Policies ───────────────────────────────────────

drop policy if exists "listings_delete_owner_archived_or_admin" on public.listings;
create policy "listings_delete_owner_archived_or_admin"
on public.listings
for delete
using (
  ((select auth.uid()) = seller_id and status = 'archived')
  or (select public.is_admin())
);

-- ── B-12: Storage Bucket Policies ───────────────────────────────────────
-- These are created via Supabase Dashboard or SQL. Listed here for documentation.
--
-- Bucket: listing-images (public read)
--
-- INSERT policy: Users can upload to their own folder
--   bucket_id = 'listing-images'
--   (storage.foldername(name))[1] = 'listings'
--   AND (storage.foldername(name))[2] = auth.uid()::text
--
-- DELETE policy: Users can delete from their own folder
--   bucket_id = 'listing-images'
--   (storage.foldername(name))[1] = 'listings'
--   AND (storage.foldername(name))[2] = auth.uid()::text
--
-- SELECT policy: Public read
--   bucket_id = 'listing-images'
--   true

-- ── Performance: Composite Indexes ─────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_listings_brand ON public.listings(brand);
CREATE INDEX IF NOT EXISTS idx_listings_model ON public.listings(model);
CREATE INDEX IF NOT EXISTS idx_listings_car_trim ON public.listings(car_trim);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_status_price ON public.listings (status, price);
CREATE INDEX IF NOT EXISTS idx_listings_status_year ON public.listings (status, year);
CREATE INDEX IF NOT EXISTS idx_listings_status_mileage ON public.listings (status, mileage);
CREATE INDEX IF NOT EXISTS idx_listings_status_created_at ON public.listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_status_fuel_type ON public.listings (status, fuel_type);
CREATE INDEX IF NOT EXISTS idx_listings_status_transmission ON public.listings (status, transmission);
CREATE INDEX IF NOT EXISTS idx_listings_seller_id_status ON public.listings (seller_id, status);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status, created_at DESC);

drop policy if exists "Allow public read-only access for models" on public.models;
CREATE POLICY "Allow public read-only access for models" ON public.models
  FOR SELECT USING (is_active = true);

-- Policies for car_trims
ALTER TABLE public.car_trims ENABLE ROW LEVEL SECURITY;
drop policy if exists "Allow public read-only access for car_trims" on public.car_trims;
CREATE POLICY "Allow public read-only access for car_trims" ON public.car_trims
  FOR SELECT USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_models_brand_id ON public.models (brand_id);
CREATE INDEX IF NOT EXISTS idx_districts_city_id ON public.districts (city_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_user_id ON public.admin_actions (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_notifications_unread_user ON public.notifications (user_id) WHERE read = false;

-- Ticket / Support System

do $$
begin
  if not exists (select 1 from pg_type where typname = 'ticket_status') then
    create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'ticket_priority') then
    create type public.ticket_priority as enum ('low', 'medium', 'high', 'urgent');
  end if;

  if not exists (select 1 from pg_type where typname = 'ticket_category') then
    create type public.ticket_category as enum ('listing', 'account', 'payment', 'technical', 'feedback', 'other');
  end if;
end
$$;

CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category public.ticket_category NOT NULL DEFAULT 'other',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  status public.ticket_status NOT NULL DEFAULT 'open',
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  admin_response text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

drop policy if exists "Users can view their own tickets" on public.tickets;
CREATE POLICY "Users can view their own tickets"
  ON public.tickets FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

drop policy if exists "Authenticated users can create tickets" on public.tickets;
CREATE POLICY "Authenticated users can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

drop policy if exists "Users can update their own open tickets" on public.tickets;
CREATE POLICY "Users can update their own open tickets"
  ON public.tickets FOR UPDATE
  USING (auth.uid() = user_id AND status = 'open')
  WITH CHECK (auth.uid() = user_id AND status = 'open');

drop policy if exists "Admins can update any ticket" on public.tickets;
CREATE POLICY "Admins can update any ticket"
  ON public.tickets FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

drop trigger if exists set_tickets_updated_at on public.tickets;
CREATE TRIGGER set_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets (priority);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint chats_distinct_participants check (buyer_id <> seller_id),
  constraint chats_unique_listing_pair unique (listing_id, buyer_id, seller_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_chats_buyer_last_message_at on public.chats (buyer_id, last_message_at desc);
create index if not exists idx_chats_seller_last_message_at on public.chats (seller_id, last_message_at desc);
create index if not exists idx_messages_chat_created_at on public.messages (chat_id, created_at asc);

alter table public.chats enable row level security;
alter table public.messages enable row level security;

drop policy if exists "chats_select_participants" on public.chats;
create policy "chats_select_participants"
on public.chats
for select
using ((select auth.uid()) in (buyer_id, seller_id));

drop policy if exists "chats_insert_participants" on public.chats;
create policy "chats_insert_participants"
on public.chats
for insert
with check (
  (select auth.uid()) = buyer_id
  or (select auth.uid()) = seller_id
);

drop policy if exists "messages_select_chat_participants" on public.messages;
create policy "messages_select_chat_participants"
on public.messages
for select
using (
  exists (
    select 1
    from public.chats
    where chats.id = messages.chat_id
      and (select auth.uid()) in (chats.buyer_id, chats.seller_id)
  )
);

drop policy if exists "messages_insert_chat_participants" on public.messages;
create policy "messages_insert_chat_participants"
on public.messages
for insert
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1
    from public.chats
    where chats.id = messages.chat_id
      and (select auth.uid()) in (chats.buyer_id, chats.seller_id)
  )
);

drop policy if exists "messages_update_chat_participants" on public.messages;
create policy "messages_update_chat_participants"
on public.messages
for update
using (
  exists (
    select 1
    from public.chats
    where chats.id = messages.chat_id
      and (select auth.uid()) in (chats.buyer_id, chats.seller_id)
  )
)
with check (
  exists (
    select 1
    from public.chats
    where chats.id = messages.chat_id
      and (select auth.uid()) in (chats.buyer_id, chats.seller_id)
  )
);

create or replace function public.touch_chat_last_message_at()
returns trigger
language plpgsql
as $$
begin
  update public.chats
  set last_message_at = new.created_at
  where id = new.chat_id;

  return new;
end;
$$;

drop trigger if exists messages_touch_chat_last_message_at on public.messages;
create trigger messages_touch_chat_last_message_at
after insert on public.messages
for each row
execute function public.touch_chat_last_message_at();

-- ── Seller Reviews ───────────────────────────────────────────────────────
-- Table already exists in production; schema documented here for new-env bootstrap.

create table if not exists public.seller_reviews (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint seller_reviews_unique_per_listing unique (reviewer_id, listing_id)
);

create index if not exists idx_seller_reviews_seller_id on public.seller_reviews (seller_id);
create index if not exists idx_seller_reviews_reviewer_id on public.seller_reviews (reviewer_id);

alter table public.seller_reviews enable row level security;

drop policy if exists "seller_reviews_select_public" on public.seller_reviews;
create policy "seller_reviews_select_public"
  on public.seller_reviews for select using (true);

drop policy if exists "seller_reviews_insert_self" on public.seller_reviews;
create policy "seller_reviews_insert_self"
  on public.seller_reviews for insert
  with check ((select auth.uid()) = reviewer_id);

drop policy if exists "seller_reviews_delete_self" on public.seller_reviews;
create policy "seller_reviews_delete_self"
  on public.seller_reviews for delete
  using ((select auth.uid()) = reviewer_id or (select public.is_admin()));

