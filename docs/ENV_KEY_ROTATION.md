# Environment Variable Key Rotation

## Overview

This document describes how to rotate secrets and API keys used by OtoBurada.

## Keys & Rotation Procedures

### 1. Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)

- **Anon Key**: Regenerate in Supabase Dashboard → Settings → API → Regenerate anon key.
- **Service Role Key**: Same location. Update Vercel env vars immediately.
- **Impact**: All active sessions will be invalidated. Users must re-login.
- **Steps**:
  1. Generate new key in Supabase Dashboard.
  2. Update in Vercel: `vercel env rm <KEY> production` → `vercel env add <KEY> production`.
  3. Redeploy: `vercel --prod`.
  4. Verify health: `curl https://<domain>/api/health`.

### 2. Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)

- **Where**: Upstash Console → Database → REST API → Reset Token.
- **Impact**: Rate limiting falls back to in-memory for ~30s during propagation.
- **Steps**:
  1. Reset token in Upstash Console.
  2. Update Vercel env vars.
  3. Redeploy.

### 3. Iyzico (`IYZICO_API_KEY`, `IYZICO_SECRET_KEY`)

- **Where**: Iyzico Merchant Panel → Settings → API Keys.
- **Impact**: In-flight payment initializations will fail. No charge risk (idempotent).
- **Steps**:
  1. Generate new keys in Iyzico panel.
  2. Update Vercel env vars.
  3. Redeploy.
  4. Test with a sandbox payment.

### 4. Resend (`RESEND_API_KEY`)

- **Where**: Resend Dashboard → API Keys → Create new → Delete old.
- **Impact**: Emails queue and retry. No data loss.
- **Steps**:
  1. Create new key in Resend.
  2. Update Vercel env var.
  3. Redeploy.
  4. Delete old key in Resend.

### 5. Sentry (`SENTRY_AUTH_TOKEN`)

- **Where**: Sentry → Settings → Auth Tokens.
- **Impact**: Source map uploads fail until updated. No runtime impact.
- **Steps**:
  1. Create new token in Sentry.
  2. Update Vercel env var.
  3. Redeploy (triggers new source map upload).
  4. Revoke old token.

### 6. `CRON_SECRET`

- **Where**: Self-generated. Use `openssl rand -base64 32`.
- **Impact**: Cron jobs return 401 until Vercel env is updated.
- **Steps**:
  1. Generate: `openssl rand -base64 32`.
  2. Update Vercel env var.
  3. Redeploy.

## General Rotation Checklist

1. **Never** rotate in production during peak hours.
2. **Always** update Vercel env vars **before** revoking old keys (zero-downtime).
3. **Verify** via `/api/health` endpoint after each rotation.
4. **Log** rotation date in `PROGRESS.md` for audit trail.
5. **Recommended cadence**: Every 90 days for secrets, immediately if compromised.
