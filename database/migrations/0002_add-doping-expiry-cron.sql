-- Migration: add-doping-expiry-cron.sql
-- Run once in Supabase SQL Editor.
-- Schedules an hourly pg_cron job to clear expired doping fields.

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'expire-dopings') then
    perform cron.schedule(
      'expire-dopings',
      '0 * * * *',
      $cron$
        update public.listings
        set featured = false,
            featured_until = null,
            updated_at = timezone('utc', now())
        where featured = true
          and featured_until is not null
          and featured_until < now();

        update public.listings
        set urgent_until = null,
            updated_at = timezone('utc', now())
        where urgent_until is not null
          and urgent_until < now();

        update public.listings
        set highlighted_until = null,
            updated_at = timezone('utc', now())
        where highlighted_until is not null
          and highlighted_until < now();
      $cron$
    );
  end if;
end
$$;
