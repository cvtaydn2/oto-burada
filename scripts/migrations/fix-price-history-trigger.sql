-- Fix: listing_price_history trigger causing 42703 on listing insert
-- Root cause: track_listing_price_change() trigger tries to INSERT into
-- listing_price_history(listing_id, price) but the table either doesn't
-- exist or doesn't have a "price" column.
--
-- Run this in Supabase SQL Editor.

-- 1. Drop the broken trigger first
drop trigger if exists track_listing_price_change on public.listings;
drop trigger if exists on_listing_price_change on public.listings;
drop trigger if exists listing_price_change_trigger on public.listings;

-- 2. Drop the broken function
drop function if exists public.track_listing_price_change() cascade;

-- 3. Create the listing_price_history table with the correct schema
create table if not exists public.listing_price_history (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  old_price   bigint,
  new_price   bigint not null,
  changed_at  timestamptz not null default timezone('utc', now())
);

create index if not exists idx_listing_price_history_listing_id
  on public.listing_price_history (listing_id, changed_at desc);

-- RLS
alter table public.listing_price_history enable row level security;

drop policy if exists "price_history_select_public" on public.listing_price_history;
create policy "price_history_select_public"
  on public.listing_price_history for select
  using (true);

-- 4. Re-create the trigger function with the correct column names
create or replace function public.track_listing_price_change()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only record when price actually changes (skip on first insert)
  if (TG_OP = 'UPDATE' and OLD.price is distinct from NEW.price) then
    insert into public.listing_price_history (listing_id, old_price, new_price)
    values (NEW.id, OLD.price, NEW.price);
  end if;
  return NEW;
end;
$$;

-- 5. Attach trigger only on UPDATE (not INSERT — avoids the original bug)
create trigger track_listing_price_change
  after update of price on public.listings
  for each row
  execute function public.track_listing_price_change();
