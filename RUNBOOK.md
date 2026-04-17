# OtoBurada — Production Runbook

> Last updated: 2026-04-17  
> Stack: Next.js 16 · Supabase · Vercel · Upstash Redis · PostHog · Resend

---

## Table of Contents

1. [Deployment](#deployment)
2. [Database Migrations](#database-migrations)
3. [Environment Variables](#environment-variables)
4. [Health Checks & Monitoring](#health-checks--monitoring)
5. [Rollback Procedures](#rollback-procedures)
6. [Cron Jobs](#cron-jobs)
7. [Incident Response](#incident-response)
8. [Feature Flags](#feature-flags)
9. [Secrets Rotation](#secrets-rotation)

---

## Deployment

### Normal Deploy (main → production)

```bash
# 1. Ensure CI passes on GitHub Actions
# 2. Merge PR to main
# 3. Vercel auto-deploys from main branch

# Manual deploy if needed:
npm run deploy:prod
```

### Preview Deploy (any branch)

```bash
npm run deploy:preview
# Vercel prints a preview URL — share with QA
```

### Zero-Downtime Guarantee

Vercel uses atomic deployments — the new build is fully ready before traffic switches. No downtime during deploys.

**What can still cause issues:**
- DB schema changes that are not backward-compatible (see Migrations)
- Redis key format changes (old instances may read stale keys)
- Breaking API contract changes (clients may have cached old responses)

---

## Database Migrations

### Principles

1. **Never edit applied migrations** — create a new file
2. **All migrations must be idempotent** — `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`, etc.
3. **Always write a rollback** — comment at the bottom of each migration file
4. **Test on preview branch first** — use a separate Supabase project for staging

### Migration Files Location

```
scripts/migrations/
├── add-analytics-rpc-functions.sql
├── add-doping-expiry-cron.sql
├── add-missing-indexes.sql
├── add-phone-reveal-logs.sql
├── add-published-at-and-expiry.sql
├── add-rate-limit-rpc-and-indexes.sql   ← rate limiting RPC
├── fix-chats-rls.sql
├── fix-security-performance-advisor.sql
├── fix-storage-bucket-policies.sql      ← storage RLS
└── ...
```

### Applying a Migration

```sql
-- In Supabase Dashboard → SQL Editor:
-- 1. Open the migration file
-- 2. Review it carefully
-- 3. Run it
-- 4. Verify with the check queries at the bottom of the file
```

### Migration Order for Fresh Environment

Run in this order for a new Supabase project:

```
1. schema.sql                              (base schema)
2. add-rate-limit-rpc-and-indexes.sql      (rate limiting)
3. fix-storage-bucket-policies.sql         (storage RLS)
4. fix-security-performance-advisor.sql    (security hardening)
5. add-analytics-rpc-functions.sql         (analytics RPCs)
```

### Backward-Compatible Migration Checklist

Before running any migration in production:

- [ ] Does it add columns? → Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- [ ] Does it drop columns? → **STOP** — coordinate with code deploy first
- [ ] Does it change column types? → **STOP** — requires dual-write period
- [ ] Does it add indexes? → Safe, runs concurrently in Postgres 11+
- [ ] Does it add RLS policies? → Safe, but test with `EXPLAIN` first
- [ ] Does it add functions? → Use `CREATE OR REPLACE` or `DROP IF EXISTS` first

---

## Environment Variables

### Required (app won't start without these)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_APP_URL` | Public URL (e.g. `https://oto-burada.vercel.app`) |

### Required in Production

| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Cron job auth secret (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | PostHog analytics token |

### Optional (features degrade gracefully without these)

| Variable | Feature |
|----------|---------|
| `UPSTASH_REDIS_REST_URL` | Distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Distributed rate limiting |
| `RESEND_API_KEY` | Transactional emails |
| `RESEND_FROM_EMAIL` | Email sender address |
| `SUPABASE_STORAGE_BUCKET_LISTINGS` | Image uploads |
| `SUPABASE_STORAGE_BUCKET_DOCUMENTS` | Document uploads |
| `IYZICO_API_KEY` | Payment processing |
| `IYZICO_SECRET_KEY` | Payment processing |

### Syncing to Local

```bash
npm run vercel:pull   # pulls .env.local from Vercel
```

### Startup Validation

The app validates env vars at startup via `src/lib/env-validation.ts`. Check Vercel function logs for:
- `[ENV] ✅ All environment variables validated` — all good
- `[ENV] ❌ Missing required environment variables` — action required

---

## Health Checks & Monitoring

### Health Endpoint

```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "version": "a1b2c3d4",
  "timestamp": "2026-04-17T10:00:00.000Z",
  "checks": {
    "database": "ok",
    "env": "ok"
  }
}
```

Status codes:
- `200` — healthy
- `503` — down (database unreachable or required env missing)

### Uptime Monitoring

Configure your uptime monitor (BetterUptime, UptimeRobot, etc.) to:
- Poll `https://oto-burada.vercel.app/api/health` every 60 seconds
- Alert on non-200 response or response time > 5s

### Vercel Analytics

- **Web Vitals**: Vercel Dashboard → Analytics → Web Vitals
- **Function Logs**: Vercel Dashboard → Functions → Logs
- **Build Logs**: Vercel Dashboard → Deployments → [deployment] → Build Logs

### PostHog

- **Error Tracking**: PostHog → Error Tracking → All Errors
- **User Sessions**: PostHog → Session Replay
- **Funnels**: PostHog → Insights → Funnels

Key events to monitor:
| Event | Alert threshold |
|-------|----------------|
| `$exception` | > 10/hour |
| `listing_created` | < 1/day (platform health) |
| `server_warning` | > 50/hour |

### Supabase

- **Query Performance**: Supabase Dashboard → Database → Query Performance
- **pg_stat_statements**: Run in SQL Editor:
  ```sql
  SELECT query, calls, mean_exec_time, total_exec_time
  FROM pg_stat_statements
  ORDER BY total_exec_time DESC
  LIMIT 20;
  ```
- **Active Connections**: Supabase Dashboard → Database → Connections
- **RLS Policy Performance**: Check `EXPLAIN ANALYZE` on slow queries

---

## Rollback Procedures

### Code Rollback (Vercel)

```bash
# Option 1: Vercel Dashboard
# Deployments → find last good deployment → "..." → Promote to Production

# Option 2: Git revert
git revert HEAD
git push origin main
# Vercel auto-deploys the revert
```

### Database Rollback

Each migration file has a rollback section at the bottom. Example:

```sql
-- Rollback add-rate-limit-rpc-and-indexes.sql:
DROP FUNCTION IF EXISTS public.check_api_rate_limit(text, integer, bigint);
DROP FUNCTION IF EXISTS public.cleanup_expired_rate_limits();
DROP TABLE IF EXISTS public.api_rate_limits;
DROP INDEX IF EXISTS listings_published_at_idx;
-- ... (see full rollback in the migration file)
```

**Before rolling back a DB migration:**
1. Ensure the code rollback is deployed first (code must be compatible with old schema)
2. Check for data written in the new schema format — may need data migration
3. Test rollback on staging first

### Redis Cache Invalidation

If stale cache is causing issues:

```bash
# Via Upstash Dashboard → Data Browser → Flush
# Or via the app (admin only):
# POST /api/admin/cache/flush  (if implemented)

# Manual via Redis CLI:
redis-cli -u $UPSTASH_REDIS_REST_URL FLUSHDB
```

---

## Cron Jobs

### Schedule

| Job | Schedule | Description |
|-----|----------|-------------|
| `/api/saved-searches/notify` | `0 9 * * *` | Daily at 09:00 UTC — email alerts for saved searches |
| `/api/listings/expiry-warnings` | `0 10 * * *` | Daily at 10:00 UTC — warn sellers of expiring listings |

### Manual Trigger

```bash
curl -X GET https://oto-burada.vercel.app/api/listings/expiry-warnings \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Monitoring Cron Jobs

Vercel Dashboard → Cron Jobs → [job] → Logs

If a cron job fails:
1. Check Vercel function logs for the error
2. Check PostHog for `$exception` events from `server` distinct ID
3. Manually trigger to verify fix: `curl -X GET ... -H "Authorization: Bearer $CRON_SECRET"`

### Adding a New Cron Job

1. Create the route handler in `src/app/api/[path]/route.ts`
2. Add `verifyCronSecret(request)` check
3. Add to `vercel.json` crons array
4. Document in this runbook

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | Site down, data loss | Immediate |
| P1 | Core feature broken (listing create, search) | < 1 hour |
| P2 | Non-critical feature broken | < 4 hours |
| P3 | Minor UX issue | Next sprint |

### P0 Checklist

```
1. Check /api/health → is it 503?
2. Check Vercel Dashboard → is the deployment healthy?
3. Check Supabase Dashboard → is the DB up?
4. Check Vercel Function Logs → what's the error?
5. If code issue → rollback via Vercel Dashboard (< 2 min)
6. If DB issue → check Supabase status page
7. Communicate status to users
```

### Common Issues

**"Supabase connection refused"**
- Check Supabase project status: https://status.supabase.com
- Check `SUPABASE_SERVICE_ROLE_KEY` hasn't expired
- Check connection pool limits in Supabase Dashboard

**"Rate limit exceeded" on all requests**
- Redis may be down → rate limiting falls back to in-memory (resets on cold start)
- Check Upstash Dashboard for Redis status
- Temporary fix: increase `general` rate limit profile in `src/lib/utils/rate-limit.ts`

**"CRON_SECRET not set" in logs**
- Set `CRON_SECRET` in Vercel Project Settings → Environment Variables
- Redeploy to pick up the new env var

**"Build failed"**
- Check GitHub Actions CI for the failing step
- Common causes: TypeScript errors, missing env vars in build, dependency conflicts

---

## Feature Flags

Feature flags are implemented as environment variables. This avoids external dependencies (LaunchDarkly, etc.) for the MVP.

### Current Flags

| Flag | Env Var | Default | Description |
|------|---------|---------|-------------|
| Payments | `IYZICO_API_KEY` | off | Enable payment processing |
| Email | `RESEND_API_KEY` | off | Enable transactional emails |
| Rate Limiting | `UPSTASH_REDIS_REST_URL` | degraded | Distributed rate limiting |

### Adding a Feature Flag

```typescript
// src/lib/features.ts
export const features = {
  payments: Boolean(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY),
  email: Boolean(process.env.RESEND_API_KEY),
  distributedRateLimit: Boolean(process.env.UPSTASH_REDIS_REST_URL),
} as const;

// Usage:
import { features } from "@/lib/features";
if (!features.payments) {
  return apiError("SERVICE_UNAVAILABLE", "Ödeme sistemi henüz aktif değil.", 503);
}
```

### Enabling a Feature in Production

1. Set the env var in Vercel Project Settings → Environment Variables
2. Redeploy (or wait for next deploy)
3. Verify via `/api/health` or PostHog events

---

## Secrets Rotation

### Supabase Service Role Key

1. Supabase Dashboard → Settings → API → Regenerate service_role key
2. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel Project Settings
3. Redeploy
4. Verify `/api/health` returns `database: "ok"`

### CRON_SECRET

```bash
# Generate new secret
openssl rand -hex 32

# Update in Vercel Project Settings → Environment Variables
# Redeploy
# Verify cron jobs still work with manual trigger
```

### Upstash Redis Token

1. Upstash Dashboard → Database → Reset Token
2. Update `UPSTASH_REDIS_REST_TOKEN` in Vercel
3. Redeploy
4. Rate limiting will fall back to in-memory briefly during transition

### PostHog Token

1. PostHog → Project Settings → API Keys → Rotate
2. Update `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` in Vercel
3. Redeploy
4. Verify events appear in PostHog

---

## Seed Data

### Reference Data (brands, models, cities)

```bash
npm run db:seed-references
```

### Demo Data (listings, users)

```bash
npm run db:seed-demo
```

### Bootstrap (fresh environment)

```bash
# 1. Apply schema
npm run db:apply-schema

# 2. Seed reference data
npm run db:seed-references

# 3. Create admin user
node scripts/create-user-admin.mjs

# 4. Verify
npm run db:check-env
```
