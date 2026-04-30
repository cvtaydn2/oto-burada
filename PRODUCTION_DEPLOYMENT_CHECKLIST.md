# Production Deployment Checklist - v28.5

**Version**: v28.5-security-audit  
**Date**: 2026-04-30  
**Status**: Ready for Deployment

---

## ✅ Pre-Deployment Verification (COMPLETED)

### Code Quality
- [x] TypeScript compilation passes (`npm run typecheck`)
- [x] ESLint validation passes (`npm run lint`)
- [x] Production build succeeds (`npm run build`)
- [x] All tests pass (unit, integration, e2e)

### Database
- [x] Migration 0134 applied (Chat Rate Limit Trigger)
- [x] Migration 0135 applied (Atomic Ban User RPC)
- [x] Database backup created
- [x] Migration rollback procedures documented

### Git
- [x] All changes committed
- [x] Release tag created (v28.5-security-audit)
- [x] Branch clean (no uncommitted changes)

### Documentation
- [x] DEPLOYMENT_REPORT_v28.5.md created
- [x] INCIDENT_RESPONSE_RUNBOOK.md created
- [x] MONITORING_SETUP_GUIDE.md created
- [x] PROGRESS.md updated
- [x] README.md verified (monitoring section exists)

---

## 🔧 Environment Variables Verification

### Required Variables (Must be set in Vercel)

#### Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_DB_URL`

#### Redis (Upstash)
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`

#### Payments (Iyzico)
- [ ] `IYZICO_API_KEY`
- [ ] `IYZICO_SECRET_KEY`
- [ ] `IYZICO_BASE_URL` (set to production URL)

#### Email (Resend)
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL`

#### Monitoring (Sentry)
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `SENTRY_AUTH_TOKEN`

#### Security
- [ ] `INTERNAL_API_SECRET`
- [ ] `CRON_SECRET`

#### Optional
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- [ ] `TURNSTILE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (set to production domain)

**Verification Command**:
```bash
node scripts/verify-production-env.mjs
```

---

## 🚀 Staging Deployment

### Deploy to Staging
```bash
git checkout staging
git merge main
git push origin staging
```

### Smoke Tests (Staging)

#### 1. Health Check
```bash
curl https://oto-burada-staging.vercel.app/api/health-check
# Expected: {"status":"healthy"}
```

#### 2. User Authentication
- [ ] Register new user
- [ ] Login with credentials
- [ ] Logout
- [ ] Verify session management

#### 3. Listing Creation
- [ ] Create new listing
- [ ] Upload images
- [ ] Submit for moderation
- [ ] Verify async moderation doesn't crash

#### 4. Favorites
- [ ] Add favorite
- [ ] Remove favorite
- [ ] Verify CSRF token handling
- [ ] Test CSRF token failure (should show error, not crash)

#### 5. Admin Operations
- [ ] Login as admin
- [ ] Ban user (verify atomic operation)
- [ ] Verify listings are rejected atomically
- [ ] Verify trust guard metadata preserved
- [ ] Approve listing

#### 6. Chat Rate Limit
```bash
# Send 50 messages (should succeed)
for i in {1..50}; do
  curl -X POST https://oto-burada-staging.vercel.app/api/chats/TEST_CHAT/messages \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -d '{"content":"test"}' &
done

# Send 51st message (should fail with rate_limit_exceeded)
curl -X POST https://oto-burada-staging.vercel.app/api/chats/TEST_CHAT/messages \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"content":"test"}'
```

#### 7. Payment Flow
- [ ] Initiate payment
- [ ] Verify webhook handling
- [ ] Check null listing_id handling (plan purchases)
- [ ] Verify payment status updates

### Performance Tests (Staging)

#### Lighthouse Audit
```bash
lighthouse https://oto-burada-staging.vercel.app --view
```

**Target Scores**:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 95

#### API Response Times
```bash
# Test critical endpoints
curl -w "@curl-format.txt" -o /dev/null -s https://oto-burada-staging.vercel.app/api/listings
```

**Target**: < 200ms (p95)

### Security Tests (Staging)

#### CSRF Protection
```bash
# Should fail with 403 Forbidden
curl -X POST https://oto-burada-staging.vercel.app/api/favorites \
  -H "Content-Type: application/json" \
  -d '{"listingId":"test"}'
```

#### Rate Limiting
```bash
# Should return 429 Too Many Requests for some requests
for i in {1..1000}; do
  curl https://oto-burada-staging.vercel.app/api/listings &
done
```

---

## 🎯 Production Deployment

### Pre-Production Checklist
- [ ] All staging tests passed
- [ ] No critical errors in staging logs
- [ ] Performance metrics acceptable
- [ ] Team notified of deployment
- [ ] Rollback plan ready

### Notify Team
```markdown
🚀 Production Deployment Starting

**Time**: [Current Time]
**Version**: v28.5-security-audit
**Changes**: 16 critical security fixes
**Expected Downtime**: None
**Rollback Plan**: Ready
```

### Deploy to Production
```bash
git checkout main
git push origin main
```

### Monitor Deployment
- [ ] Watch Vercel deployment logs
- [ ] Verify build success
- [ ] Check deployment URL

### Verify Deployment
```bash
curl https://oto-burada.com/api/health-check
# Expected: {"status":"healthy"}
```

---

## 📊 Post-Deployment Verification

### Immediate Checks (First 5 Minutes)
- [ ] Homepage loads correctly
- [ ] User authentication works
- [ ] Listing creation works
- [ ] No Sentry alerts
- [ ] No Vercel errors
- [ ] Database connections stable

### Short-term Monitoring (First Hour)
- [ ] Error rate stable or decreased
- [ ] Response times normal (< 200ms p95)
- [ ] Database CPU/memory normal (< 80%)
- [ ] No user complaints
- [ ] Payment flow working
- [ ] Chat rate limit working

### Long-term Monitoring (First 24 Hours)
- [ ] Chat rate limit effectiveness
- [ ] Atomic ban operations successful
- [ ] Payment flow integrity
- [ ] No data loss incidents
- [ ] User satisfaction maintained

---

## 🔍 Monitoring Setup

### Sentry Configuration

#### 1. Create Alerts
- [ ] Error rate > 5% alert
- [ ] New error type alert
- [ ] Performance degradation alert (p95 > 1s)

#### 2. Test Alerts
```javascript
// Trigger test error
throw new Error('Test Sentry alert - please ignore');
```

#### 3. Verify Alert Delivery
- [ ] Check email inbox
- [ ] Check Slack #incidents channel
- [ ] Verify alert appears in Sentry dashboard

### Vercel Monitoring

#### 1. Enable Analytics
- [ ] Enable Web Analytics
- [ ] Enable Speed Insights
- [ ] Enable Audience Insights

#### 2. Configure Alerts
- [ ] Function error alert (> 1%)
- [ ] Build failure alert

#### 3. Test Alerts
```bash
# Trigger function error
curl https://oto-burada.com/api/test-error
```

### Supabase Monitoring

#### 1. Enable Database Insights
- [ ] Enable Query Performance Insights
- [ ] Enable Index Advisor

#### 2. Configure Alerts
- [ ] Database CPU alert (> 80%)
- [ ] Connection pool alert (> 90%)
- [ ] Slow query alert (> 1s)

#### 3. Monitor RPC Performance
```sql
-- Check RPC execution times
SELECT 
  proname,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_user_functions
WHERE proname IN ('ban_user_atomic', 'check_message_rate_limit')
ORDER BY total_time DESC;
```

---

## 🚨 Rollback Procedures

### If Critical Issues Arise

#### Quick Rollback (Vercel)
```bash
vercel rollback
```

#### Git Rollback
```bash
git checkout v28.4-pre-audit
git push origin main --force
```

#### Database Rollback
```sql
-- Drop Migration 0134
DROP TRIGGER IF EXISTS enforce_message_rate_limit ON messages;
DROP FUNCTION IF EXISTS check_message_rate_limit();
DELETE FROM public._migrations WHERE name = '0134_chat_rate_limit_trigger.sql';

-- Drop Migration 0135
DROP FUNCTION IF EXISTS ban_user_atomic(uuid, text, boolean);
DELETE FROM public._migrations WHERE name = '0135_atomic_ban_user.sql';
```

---

## ✅ Success Criteria

### Deployment Successful If:
- ✅ All smoke tests pass
- ✅ Error rate stable or decreased
- ✅ No data loss incidents
- ✅ No user-facing issues
- ✅ Monitoring shows healthy metrics
- ✅ Response times < 200ms (p95)
- ✅ Database CPU < 80%
- ✅ No critical Sentry alerts

### Deployment Failed If:
- ❌ Error rate increased > 10%
- ❌ Data loss or corruption
- ❌ Critical features broken
- ❌ User complaints spike
- ❌ Database performance degraded
- ❌ Payment system failure
- ❌ Authentication broken

---

## 📝 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor error rates
- [ ] Verify all fixes working
- [ ] Check user feedback
- [ ] Update status page
- [ ] Document any issues encountered

### Short-term (Week 1)
- [ ] Review Sentry reports
- [ ] Analyze performance metrics
- [ ] Gather user feedback
- [ ] Document lessons learned
- [ ] Update runbook if needed

### Long-term (Month 1)
- [ ] Implement reconciliation worker (RECON-01)
- [ ] Review and optimize RPC performance
- [ ] Consider additional security hardening
- [ ] Update security documentation
- [ ] Conduct security audit review

---

## 📞 Emergency Contacts

### On-Call Rotation
- **Primary**: DevOps Automator
- **Secondary**: Technical Lead
- **Escalation**: CTO

### Communication Channels
- **Slack**: #incidents
- **Email**: devops@otoburada.com
- **Phone**: [Emergency Number]

### Monitoring Dashboards
- **Sentry**: https://sentry.io/organizations/your-org/projects/oto-burada/
- **Vercel**: https://vercel.com/your-team/oto-burada
- **Supabase**: https://app.supabase.com/project/your-project

---

## 📚 Related Documentation

- [DEPLOYMENT_REPORT_v28.5.md](./DEPLOYMENT_REPORT_v28.5.md) - Detailed deployment report
- [INCIDENT_RESPONSE_RUNBOOK.md](./INCIDENT_RESPONSE_RUNBOOK.md) - Incident response procedures
- [MONITORING_SETUP_GUIDE.md](./MONITORING_SETUP_GUIDE.md) - Complete monitoring setup
- [AUDIT_SUMMARY.md](./AUDIT_SUMMARY.md) - Security audit summary
- [CRITICAL_FIXES_APPLIED.md](./CRITICAL_FIXES_APPLIED.md) - Detailed fix documentation

---

**Checklist Version**: 1.0  
**Last Updated**: 2026-04-30  
**Status**: READY FOR PRODUCTION DEPLOYMENT ✅
