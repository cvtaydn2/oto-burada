# OtoBurada — Production Runbook

> Last updated: 2026-05-08
> Stack: Next.js 16 · Supabase · Vercel · Upstash Redis · Sentry · Resend

---

## Table of Contents

1. [Deployment](#deployment)
2. [Development Environment](#development-environment)
3. [Database Migrations](#database-migrations)
4. [Environment Variables](#environment-variables)
5. [Health Checks & Monitoring](#health-checks--monitoring)
6. [Rollback Procedures](#rollback-procedures)
7. [Cron Jobs](#cron-jobs)
8. [Incident Response](#incident-response)
9. [Feature Flags](#feature-flags)
10. [Secrets Rotation](#secrets-rotation)
11. [Quality Gates (Current)](#quality-gates-current)
12. [RLS Runtime Audit Backlog](#rls-runtime-audit-backlog)

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

## Development Environment

OtoBurada projesi, Vercel'in standard **Local**, **Preview** ve **Production** ortamlarını kullanır.

### Local Development

Yerel makinenizde geliştirme yaptığınız ortam. `.env.local` dosyasını kullanır.

### Preview

Her Git branch'i için otomatik oluşturulan test ortamı. Canlı veritabanına zarar vermeden QA yapmak için kullanılır.

### Production

Kullanıcıların eriştiği asıl canlı ortam (`main` branch).

### Syncing Environment Variables

Vercel üzerindeki ortam değişkenlerini (API anahtarları vb.) yerel makinenize çekmek için:

1. **Vercel CLI Kurulumu**: `npm i -g vercel`
2. **Proje Linkleme**: `npm run vercel:link`
3. **Değişkenleri Çekme**: `npm run vercel:pull`
   Bu komut yerel dizininizde güncel bir `.env.local` oluşturur.

---

## Database Migrations

### Principles

1. **Never edit applied migrations** — create a new file
2. **All migrations must be idempotent** — `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`, etc.
3. **Always write a rollback** — comment at the bottom of each migration file
4. **Test on preview branch first** — use a separate Supabase project for staging

### Migration Files Location

```
database/migrations/
├── 0001_consolidated_baseline.sql
├── 0002_add_missing_runtime_objects.sql
└── .active-migrations.txt
```

Aktif migration çalıştırma listesi [`database/migrations/.active-migrations.txt`](database/migrations/.active-migrations.txt) dosyasıdır. Yeni migration eklendiğinde bu liste de güncellenmelidir.

### Applying a Migration

Tercih sırası:

1. MCP/Supabase yönetimli uygulama
2. `npm run db:migrate` (yalnız `psql` erişimi olan ortamlarda)
3. Gerekirse Supabase Dashboard SQL Editor ile kontrollü manuel uygulama

Önemli notlar:

- Bu projede `database/schema.snapshot.sql` şemanın kaynağıdır.
- Yeni değişiklikler ayrıca `database/migrations/00XX_name.sql` dosyasında tutulur.
- Migration uygulandıktan sonra tipler yeniden üretilmeli ve ardından `lint`, `typecheck`, `build` tekrar koşulmalıdır.

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

| Variable                        | Description                                       |
| ------------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key                                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server-only)           |
| `NEXT_PUBLIC_APP_URL`           | Public URL (e.g. `https://oto-burada.vercel.app`) |

### Required in Production

| Variable                  | Description                                               |
| ------------------------- | --------------------------------------------------------- |
| `CRON_SECRET`             | Cron job auth secret (`openssl rand -hex 32`)             |
| `NEXT_PUBLIC_SENTRY_DSN`  | Sentry error monitoring DSN                               |
| `SENTRY_AUTH_TOKEN`       | Sentry build/source-map upload token                      |
| `SENTRY_ORG`              | Sentry organization slug                                  |
| `SENTRY_PROJECT`          | Sentry project slug                                       |

### Optional (features degrade gracefully without these)

| Variable                            | Feature                   |
| ----------------------------------- | ------------------------- |
| `UPSTASH_REDIS_REST_URL`            | Distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN`          | Distributed rate limiting |
| `RESEND_API_KEY`                    | Transactional emails      |
| `RESEND_FROM_EMAIL`                 | Email sender address      |
| `SUPABASE_STORAGE_BUCKET_LISTINGS`  | Image uploads             |
| `SUPABASE_STORAGE_BUCKET_DOCUMENTS` | Document uploads          |
| `IYZICO_API_KEY`                    | Payment processing        |
| `IYZICO_SECRET_KEY`                 | Payment processing        |

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

### Sentry

- **Error Tracking**: Sentry → Issues / Error Tracking
- **Performance**: Sentry → Performance
- **Releases**: Sentry → Releases
- **Session Replay**: Kullanılmıyor. Ücretsiz plan ve veri minimizasyonu için kapalı tutulur.

Key signals to monitor:
| Signal | Threshold |
|-------|-----------|
| Unhandled exception rate | > 10/hour |
| Repeated payment/listing errors | > 3/hour |
| Server warning spikes | > 50/hour |

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

## Quality Gates (Current)

### Required before merge to `main`

- [`npm run lint`](package.json:10)
- [`npm run typecheck`](package.json:11)
- [`npm run build`](package.json:8)

### Hedefli test kapısı (aktif çalışma seti)

Aşağıdaki paketler stabil/tekrarlanabilir olarak doğrulanır:

- [`src/lib/api/__tests__/client.test.ts`](src/lib/api/__tests__/client.test.ts)
- [`src/lib/middleware/__tests__/middleware-logic.test.ts`](src/lib/middleware/__tests__/middleware-logic.test.ts)
- [`src/lib/auth/__tests__/actions.test.ts`](src/lib/auth/__tests__/actions.test.ts)
- [`src/__tests__/auth/register-action.test.ts`](src/__tests__/auth/register-action.test.ts)
- [`src/services/admin/__tests__/listing-moderation.test.ts`](src/services/admin/__tests__/listing-moderation.test.ts)
- [`src/features/marketplace/hooks/__tests__/use-unified-filters.test.tsx`](src/features/marketplace/hooks/__tests__/use-unified-filters.test.tsx)
- [`src/features/marketplace/components/__tests__/listing-view-tracker.test.tsx`](src/features/marketplace/components/__tests__/listing-view-tracker.test.tsx)
- [`src/components/listings/__tests__/contact-actions.test.tsx`](src/components/listings/__tests__/contact-actions.test.tsx)
- [`src/__tests__/security/api-security-audit.test.ts`](src/__tests__/security/api-security-audit.test.ts)
- [`src/__tests__/services/listing-filters-recovery.test.ts`](src/__tests__/services/listing-filters-recovery.test.ts)

### Performance guard (Vercel Insight odaklı)

- Öncelik metrikleri: `TTFB`, `FCP`, `LCP`
- Kritik rotalar: [`/`](src/app/(public)/(marketplace)/page.tsx), [`/contact`](src/app/(public)/contact/page.tsx), [`/maintenance`](src/app/maintenance/page.tsx)
- Middleware kuralı: public sayfaları gereksiz `no-cache` ile bozma; cache-sensitive akışları daralt.

---

## RLS Runtime Audit Backlog

MCP yetkisi olmadan statik analiz tamamlandı; canlı doğrulama için aşağıdaki adımlar beklemede:

- Supabase MCP auth doğrulaması (`list_projects` başarılı olmalı)
- Security advisors çalıştırma (project bazlı)
- Policy runtime smoke SQL:
  - anon/authenticated rol bazlı SELECT/INSERT/UPDATE izin matrisi
  - `public.public_profiles` view davranışı (`security_invoker`) teyidi
- Fark varsa migration patch + hedefli test + build

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

| Job                             | Schedule     | Description                                            |
| ------------------------------- | ------------ | ------------------------------------------------------ |
| `/api/saved-searches/notify`    | `0 9 * * *`  | Daily at 09:00 UTC — email alerts for saved searches   |
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
2. Check Sentry issues and traces for the failing route
3. Manually trigger to verify fix: `curl -X GET ... -H "Authorization: Bearer $CRON_SECRET"`

### Adding a New Cron Job

1. Create the route handler in `src/app/api/[path]/route.ts`
2. Add `verifyCronSecret(request)` check
3. Add to `vercel.json` crons array
4. Document in this runbook

---

## Incident Response

### Severity Levels

| Level | Description                                  | Response Time |
| ----- | -------------------------------------------- | ------------- |
| P0    | Site down, data loss                         | Immediate     |
| P1    | Core feature broken (listing create, search) | < 1 hour      |
| P2    | Non-critical feature broken                  | < 4 hours     |
| P3    | Minor UX issue                               | Next sprint   |

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

| Flag          | Env Var                  | Default  | Description                 |
| ------------- | ------------------------ | -------- | --------------------------- |
| Payments      | `IYZICO_API_KEY`         | off      | Enable payment processing   |
| Email         | `RESEND_API_KEY`         | off      | Enable transactional emails |
| Rate Limiting | `UPSTASH_REDIS_REST_URL` | degraded | Distributed rate limiting   |

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
3. Verify via `/api/health` or Sentry events

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

### Sentry Token

1. Sentry → Project Settings → API Keys → Rotate
2. Update `NEXT_PUBLIC_SENTRY_DSN` in Vercel
3. Redeploy
4. Verify events appear in Sentry

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
