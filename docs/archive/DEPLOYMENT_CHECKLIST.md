# Deployment Checklist - Security Audit Fixes

> Historical archive note: Bu belge artık aktif operasyon runbook'u değildir. Buradaki adımlar ve belge adları, 2026-04-30 tarihli belirli bir deployment hazırlık anını yansıtır. Güncel operasyon prosedürleri için [`RUNBOOK.md`](../../RUNBOOK.md), release kapıları için [`docs/RELEASE_READINESS.md`](../RELEASE_READINESS.md) ve dokümantasyon sınıflandırması için [`docs/INDEX.md`](../INDEX.md) kullanılmalıdır.

**Date**: 2026-04-30
**Version**: Phase 28.5
**Status**: Ready for Deployment ✅

---

## Pre-Deployment Verification

### ✅ Code Quality
- [x] TypeScript compilation: `npm run typecheck` - **PASSED**
- [x] ESLint validation: `npm run lint` - **PASSED**
- [x] Production build: `npm run build` - **PASSED**
- [x] All tests passing (if applicable)

### ✅ Documentation

> Archive context: Bu bölümde geçen [`CRITICAL_FIXES_APPLIED.md`](../../CRITICAL_FIXES_APPLIED.md) ve [`AUDIT_SUMMARY.md`](../../AUDIT_SUMMARY.md) gibi isimler tarihsel deployment anındaki çalışma setine aittir. Bu belge adlarının bugün aktif repo omurgasında görünmemesi normaldir; güncel doğrulama kaydı [`PROGRESS.md`](../../PROGRESS.md), güncel katalog ise [`docs/INDEX.md`](../INDEX.md) üzerinden izlenmelidir.

- [x] `CRITICAL_FIXES_APPLIED.md` - Comprehensive fix documentation
- [x] `AUDIT_SUMMARY.md` - Executive summary
- [x] `PROGRESS.md` - Updated with Phase 28.5
- [x] `DEPLOYMENT_CHECKLIST.md` - This file

### ✅ Database Migrations

> Historical migration note: Bu listedeki migration numaraları o deployment penceresinin hedefleridir; bugünün zorunlu sıradaki migration listesi olarak yorumlanmamalıdır.

- [ ] **REQUIRED**: Apply migration 0134 (Chat Rate Limit)
- [ ] **REQUIRED**: Apply migration 0135 (Atomic Ban User)

---

## Deployment Steps

### Step 1: Backup Current State
```bash
# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Tag current commit
git tag -a v28.4-pre-audit -m "Pre-security-audit state"
git push origin v28.4-pre-audit
```

### Step 2: Apply Database Migrations
```bash
# Apply migrations
npm run db:migrate

# Verify migrations applied
psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"
```

**Expected Output**:
```
version | applied_at
--------|------------
0135    | 2026-04-30 ...
0134    | 2026-04-30 ...
```

### Step 3: Verify Migration Success

#### Test Chat Rate Limit
```bash
# Should succeed (under limit)
for i in {1..50}; do
  curl -X POST https://your-staging.vercel.app/api/chats/TEST_CHAT/messages \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -d '{"content":"test"}' &
done

# Should fail (over limit)
for i in {1..101}; do
  curl -X POST https://your-staging.vercel.app/api/chats/TEST_CHAT/messages \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -d '{"content":"test"}' &
done
```

**Expected**: 101st message returns `rate_limit_exceeded` error

#### Test Atomic Ban
```bash
# Create test user with listings
# Ban user
curl -X POST https://your-staging.vercel.app/api/admin/users/TEST_USER/ban \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason":"Test ban"}'

# Verify listings rejected
curl https://your-staging.vercel.app/api/listings?sellerId=TEST_USER

# Expected: All listings have status="rejected"
```

### Step 4: Deploy to Staging
```bash
# Push to staging branch
git checkout staging
git merge main
git push origin staging

# Wait for Vercel deployment
# Verify deployment URL
```

### Step 5: Staging Smoke Tests

#### Critical Path Tests
- [ ] User login/logout
- [ ] Create listing (verify async moderation doesn't crash)
- [ ] Favorite/unfavorite listing (verify CSRF handling)
- [ ] Admin ban user (verify atomic operation)
- [ ] Send chat messages (verify rate limit)
- [ ] Payment flow (verify null listing_id handling)
- [ ] Webhook callback (verify token handling)

#### Monitoring Checks
- [ ] Sentry: No new errors
- [ ] Vercel Logs: No "CRITICAL" errors
- [ ] Supabase: RPC execution times < 100ms
- [ ] Database: Trigger execution counts look normal

### Step 6: Deploy to Production
```bash
# Tag release
git tag -a v28.5-security-audit -m "Security audit fixes - 16 critical issues resolved"
git push origin v28.5-security-audit

# Deploy to production
git checkout main
git push origin main

# Wait for Vercel deployment
```

### Step 7: Post-Deployment Verification

#### Immediate Checks (First 5 Minutes)
- [ ] Homepage loads correctly
- [ ] User authentication works
- [ ] Listing creation works
- [ ] No Sentry alerts
- [ ] No Vercel errors

#### Short-term Monitoring (First Hour)
- [ ] Error rate stable or decreased
- [ ] Response times normal
- [ ] Database CPU/memory normal
- [ ] No user complaints

#### Long-term Monitoring (First 24 Hours)
- [ ] Chat rate limit effectiveness
- [ ] Admin ban operations successful
- [ ] Payment flow integrity
- [ ] No data loss incidents

---

## Rollback Procedures

### If Critical Issues Arise

#### Option 1: Quick Rollback (Vercel)
```bash
# Rollback to previous deployment via Vercel dashboard
# Or via CLI:
vercel rollback
```

#### Option 2: Git Revert
```bash
# Revert to pre-audit state
git revert <commit-range>
git push origin main
```

#### Option 3: Database Rollback
```bash
# Drop new triggers/functions
psql $DATABASE_URL << EOF
DROP TRIGGER IF EXISTS enforce_message_rate_limit ON messages;
DROP FUNCTION IF EXISTS check_message_rate_limit();
DROP FUNCTION IF EXISTS ban_user_atomic(uuid, text, boolean);
EOF

# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

---

## Monitoring Dashboard Setup

### Sentry Alerts
- [ ] Configure alert for error rate > 5%
- [ ] Configure alert for new error types
- [ ] Configure alert for performance degradation

### Supabase Monitoring
- [ ] Monitor RPC execution times
- [ ] Monitor trigger execution counts
- [ ] Monitor database CPU/memory
- [ ] Set up alerts for slow queries

### Vercel Monitoring
- [ ] Monitor function execution times
- [ ] Monitor function error rates
- [ ] Set up log alerts for "CRITICAL" keyword

### Custom Metrics
- [ ] Chat rate limit trigger count
- [ ] Atomic ban operation success rate
- [ ] Admin client creation frequency
- [ ] CSRF token failure rate

---

## Success Criteria

### Deployment Successful If:
- ✅ All smoke tests pass
- ✅ Error rate stable or decreased
- ✅ No data loss incidents
- ✅ No user-facing issues
- ✅ Monitoring shows healthy metrics

### Deployment Failed If:
- ❌ Error rate increased > 10%
- ❌ Data loss or corruption
- ❌ Critical features broken
- ❌ User complaints spike
- ❌ Database performance degraded

---

## Communication Plan

### Before Deployment
- [ ] Notify team of deployment window
- [ ] Schedule maintenance window (if needed)
- [ ] Prepare rollback plan

### During Deployment
- [ ] Post status updates in team chat
- [ ] Monitor metrics in real-time
- [ ] Be ready to rollback if needed

### After Deployment
- [ ] Announce successful deployment
- [ ] Share monitoring dashboard
- [ ] Document any issues encountered

---

## Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor error rates
- [ ] Verify all fixes working
- [ ] Check user feedback
- [ ] Update status page

### Short-term (Week 1)
- [ ] Review Sentry reports
- [ ] Analyze performance metrics
- [ ] Gather user feedback
- [ ] Document lessons learned

### Long-term (Month 1)
- [ ] Implement reconciliation worker (RECON-01)
- [ ] Review and optimize RPC performance
- [ ] Consider additional security hardening
- [ ] Update security documentation

---

## Contact Information

### On-Call Rotation
- **Primary**: [Your Name]
- **Secondary**: [Backup Name]
- **Escalation**: [Manager Name]

### Emergency Contacts
- **Sentry**: [Dashboard URL]
- **Vercel**: [Dashboard URL]
- **Supabase**: [Dashboard URL]
- **Team Chat**: [Slack/Discord Channel]

---

## Appendix: Migration Files

### Migration 0134: Chat Rate Limit Trigger
**File**: `database/migrations/0134_chat_rate_limit_trigger.sql`

Creates database-level rate limiting for chat messages (100/hour per chat).

### Migration 0135: Atomic Ban User RPC
**File**: `database/migrations/0135_atomic_ban_user.sql`

Creates atomic user ban function with automatic listing rejection.

---

## Sign-Off

- [ ] **Developer**: Code reviewed and tested
- [ ] **Tech Lead**: Architecture approved
- [ ] **Security**: Security fixes verified
- [ ] **DevOps**: Deployment plan approved
- [ ] **Product**: User impact assessed

---

**Prepared By**: Kiro AI (Claude Sonnet 4.5)  
**Date**: 2026-04-30  
**Version**: Phase 28.5  
**Status**: READY FOR DEPLOYMENT ✅
