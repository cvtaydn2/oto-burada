# Incident Response Runbook

**Version**: 1.0  
**Last Updated**: 2026-04-30  
**Owner**: DevOps Team

---

## 🚨 Emergency Contacts

### On-Call Rotation
- **Primary**: DevOps Automator
- **Secondary**: Technical Lead
- **Escalation**: CTO

### Communication Channels
- **Slack**: #incidents
- **Email**: devops@otoburada.com
- **Phone**: [Emergency Number]

---

## 📊 Monitoring Dashboards

### Sentry (Error Tracking)
- **URL**: https://sentry.io/organizations/your-org/projects/oto-burada/
- **Purpose**: Application errors, performance issues
- **Key Metrics**: Error rate, new errors, performance degradation

### Vercel (Deployment & Functions)
- **URL**: https://vercel.com/your-team/oto-burada
- **Purpose**: Deployment status, function execution, logs
- **Key Metrics**: Function errors, build status, response times

### Supabase (Database & Backend)
- **URL**: https://app.supabase.com/project/your-project
- **Purpose**: Database performance, RPC execution, storage
- **Key Metrics**: Database CPU, connections, query times

---

## 🔥 Incident Response Procedures

### Severity Levels

#### 🔴 P0 - Critical (Immediate Response)
- **Definition**: Complete service outage, data loss, security breach
- **Response Time**: Immediate (< 5 minutes)
- **Examples**: Site down, database unavailable, payment system failure

#### 🟡 P1 - High (Urgent Response)
- **Definition**: Major feature broken, significant user impact
- **Response Time**: < 30 minutes
- **Examples**: Login broken, listing creation fails, search not working

#### 🟢 P2 - Medium (Standard Response)
- **Definition**: Minor feature issue, limited user impact
- **Response Time**: < 2 hours
- **Examples**: Image upload slow, notification delay, UI glitch

#### 🔵 P3 - Low (Scheduled Response)
- **Definition**: Cosmetic issue, no user impact
- **Response Time**: Next business day
- **Examples**: Typo, minor styling issue, log noise

---

## 🚑 Common Incidents & Solutions

### 1. High Error Rate

#### Symptoms
- Sentry alert: Error rate > 5%
- Multiple user complaints
- Increased 500 errors in logs

#### Diagnosis
```bash
# Check Sentry dashboard
# URL: https://sentry.io/organizations/your-org/projects/oto-burada/

# Check recent deployments
vercel ls

# Check Vercel logs
vercel logs --follow
```

#### Resolution Steps
1. **Identify Error Pattern**
   - Check Sentry for error type and frequency
   - Identify affected routes/functions
   - Check if error started after recent deployment

2. **Quick Fix Options**
   - If deployment-related: Rollback immediately
   - If code bug: Apply hotfix and deploy
   - If external service: Check service status

3. **Rollback Procedure**
   ```bash
   # Option 1: Vercel rollback
   vercel rollback
   
   # Option 2: Git rollback
   git checkout v28.4-pre-audit
   git push origin main --force
   ```

4. **Verify Resolution**
   - Monitor Sentry error rate
   - Check user reports
   - Verify affected features work

---

### 2. Database Performance Issues

#### Symptoms
- Supabase alert: CPU > 80%
- Slow query times
- Connection pool exhaustion
- Timeout errors

#### Diagnosis
```bash
# Check Supabase dashboard
# URL: https://app.supabase.com/project/your-project/database/performance

# Check slow queries
# Go to: Database > Query Performance
```

#### Resolution Steps
1. **Identify Slow Queries**
   - Check Supabase Query Performance tab
   - Look for queries with execution time > 1s
   - Identify missing indexes

2. **Immediate Actions**
   - Kill long-running queries if necessary
   - Scale database if needed (Supabase dashboard)
   - Enable connection pooling if not already

3. **Long-term Fixes**
   - Add missing indexes
   - Optimize slow queries
   - Review RLS policies for performance
   - Consider query caching

4. **Verify Resolution**
   - Monitor database CPU
   - Check query execution times
   - Verify connection pool usage

---

### 3. Payment System Failure

#### Symptoms
- Payment initialization fails
- Webhook not received
- Payment status not updated
- User complaints about payments

#### Diagnosis
```bash
# Check Iyzico dashboard
# URL: https://merchant.iyzipay.com

# Check payment logs
vercel logs --filter="/api/payments"

# Check Sentry for payment errors
# Search: "payment" OR "iyzico"
```

#### Resolution Steps
1. **Verify Iyzico Status**
   - Check Iyzico merchant dashboard
   - Verify API credentials are valid
   - Check for Iyzico service outages

2. **Check Webhook Delivery**
   - Verify webhook URL is accessible
   - Check webhook logs in database
   - Verify signature validation

3. **Manual Reconciliation**
   - Compare Iyzico transactions with database
   - Identify missing/failed payments
   - Manually update payment status if needed

4. **Contact Iyzico Support**
   - If issue persists, contact Iyzico
   - Provide transaction IDs and timestamps
   - Request investigation

---

### 4. Rate Limiting Issues

#### Symptoms
- Users reporting "Too Many Requests" errors
- Legitimate traffic being blocked
- Rate limit bypass not working

#### Diagnosis
```bash
# Check Upstash Redis dashboard
# URL: https://console.upstash.com

# Check rate limit logs
vercel logs --filter="rate limit"

# Check Redis connection
# Verify UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
```

#### Resolution Steps
1. **Verify Redis Connection**
   - Check Upstash dashboard for connectivity
   - Verify environment variables are set
   - Test Redis connection

2. **Adjust Rate Limits**
   - If legitimate traffic blocked, increase limits
   - If under attack, decrease limits
   - Consider IP-based rate limiting

3. **Bypass for Trusted IPs**
   - Add trusted IPs to `RATE_LIMIT_BYPASS_IPS`
   - Verify bypass is working
   - Document bypass reasons

4. **Monitor Effectiveness**
   - Check rate limit trigger counts
   - Verify legitimate traffic not blocked
   - Monitor for abuse patterns

---

### 5. Chat Rate Limit Trigger Issues

#### Symptoms
- Users unable to send messages
- Rate limit triggered incorrectly
- Database trigger errors

#### Diagnosis
```sql
-- Check rate limit trigger status
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'check_message_rate_limit';

-- Check recent messages
SELECT 
  chat_id,
  COUNT(*) as message_count,
  MAX(created_at) as last_message
FROM messages
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY chat_id
HAVING COUNT(*) > 90
ORDER BY message_count DESC;
```

#### Resolution Steps
1. **Verify Trigger Exists**
   - Check if trigger is active
   - Verify function logic is correct
   - Check for trigger errors in logs

2. **Adjust Rate Limit**
   - If too restrictive, increase limit
   - If too permissive, decrease limit
   - Consider per-user vs per-chat limits

3. **Temporary Bypass**
   ```sql
   -- Disable trigger temporarily
   ALTER TABLE messages DISABLE TRIGGER enforce_message_rate_limit;
   
   -- Re-enable after fix
   ALTER TABLE messages ENABLE TRIGGER enforce_message_rate_limit;
   ```

4. **Monitor Effectiveness**
   - Check spam prevention
   - Verify legitimate users not blocked
   - Monitor trigger execution times

---

### 6. Atomic Ban Operation Failures

#### Symptoms
- User ban doesn't reject listings
- Partial ban state (user banned but listings active)
- Trust guard metadata lost

#### Diagnosis
```sql
-- Check ban_user_atomic function
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'ban_user_atomic';

-- Check for partial ban states
SELECT 
  u.id,
  u.email,
  u.is_banned,
  u.ban_reason,
  COUNT(l.id) as active_listings
FROM profiles u
LEFT JOIN listings l ON l.seller_id = u.id AND l.status = 'active'
WHERE u.is_banned = true
GROUP BY u.id, u.email, u.is_banned, u.ban_reason
HAVING COUNT(l.id) > 0;
```

#### Resolution Steps
1. **Verify Function Exists**
   - Check if RPC function is deployed
   - Verify function signature is correct
   - Check for function errors in logs

2. **Manual Cleanup**
   ```sql
   -- Reject listings for banned users
   UPDATE listings
   SET 
     status = 'rejected',
     rejection_reason = 'User banned',
     updated_at = NOW()
   WHERE seller_id IN (
     SELECT id FROM profiles WHERE is_banned = true
   )
   AND status = 'active';
   ```

3. **Verify Trust Guard Metadata**
   - Check if ban_reason is preserved
   - Verify banned_at timestamp
   - Check banned_by admin ID

4. **Monitor Future Bans**
   - Verify atomic operation works
   - Check for transaction failures
   - Monitor ban operation logs

---

### 7. Deployment Failures

#### Symptoms
- Build fails on Vercel
- Deployment stuck
- New deployment not live

#### Diagnosis
```bash
# Check Vercel deployment status
vercel ls

# Check build logs
vercel logs --build

# Check for TypeScript/ESLint errors
npm run typecheck
npm run lint
```

#### Resolution Steps
1. **Identify Build Error**
   - Check Vercel build logs
   - Look for TypeScript errors
   - Check for missing dependencies

2. **Fix Build Error**
   - Fix TypeScript errors locally
   - Fix ESLint warnings
   - Update dependencies if needed

3. **Redeploy**
   ```bash
   # Push fix to main
   git add .
   git commit -m "fix: resolve build error"
   git push origin main
   
   # Or trigger manual deployment
   vercel --prod
   ```

4. **Verify Deployment**
   - Check deployment status
   - Verify new version is live
   - Run smoke tests

---

## 🔄 Rollback Procedures

### Quick Rollback (Vercel)
```bash
# Rollback to previous deployment
vercel rollback

# Verify rollback
curl https://oto-burada.com/api/health-check
```

### Git Rollback
```bash
# Rollback to specific tag
git checkout v28.4-pre-audit
git push origin main --force

# Verify rollback
git log -1
```

### Database Rollback
```sql
-- Rollback Migration 0134 (Chat Rate Limit)
DROP TRIGGER IF EXISTS enforce_message_rate_limit ON messages;
DROP FUNCTION IF EXISTS check_message_rate_limit();
DELETE FROM public._migrations WHERE name = '0134_chat_rate_limit_trigger.sql';

-- Rollback Migration 0135 (Atomic Ban)
DROP FUNCTION IF EXISTS ban_user_atomic(uuid, text, boolean);
DELETE FROM public._migrations WHERE name = '0135_atomic_ban_user.sql';
```

---

## 📝 Post-Incident Checklist

After resolving an incident:

1. **Document Incident**
   - Create incident report
   - Document root cause
   - Document resolution steps
   - Document lessons learned

2. **Update Runbook**
   - Add new incident type if needed
   - Update resolution steps
   - Add prevention measures

3. **Communicate Resolution**
   - Notify affected users
   - Update status page
   - Post mortem to team

4. **Prevent Recurrence**
   - Implement monitoring
   - Add alerts
   - Update tests
   - Improve documentation

---

## 📊 Monitoring Checklist

### Daily Checks
- [ ] Check Sentry error rate
- [ ] Check Vercel deployment status
- [ ] Check Supabase database health
- [ ] Review user reports

### Weekly Checks
- [ ] Review slow queries
- [ ] Check rate limit effectiveness
- [ ] Review payment reconciliation
- [ ] Update documentation

### Monthly Checks
- [ ] Review incident reports
- [ ] Update runbook
- [ ] Review monitoring alerts
- [ ] Conduct incident drills

---

## 🔗 Useful Links

### Documentation
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- [AUDIT_SUMMARY.md](./AUDIT_SUMMARY.md)
- [CRITICAL_FIXES_APPLIED.md](./CRITICAL_FIXES_APPLIED.md)

### External Services
- [Vercel Documentation](https://vercel.com/docs)
- [Sentry Documentation](https://docs.sentry.io)
- [Supabase Documentation](https://supabase.com/docs)
- [Iyzico Documentation](https://dev.iyzipay.com)

### Internal Tools
- [Migration Manager](./scripts/migration-manager.mjs)
- [Diagnose Production](./scripts/diagnose-production.mjs)
- [Verify Production Env](./scripts/verify-production-env.mjs)

---

**Runbook Version**: 1.0  
**Last Updated**: 2026-04-30  
**Next Review**: 2026-05-30
