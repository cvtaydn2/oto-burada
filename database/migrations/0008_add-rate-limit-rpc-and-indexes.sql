-- Migration: add-rate-limit-rpc-and-indexes.sql
-- Applied: 2026-04-17
-- Purpose:
--   1. Create api_rate_limits table + check_api_rate_limit() RPC
--      (Supabase-tier fallback for distributed rate limiting when Redis is unavailable)
--   2. Add missing performance indexes for cron jobs and query patterns

-- ── 1. Rate Limit Table & RPC ────────────────────────────────────────────────

create table if not exists public.api_rate_limits (
  key text not null,
  count integer not null default 1,
  reset_at timestamptz not null,
  primary key (key)
);

alter table public.api_rate_limits enable row level security;

-- Only service role (admin client) can read/write rate limit records.
-- Regular users never touch this table directly.
drop policy if exists "api_rate_limits_service_only" on public.api_rate_limits;
create policy "api_rate_limits_service_only"
  on public.api_rate_limits
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Periodic cleanup: remove expired entries to keep the table small.
-- Run via pg_cron or call manually.
create or replace function public.cleanup_expired_rate_limits()
returns void
language sql
security definer
set search_path = 'public'
as $$
  delete from public.api_rate_limits where reset_at <= now();
$$;

-- Schedule cleanup every 10 minutes if pg_cron is available
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'cleanup-rate-limits',
      '*/10 * * * *',
      'select public.cleanup_expired_rate_limits()'
    );
  end if;
exception when others then null;
end $$;

-- The main RPC called by src/lib/utils/rate-limit.ts
-- Drop first to allow return type change (safe — function is stateless)
drop function if exists public.check_api_rate_limit(text, integer, bigint);
create or replace function public.check_api_rate_limit(
  p_key text,
  p_limit integer,
  p_window_ms bigint
)
returns jsonb
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_now        timestamptz := now();
  v_reset_at   timestamptz := v_now + (p_window_ms || ' milliseconds')::interval;
  v_count      integer;
  v_final_reset timestamptz;
begin
  insert into public.api_rate_limits (key, count, reset_at)
  values (p_key, 1, v_reset_at)
  on conflict (key) do update
    set count    = case
                     when api_rate_limits.reset_at > v_now then api_rate_limits.count + 1
                     else 1
                   end,
        reset_at = case
                     when api_rate_limits.reset_at > v_now then api_rate_limits.reset_at
                     else v_reset_at
                   end
  returning count, reset_at into v_count, v_final_reset;

  return jsonb_build_object(
    'allowed',   v_count <= p_limit,
    'limit',     p_limit,
    'remaining', greatest(0, p_limit - v_count),
    'resetAt',   extract(epoch from v_final_reset) * 1000
  );
end;
$$;

-- ── 2. Missing Performance Indexes ──────────────────────────────────────────

-- Used by expiry-warnings cron: WHERE status='approved' AND published_at < ...
create index if not exists listings_published_at_idx
  on public.listings (published_at)
  where published_at is not null;

-- Used by default sort (newest): ORDER BY bumped_at DESC NULLS LAST
create index if not exists listings_bumped_at_idx
  on public.listings (bumped_at desc nulls last)
  where bumped_at is not null;

-- Used by doping expiry queries: WHERE featured_until < now()
create index if not exists listings_featured_until_idx
  on public.listings (featured_until)
  where featured_until is not null;

create index if not exists listings_urgent_until_idx
  on public.listings (urgent_until)
  where urgent_until is not null;

create index if not exists listings_highlighted_until_idx
  on public.listings (highlighted_until)
  where highlighted_until is not null;

-- Used by admin fraud filtering: WHERE fraud_score > threshold
create index if not exists listings_fraud_score_idx
  on public.listings (fraud_score)
  where fraud_score > 0;

-- ── Rollback ─────────────────────────────────────────────────────────────────
-- To rollback this migration:
--
-- drop function if exists public.check_api_rate_limit(text, integer, bigint);
-- drop function if exists public.cleanup_expired_rate_limits();
-- drop table if exists public.api_rate_limits;
-- drop index if exists listings_published_at_idx;
-- drop index if exists listings_bumped_at_idx;
-- drop index if exists listings_featured_until_idx;
-- drop index if exists listings_urgent_until_idx;
-- drop index if exists listings_highlighted_until_idx;
-- drop index if exists listings_fraud_score_idx;
