# TASK-65: Production Deployment & Monitoring

**Ajan**: DevOps Automator  
**Ajan Dosyası**: `.agency/engineering/engineering-devops-automator.md`  
**Öncelik**: 🔴 Kritik  
**Tahmini Süre**: 4 saat  
**Durum**: 🔴 Bekliyor  
**Bağımlılık**: TASK-64 (Database Migration)

---

## 📋 Görev Özeti

Security audit sonrası tüm fix'leri production'a deploy et ve comprehensive monitoring kurulumunu tamamla.

---

## 🎯 Hedefler

1. Staging deployment ve smoke tests
2. Production deployment
3. Monitoring dashboard setup (Sentry, Vercel, Supabase)
4. Alert configuration
5. Rollback plan verification

---

## 📝 Detaylı Görevler

### Phase 1: Pre-Deployment Preparation

#### 1.1 Environment Variables Audit

- [ ] **Vercel Production Environment Variables**
  ```bash
  # Verify all required env vars are set
  vercel env ls production
  ```

  **Required Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `IYZICO_API_KEY`
  - `IYZICO_SECRET_KEY`
  - `RESEND_API_KEY`
  - `OPENAI_API_KEY` (optional)
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_AUTH_TOKEN`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

- [ ] **Supabase Environment Variables**
  - Database connection string
  - JWT secret
  - Service role key rotation schedule

#### 1.2 Code Quality Verification

- [ ] **Run All Checks**
  ```bash
  npm run typecheck  # Should pass ✅
  npm run lint       # Should pass ✅
  npm run build      # Should pass ✅
  ```

- [ ] **Verify Git State**
  ```bash
  git status         # Should be clean
  git log -5         # Review recent commits
  ```

#### 1.3 Create Release Tag

- [ ] **Tag Release**
  ```bash
  git tag -a v28.5-security-audit -m "Security audit fixes - 16 critical issues resolved"
  git push origin v28.5-security-audit
  ```

### Phase 2: Staging Deployment

#### 2.1 Deploy to Staging

- [ ] **Push to Staging Branch**
  ```bash
  git checkout staging
  git merge main
  git push origin staging
  ```

- [ ] **Wait for Vercel Deployment**
  ```bash
  vercel --prod --scope=your-team
  ```

- [ ] **Verify Deployment URL**
  - URL: `https://oto-burada-staging.vercel.app`
  - Status: Deployment successful

#### 2.2 Staging Smoke Tests

- [ ] **Health Check**
  ```bash
  curl https://oto-burada-staging.vercel.app/api/health-check
  # Expected: {"status":"healthy"}
  ```

- [ ] **Critical Path Tests**
  1. **Homepage Load**
     - Navigate to homepage
     - Verify listings load
     - Check no console errors
  
  2. **User Authentication**
     - Register new user
     - Login
     - Logout
     - Verify session management
  
  3. **Listing Creation**
     - Create new listing
     - Upload images
     - Submit for moderation
     - Verify async moderation doesn't crash
  
  4. **Favorites**
     - Add favorite
     - Remove favorite
     - Verify CSRF token handling
  
  5. **Admin Operations**
     - Login as admin
     - Ban user (verify atomic operation)
     - Approve listing
     - Verify RLS policies
  
  6. **Chat Rate Limit**
     - Send 50 messages (should succeed)
     - Send 51st message (should fail with rate_limit_exceeded)
  
  7. **Payment Flow**
     - Initiate payment
     - Verify webhook handling
     - Check null listing_id handling

- [ ] **Performance Tests**
  ```bash
  # Run Lighthouse audit
  lighthouse https://oto-burada-staging.vercel.app --view
  
  # Expected scores:
  # Performance: > 90
  # Accessibility: > 95
  # Best Practices: > 90
  # SEO: > 95
  ```

- [ ] **Security Tests**
  ```bash
  # Test CSRF protection
  curl -X POST https://oto-burada-staging.vercel.app/api/favorites \
    -H "Content-Type: application/json" \
    -d '{"listingId":"test"}'
  # Expected: 403 Forbidden (no CSRF token)
  
  # Test rate limiting
  for i in {1..101}; do
    curl https://oto-burada-staging.vercel.app/api/listings &
  done
  # Expected: Some requests return 429 Too Many Requests
  ```

### Phase 3: Production Deployment

#### 3.1 Pre-Production Checklist

- [ ] **Verify Staging Success**
  - All smoke tests passed
  - No critical errors in logs
  - Performance metrics acceptable

- [ ] **Notify Team**
  ```markdown
  🚀 Production Deployment Starting
  
  **Time**: [Time]
  **Version**: v28.5-security-audit
  **Changes**: 16 critical security fixes
  **Expected Downtime**: None
  **Rollback Plan**: Ready
  ```

- [ ] **Backup Current State**
  ```bash
  # Database backup (already done in TASK-64)
  # Tag current production state
  git tag -a v28.4-pre-audit -m "Pre-security-audit state"
  git push origin v28.4-pre-audit
  ```

#### 3.2 Deploy to Production

- [ ] **Push to Main**
  ```bash
  git checkout main
  git push origin main
  ```

- [ ] **Monitor Vercel Deployment**
  - Watch deployment logs
  - Verify build success
  - Check deployment URL

- [ ] **Verify Deployment**
  ```bash
  curl https://oto-burada.com/api/health-check
  # Expected: {"status":"healthy"}
  ```

#### 3.3 Post-Deployment Verification

- [ ] **Immediate Checks (First 5 Minutes)**
  1. Homepage loads
  2. User authentication works
  3. Listing creation works
  4. No Sentry alerts
  5. No Vercel errors

- [ ] **Short-term Monitoring (First Hour)**
  1. Error rate stable or decreased
  2. Response times normal
  3. Database CPU/memory normal
  4. No user complaints

### Phase 4: Monitoring Setup

#### 4.1 Sentry Configuration

- [ ] **Verify Sentry Integration**
  ```bash
  # Check Sentry dashboard
  # URL: https://sentry.io/organizations/your-org/projects/oto-burada/
  ```

- [ ] **Configure Alerts**
  1. **Error Rate Alert**
     - Condition: Error rate > 5%
     - Notification: Email + Slack
     - Frequency: Immediate
  
  2. **New Error Type Alert**
     - Condition: New error type detected
     - Notification: Email
     - Frequency: Immediate
  
  3. **Performance Degradation Alert**
     - Condition: P95 response time > 1s
     - Notification: Slack
     - Frequency: Every 15 minutes

- [ ] **Test Alerts**
  ```javascript
  // Trigger test error
  Sentry.captureException(new Error('Test alert'));
  ```

#### 4.2 Vercel Monitoring

- [ ] **Configure Vercel Analytics**
  - Enable Web Analytics
  - Enable Speed Insights
  - Configure custom events

- [ ] **Set Up Log Drains**
  ```bash
  # Configure log drain to external service (optional)
  vercel logs --follow
  ```

- [ ] **Configure Alerts**
  1. **Function Error Alert**
     - Condition: Function error rate > 1%
     - Notification: Email
  
  2. **Build Failure Alert**
     - Condition: Build fails
     - Notification: Email + Slack

#### 4.3 Supabase Monitoring

- [ ] **Database Monitoring**
  - Navigate to Supabase Dashboard
  - Enable Database Insights
  - Configure slow query alerts

- [ ] **Configure Alerts**
  1. **Database CPU Alert**
     - Condition: CPU > 80%
     - Notification: Email
  
  2. **Connection Pool Alert**
     - Condition: Connections > 90% of limit
     - Notification: Email
  
  3. **Slow Query Alert**
     - Condition: Query time > 1s
     - Notification: Email

- [ ] **RPC Performance Monitoring**
  ```sql
  -- Monitor RPC execution times
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

#### 4.4 Custom Metrics Dashboard

- [ ] **Create Monitoring Dashboard**
  
  **Metrics to Track**:
  1. **Application Metrics**
     - Request rate (req/min)
     - Error rate (%)
     - Response time (p50, p95, p99)
     - Active users
  
  2. **Business Metrics**
     - New user registrations
     - Listing creations
     - Favorites added
     - Chat messages sent
     - Payments processed
  
  3. **Security Metrics**
     - Chat rate limit triggers
     - Atomic ban operations
     - CSRF token failures
     - Rate limit hits
  
  4. **Database Metrics**
     - Query execution time
     - Connection pool usage
     - Trigger execution count
     - RPC call count

- [ ] **Set Up Grafana/PostHog (Optional)**
  ```bash
  # If using external monitoring service
  # Configure data source
  # Create dashboards
  # Set up alerts
  ```

### Phase 5: Alert Testing

#### 5.1 Test All Alerts

- [ ] **Sentry Alert Test**
  ```javascript
  // Trigger test error
  throw new Error('Test Sentry alert');
  ```

- [ ] **Vercel Alert Test**
  ```bash
  # Trigger function error
  curl https://oto-burada.com/api/test-error
  ```

- [ ] **Supabase Alert Test**
  ```sql
  -- Trigger slow query alert
  SELECT pg_sleep(2);
  ```

- [ ] **Custom Metric Alert Test**
  ```bash
  # Trigger rate limit
  for i in {1..1000}; do
    curl https://oto-burada.com/api/listings &
  done
  ```

#### 5.2 Verify Alert Delivery

- [ ] **Check Email Notifications**
  - Verify emails received
  - Check email formatting
  - Verify actionable information

- [ ] **Check Slack Notifications**
  - Verify Slack messages received
  - Check message formatting
  - Verify links work

### Phase 6: Documentation

#### 6.1 Create Runbook

- [ ] **Incident Response Runbook**
  ```markdown
  # Incident Response Runbook
  
  ## High Error Rate
  1. Check Sentry dashboard
  2. Identify error pattern
  3. Check recent deployments
  4. Rollback if necessary
  
  ## Database Performance Issues
  1. Check Supabase dashboard
  2. Identify slow queries
  3. Check connection pool
  4. Scale if necessary
  
  ## Payment Issues
  1. Check Iyzico dashboard
  2. Verify webhook delivery
  3. Check payment logs
  4. Contact Iyzico support if needed
  ```

- [ ] **Monitoring Dashboard Guide**
  ```markdown
  # Monitoring Dashboard Guide
  
  ## Sentry
  - URL: [Sentry URL]
  - Login: [Credentials]
  - Key Metrics: Error rate, new errors
  
  ## Vercel
  - URL: [Vercel URL]
  - Login: [Credentials]
  - Key Metrics: Function errors, build status
  
  ## Supabase
  - URL: [Supabase URL]
  - Login: [Credentials]
  - Key Metrics: Database CPU, connections
  ```

#### 6.2 Update Documentation

- [ ] **Update PROGRESS.md**
  ```markdown
  ## Phase 28.5 - Production Deployment ✅
  - [x] Security fixes deployed
  - [x] Monitoring configured
  - [x] Alerts tested
  - [x] Documentation updated
  ```

- [ ] **Update README.md**
  - Add monitoring section
  - Update deployment instructions
  - Add troubleshooting guide

---

## ✅ Kabul Kriterleri

### Deployment Success
- [x] Staging deployment successful
- [x] All smoke tests passed
- [x] Production deployment successful
- [x] No critical errors in first hour
- [x] Rollback plan verified

### Monitoring Setup
- [x] Sentry configured and tested
- [x] Vercel monitoring configured
- [x] Supabase monitoring configured
- [x] Custom metrics dashboard created
- [x] All alerts configured and tested

### Documentation
- [x] Runbook created
- [x] Monitoring guide created
- [x] PROGRESS.md updated
- [x] README.md updated

---

## 📊 Çıktılar

### 1. Deployment Report
```markdown
# Deployment Report - v28.5

**Date**: [Date]
**Deployed By**: [Name]
**Status**: ✅ Successful

## Changes Deployed
- 16 critical security fixes
- 2 database migrations
- TypeScript error fixes
- ESLint warning fixes

## Deployment Timeline
- Staging: [Time]
- Production: [Time]
- Total Duration: [Duration]

## Issues Encountered
- [None or list issues]

## Rollback Status
- Rollback tested: ✅
- Rollback time: < 5 minutes
```

### 2. Monitoring Dashboard URLs
```markdown
# Monitoring Dashboards

## Sentry
- URL: https://sentry.io/organizations/your-org/projects/oto-burada/
- Status: ✅ Active

## Vercel
- URL: https://vercel.com/your-team/oto-burada
- Status: ✅ Active

## Supabase
- URL: https://app.supabase.com/project/your-project
- Status: ✅ Active

## Custom Dashboard
- URL: [Custom dashboard URL]
- Status: ✅ Active
```

### 3. Alert Configuration
```markdown
# Alert Configuration

## Sentry Alerts
- Error rate > 5%: ✅ Configured
- New error type: ✅ Configured
- Performance degradation: ✅ Configured

## Vercel Alerts
- Function errors: ✅ Configured
- Build failures: ✅ Configured

## Supabase Alerts
- Database CPU: ✅ Configured
- Connection pool: ✅ Configured
- Slow queries: ✅ Configured
```

---

## 🚨 Rollback Procedures

### Quick Rollback (Vercel)
```bash
# Rollback to previous deployment
vercel rollback
```

### Git Rollback
```bash
# Revert to pre-audit state
git checkout v28.4-pre-audit
git push origin main --force
```

### Database Rollback
```bash
# Restore from backup (if needed)
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

---

## 📞 Escalation

### Contact Information
- **On-Call Engineer**: [Phone]
- **Tech Lead**: [Email]
- **DevOps Team**: [Slack Channel]

### Escalation Path
1. **Minor Issues**: Document and monitor
2. **Major Issues**: Contact on-call engineer
3. **Critical Issues**: Rollback and escalate to tech lead

---

## 📚 Referanslar

- `DEPLOYMENT_CHECKLIST.md` - Detailed deployment procedures
- `AUDIT_SUMMARY.md` - Security audit summary
- `CRITICAL_FIXES_APPLIED.md` - Fix documentation
- Vercel Documentation: https://vercel.com/docs
- Sentry Documentation: https://docs.sentry.io
- Supabase Documentation: https://supabase.com/docs

---

**Ajan**: DevOps Automator  
**Başlangıç**: [Tarih]  
**Bitiş**: [Tarih]  
**Durum**: 🔴 Bekliyor → 🟡 Devam Ediyor → ✅ Tamamlandı
