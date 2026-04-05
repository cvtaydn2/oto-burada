-- Oto Burada
-- Target Supabase schema for the MVP domain model.
-- Current runtime still uses cookie/local persistence for some flows, but this file
-- describes the intended Postgres + RLS structure the app can migrate onto next.

create extension if not exists pgcrypto;

do $$
begin
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

  if not exists (select 1 from pg_type where typname = 'report_reason') then
    create type public.report_reason as enum ('fake_listing', 'wrong_info', 'spam', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
  end if;

  if not exists (select 1 from pg_type where typname = 'moderation_target_type') then
    create type public.moderation_target_type as enum ('listing', 'report');
  end if;

  if not exists (select 1 from pg_type where typname = 'moderation_action') then
    create type public.moderation_action as enum ('approve', 'reject', 'review', 'resolve', 'dismiss', 'archive');
  end if;
end
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false);
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

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  city text not null default '',
  avatar_url text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

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
  status public.listing_status not null default 'pending',
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

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

create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, listing_id)
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

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.moderation_target_type not null,
  target_id uuid not null,
  action public.moderation_action not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists reports_active_per_user_listing_idx
  on public.reports (listing_id, reporter_id)
  where status in ('open', 'reviewing');

create index if not exists listings_status_idx on public.listings (status, updated_at desc);
create index if not exists listings_seller_idx on public.listings (seller_id, updated_at desc);
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

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;
alter table public.admin_actions enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles
for select
using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
create policy "profiles_insert_self_or_admin"
on public.profiles
for insert
with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "listings_select_visible" on public.listings;
create policy "listings_select_visible"
on public.listings
for select
using (status = 'approved' or auth.uid() = seller_id or public.is_admin());

drop policy if exists "listings_insert_owner_or_admin" on public.listings;
create policy "listings_insert_owner_or_admin"
on public.listings
for insert
with check (auth.uid() = seller_id or public.is_admin());

drop policy if exists "listings_update_owner_or_admin" on public.listings;
create policy "listings_update_owner_or_admin"
on public.listings
for update
using (auth.uid() = seller_id or public.is_admin())
with check (auth.uid() = seller_id or public.is_admin());

drop policy if exists "listing_images_select_visible" on public.listing_images;
create policy "listing_images_select_visible"
on public.listing_images
for select
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and (listings.status = 'approved' or listings.seller_id = auth.uid() or public.is_admin())
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
      and (listings.seller_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and (listings.seller_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "favorites_manage_own" on public.favorites;
create policy "favorites_manage_own"
on public.favorites
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "reports_select_self_or_admin" on public.reports;
create policy "reports_select_self_or_admin"
on public.reports
for select
using (auth.uid() = reporter_id or public.is_admin());

drop policy if exists "reports_insert_self" on public.reports;
create policy "reports_insert_self"
on public.reports
for insert
with check (auth.uid() = reporter_id);

drop policy if exists "reports_update_admin_only" on public.reports;
create policy "reports_update_admin_only"
on public.reports
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_actions_admin_only" on public.admin_actions;
create policy "admin_actions_admin_only"
on public.admin_actions
for all
using (public.is_admin())
with check (public.is_admin());

-- Storage intent:
-- 1. Create a public-read bucket named `listing-images` for listing media.
-- 2. Optionally create an `avatars` bucket for profile images.
-- 3. Enforce JPG/PNG/WebP and 5 MB upload validation from the application layer.
