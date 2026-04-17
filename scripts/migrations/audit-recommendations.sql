-- Migration: audit-recommendations.sql
-- Applied: 2026-04-17
-- Source: External code audit recommendations
--
-- Changes:
--   1. FTS: 'simple' → 'turkish' + unaccent extension for proper Turkish stemming
--   2. pg_cron: Add logging table + error-catching wrapper for expire-old-listings
--   3. Soft delete: payments and eids_audit_logs get ON DELETE SET NULL / RESTRICT
--      instead of CASCADE (financial/legal records must not be deleted with user)
--   4. damage_status_json: CHECK constraint to enforce known keys
--
-- Rollback section at the bottom.

-- ── 1. Turkish Full-Text Search ──────────────────────────────────────────────
-- 'simple' config does no stemming — "araba" and "arabalar" are different tokens.
-- 'turkish' config + unaccent handles Turkish morphology and diacritic normalization.
-- unaccent maps ş→s, ğ→g, ı→i, ö→o, ü→u so "satilik" matches "satılık".

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create a custom text search configuration that combines Turkish dictionary
-- with unaccent so diacritics are stripped before stemming.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_ts_config WHERE cfgname = 'turkish_unaccent'
  ) THEN
    CREATE TEXT SEARCH CONFIGURATION turkish_unaccent (COPY = turkish);
    ALTER TEXT SEARCH CONFIGURATION turkish_unaccent
      ALTER MAPPING FOR hword, hword_part, word
      WITH unaccent, turkish_stem;
  END IF;
END $$;

-- Drop the old generated column (cannot ALTER a generated column's expression)
ALTER TABLE public.listings DROP COLUMN IF EXISTS search_vector;

-- Recreate with turkish_unaccent configuration
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('turkish_unaccent',
      coalesce(title, '')       || ' ' ||
      coalesce(brand, '')       || ' ' ||
      coalesce(model, '')       || ' ' ||
      coalesce(city, '')        || ' ' ||
      coalesce(district, '')    || ' ' ||
      coalesce(description, '')
    )
  ) STORED;

-- Recreate GIN index on the new column
DROP INDEX IF EXISTS listings_search_vector_idx;
CREATE INDEX listings_search_vector_idx
  ON public.listings USING GIN (search_vector);

-- ── 2. pg_cron Job Logging ───────────────────────────────────────────────────
-- Silent cron failures are invisible. This table captures every run result.

CREATE TABLE IF NOT EXISTS public.cron_job_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name    text        NOT NULL,
  started_at  timestamptz NOT NULL DEFAULT timezone('utc', now()),
  finished_at timestamptz,
  status      text        NOT NULL DEFAULT 'running', -- 'running' | 'success' | 'error'
  rows_affected integer,
  error_message text,
  details     jsonb
);

ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cron_job_logs_admin_only"
  ON public.cron_job_logs FOR ALL
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE INDEX IF NOT EXISTS cron_job_logs_job_name_idx
  ON public.cron_job_logs (job_name, started_at DESC);

-- Wrapper function: runs the expiry logic and logs the result.
-- Replaces the raw SQL in the cron schedule.
CREATE OR REPLACE FUNCTION public.run_expire_old_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_log_id    uuid;
  v_rows      integer := 0;
  v_err       text;
BEGIN
  -- Open log entry
  INSERT INTO public.cron_job_logs (job_name, status)
  VALUES ('expire-old-listings', 'running')
  RETURNING id INTO v_log_id;

  BEGIN
    UPDATE public.listings
    SET status     = 'archived',
        updated_at = timezone('utc', now())
    WHERE status       = 'approved'
      AND published_at < now() - INTERVAL '30 days';

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    -- Mark success
    UPDATE public.cron_job_logs
    SET status        = 'success',
        finished_at   = timezone('utc', now()),
        rows_affected = v_rows
    WHERE id = v_log_id;

  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;

    -- Mark error — never re-raise so cron doesn't crash
    UPDATE public.cron_job_logs
    SET status        = 'error',
        finished_at   = timezone('utc', now()),
        error_message = v_err
    WHERE id = v_log_id;
  END;
END;
$$;

-- Re-register the cron job to use the wrapper function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove old raw-SQL job
    PERFORM cron.unschedule('expire-old-listings');

    -- Register new logged job
    PERFORM cron.schedule(
      'expire-old-listings',
      '0 2 * * *',
      $job$ SELECT public.run_expire_old_listings(); $job$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── 3. Soft Delete: payments & eids_audit_logs ───────────────────────────────
-- Problem: ON DELETE CASCADE on payments and eids_audit_logs means deleting a
-- user account permanently destroys financial and legal audit records.
-- KVKK/GDPR requires data erasure but accounting/legal records must be retained.
--
-- Fix:
--   payments.user_id        → ON DELETE SET NULL  (payment record survives, user link nulled)
--   eids_audit_logs.listing_id → ON DELETE SET NULL  (log survives, listing link nulled)
--   eids_audit_logs.verified_by → ON DELETE SET NULL (log survives, verifier link nulled)
--
-- Note: Changing FK constraint requires DROP + ADD. This is safe because:
--   - No data is deleted
--   - The column itself is not dropped
--   - Existing rows are unaffected

-- payments.user_id
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- eids_audit_logs.listing_id
ALTER TABLE public.eids_audit_logs
  DROP CONSTRAINT IF EXISTS eids_audit_logs_listing_id_fkey;

ALTER TABLE public.eids_audit_logs
  ADD CONSTRAINT eids_audit_logs_listing_id_fkey
  FOREIGN KEY (listing_id)
  REFERENCES public.listings(id)
  ON DELETE SET NULL;

-- eids_audit_logs.verified_by
ALTER TABLE public.eids_audit_logs
  DROP CONSTRAINT IF EXISTS eids_audit_logs_verified_by_fkey;

ALTER TABLE public.eids_audit_logs
  ADD CONSTRAINT eids_audit_logs_verified_by_fkey
  FOREIGN KEY (verified_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- Allow NULL on these columns now that FK is SET NULL
ALTER TABLE public.payments
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.eids_audit_logs
  ALTER COLUMN listing_id DROP NOT NULL,
  ALTER COLUMN verified_by DROP NOT NULL;

-- ── 4. damage_status_json CHECK Constraint ───────────────────────────────────
-- Enforce that damage_status_json only contains known car part keys
-- and valid status values. Prevents garbage data from reaching the DB.
--
-- Valid part keys (Turkish car body parts):
--   kaput, tavan, on_tampon, arka_tampon, on_sol_camurluk, on_sag_camurluk,
--   arka_sol_camurluk, arka_sag_camurluk, sol_on_kapi, sag_on_kapi,
--   sol_arka_kapi, sag_arka_kapi, bagaj, sol_far, sag_far, on_cam, arka_cam
--
-- Valid status values: 'orijinal' | 'boyali' | 'degisen' | 'hasarli'

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_damage_status_json_check;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_damage_status_json_check
  CHECK (
    damage_status_json IS NULL
    OR (
      -- Must be a JSON object (not array, not scalar)
      jsonb_typeof(damage_status_json) = 'object'
      AND
      -- All keys must be known car parts
      (
        SELECT bool_and(
          key IN (
            'kaput', 'tavan', 'on_tampon', 'arka_tampon',
            'on_sol_camurluk', 'on_sag_camurluk',
            'arka_sol_camurluk', 'arka_sag_camurluk',
            'sol_on_kapi', 'sag_on_kapi',
            'sol_arka_kapi', 'sag_arka_kapi',
            'bagaj', 'sol_far', 'sag_far',
            'on_cam', 'arka_cam',
            'sol_yan_ayna', 'sag_yan_ayna',
            'tavan_penceresi', 'stepne_kapaği'
          )
        )
        FROM jsonb_object_keys(damage_status_json) AS key
      )
      AND
      -- All values must be valid status strings
      (
        SELECT bool_and(
          value #>> '{}' IN ('orijinal', 'boyali', 'degisen', 'hasarli', 'belirtilmemis')
        )
        FROM jsonb_each(damage_status_json) AS kv(key, value)
      )
    )
  );

-- ── Verification Queries ─────────────────────────────────────────────────────
-- Run these after applying the migration to confirm everything worked:

-- 1. FTS config exists:
--    SELECT cfgname FROM pg_ts_config WHERE cfgname = 'turkish_unaccent';

-- 2. search_vector column uses new config:
--    SELECT pg_get_expr(adbin, adrelid) FROM pg_attrdef
--    JOIN pg_attribute ON attrelid = adrelid AND attnum = adnum
--    WHERE attname = 'search_vector' AND attrelid = 'public.listings'::regclass;

-- 3. Cron log table exists:
--    SELECT COUNT(*) FROM public.cron_job_logs;

-- 4. Cron job registered:
--    SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'expire-old-listings';

-- 5. payments FK is SET NULL:
--    SELECT confdeltype FROM pg_constraint
--    WHERE conname = 'payments_user_id_fkey';
--    -- Expected: 'n' (SET NULL)

-- 6. damage_status_json constraint exists:
--    SELECT conname FROM pg_constraint
--    WHERE conrelid = 'public.listings'::regclass
--    AND conname = 'listings_damage_status_json_check';

-- ── Rollback ─────────────────────────────────────────────────────────────────
-- To rollback this migration:
--
-- -- 1. Revert FTS to 'simple'
-- ALTER TABLE public.listings DROP COLUMN IF EXISTS search_vector;
-- ALTER TABLE public.listings ADD COLUMN search_vector tsvector
--   GENERATED ALWAYS AS (
--     to_tsvector('simple',
--       coalesce(title,'') || ' ' || coalesce(brand,'') || ' ' ||
--       coalesce(model,'') || ' ' || coalesce(city,'') || ' ' ||
--       coalesce(district,'') || ' ' || coalesce(description,'')
--     )
--   ) STORED;
-- CREATE INDEX listings_search_vector_idx ON public.listings USING GIN (search_vector);
--
-- -- 2. Remove cron logging
-- DROP TABLE IF EXISTS public.cron_job_logs;
-- DROP FUNCTION IF EXISTS public.run_expire_old_listings();
-- -- Re-register original raw-SQL cron job manually in Supabase Dashboard
--
-- -- 3. Revert FK to CASCADE
-- ALTER TABLE public.payments DROP CONSTRAINT payments_user_id_fkey;
-- ALTER TABLE public.payments ADD CONSTRAINT payments_user_id_fkey
--   FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
-- ALTER TABLE public.payments ALTER COLUMN user_id SET NOT NULL;
--
-- ALTER TABLE public.eids_audit_logs DROP CONSTRAINT eids_audit_logs_listing_id_fkey;
-- ALTER TABLE public.eids_audit_logs ADD CONSTRAINT eids_audit_logs_listing_id_fkey
--   FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
-- ALTER TABLE public.eids_audit_logs ALTER COLUMN listing_id SET NOT NULL;
--
-- ALTER TABLE public.eids_audit_logs DROP CONSTRAINT eids_audit_logs_verified_by_fkey;
-- ALTER TABLE public.eids_audit_logs ADD CONSTRAINT eids_audit_logs_verified_by_fkey
--   FOREIGN KEY (verified_by) REFERENCES public.profiles(id);
-- ALTER TABLE public.eids_audit_logs ALTER COLUMN verified_by SET NOT NULL;
--
-- -- 4. Remove damage_status_json constraint
-- ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_damage_status_json_check;
