-- Migration: Contact Form Abuse Tracking & IP Banlist
-- Purpose: Track abuse attempts, ban malicious IPs, prevent spam
-- Run once in Supabase SQL Editor

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Contact Abuse Log Table
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.contact_abuse_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  reason TEXT NOT NULL, -- 'honeypot', 'spam_pattern', 'similarity', 'rate_limit', 'disposable_email', 'turnstile_fail'
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Index for fast lookups by IP and email
CREATE INDEX IF NOT EXISTS idx_contact_abuse_log_ip ON public.contact_abuse_log(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_abuse_log_email ON public.contact_abuse_log(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_abuse_log_created_at ON public.contact_abuse_log(created_at DESC);

-- RLS: Only admins can read abuse logs
ALTER TABLE public.contact_abuse_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view abuse logs" ON public.contact_abuse_log;
CREATE POLICY "Admins can view abuse logs" ON public.contact_abuse_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

-- Service role can insert (API routes use admin client)
DROP POLICY IF EXISTS "Service role can insert abuse logs" ON public.contact_abuse_log;
CREATE POLICY "Service role can insert abuse logs" ON public.contact_abuse_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. IP Banlist Table
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ip_banlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  banned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  expires_at TIMESTAMPTZ, -- NULL = permanent ban
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast IP lookup
CREATE INDEX IF NOT EXISTS idx_ip_banlist_ip ON public.ip_banlist(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_banlist_expires_at ON public.ip_banlist(expires_at) WHERE expires_at IS NOT NULL;

-- RLS: Only admins can manage banlist
ALTER TABLE public.ip_banlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view banlist" ON public.ip_banlist;
CREATE POLICY "Admins can view banlist" ON public.ip_banlist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert banlist" ON public.ip_banlist;
CREATE POLICY "Admins can insert banlist" ON public.ip_banlist
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete banlist" ON public.ip_banlist;
CREATE POLICY "Admins can delete banlist" ON public.ip_banlist
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

-- Service role can read (API routes check bans)
DROP POLICY IF EXISTS "Service role can read banlist" ON public.ip_banlist;
CREATE POLICY "Service role can read banlist" ON public.ip_banlist
  FOR SELECT
  TO service_role
  USING (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. RPC: Check Contact Abuse
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.check_contact_abuse(
  p_email TEXT,
  p_ip TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ip_banned BOOLEAN;
  v_email_count INT;
  v_ip_count INT;
  v_recent_abuse_count INT;
BEGIN
  -- 1. Check if IP is banned (and not expired)
  SELECT EXISTS (
    SELECT 1 FROM public.ip_banlist
    WHERE ip_address = p_ip
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_ip_banned;

  IF v_ip_banned THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'ip_banned',
      'message', 'Bu IP adresi engellenmiştir.'
    );
  END IF;

  -- 2. Count submissions from this email in last 24 hours
  SELECT COUNT(*) INTO v_email_count
  FROM public.contact_abuse_log
  WHERE email = p_email
    AND created_at > now() - interval '24 hours';

  -- 3. Count submissions from this IP in last 24 hours
  SELECT COUNT(*) INTO v_ip_count
  FROM public.contact_abuse_log
  WHERE ip_address = p_ip
    AND created_at > now() - interval '24 hours';

  -- 4. Count recent abuse attempts (last 1 hour)
  SELECT COUNT(*) INTO v_recent_abuse_count
  FROM public.contact_abuse_log
  WHERE (email = p_email OR ip_address = p_ip)
    AND created_at > now() - interval '1 hour';

  -- 5. Apply thresholds
  IF v_email_count >= 5 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'email_limit',
      'message', 'Bu e-posta adresi 24 saat içinde çok fazla mesaj gönderdi.',
      'count', v_email_count
    );
  END IF;

  IF v_ip_count >= 10 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'ip_limit',
      'message', 'Bu IP adresi 24 saat içinde çok fazla istek gönderdi.',
      'count', v_ip_count
    );
  END IF;

  IF v_recent_abuse_count >= 3 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'recent_abuse',
      'message', 'Son 1 saat içinde çok fazla deneme yapıldı.',
      'count', v_recent_abuse_count
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'allowed', true,
    'email_count', v_email_count,
    'ip_count', v_ip_count
  );
END;
$$;

-- Grant execute to service_role (API routes)
GRANT EXECUTE ON FUNCTION public.check_contact_abuse(TEXT, TEXT) TO service_role;

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Helper Function: Log Abuse Attempt
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.log_contact_abuse(
  p_email TEXT,
  p_ip TEXT,
  p_reason TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.contact_abuse_log (email, ip_address, reason, user_agent, metadata)
  VALUES (p_email, p_ip, p_reason, p_user_agent, p_metadata)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_contact_abuse(TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. Cleanup: Remove expired bans (optional cron job)
-- ══════════════════════════════════════════════════════════════════════════════

-- Run this manually or set up a pg_cron job:
-- SELECT cron.schedule('cleanup-expired-bans', '0 2 * * *', 
--   'DELETE FROM public.ip_banlist WHERE expires_at IS NOT NULL AND expires_at < now()');

COMMENT ON TABLE public.contact_abuse_log IS 'Tracks all contact form abuse attempts for analysis and blocking';
COMMENT ON TABLE public.ip_banlist IS 'IP addresses banned from using contact form (manual or automatic)';
COMMENT ON FUNCTION public.check_contact_abuse IS 'Checks if email/IP is allowed to submit contact form based on abuse history';
COMMENT ON FUNCTION public.log_contact_abuse IS 'Logs a contact form abuse attempt';
