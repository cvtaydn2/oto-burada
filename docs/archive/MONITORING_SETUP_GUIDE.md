# Monitoring Setup Guide

**Version**: 1.0  
**Last Updated**: 2026-04-30  
**Status**: Production Ready

---

## 📊 Overview

This guide covers the complete monitoring setup for OtoBurada production environment, including:
- Sentry (Error Tracking & Performance)
- Vercel (Deployment & Functions)
- Supabase (Database & Backend)
- Custom Metrics Dashboard

---

## 🎯 Monitoring Goals

### Technical Metrics
- **Error Rate**: < 0.1%
- **Response Time**: < 200ms (p95)
- **Database Query Time**: < 50ms (p95)
- **Uptime**: > 99.9%

### Business Metrics
- **User Registration Conversion**: > 5%
- **Listing Creation Completion**: > 80%
- **Search to Listing View**: > 30%
- **Listing View to Contact**: > 10%

---

## 1. Sentry Configuration

### 1.1 Setup

#### Create Sentry Project
1. Go to: https://sentry.io
2. Create account (FREE tier: 5,000 errors/month)
3. Create new project:
   - Platform: Next.js
   - Project name: oto-burada
   - Alert frequency: Real-time

#### Get DSN
```bash
# Copy DSN from Sentry dashboard
# Format: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

#### Set Environment Variables
```bash
# In Vercel dashboard
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### 1.2 Alert Configuration

#### Error Rate Alert
- **Name**: High Error Rate
- **Condition**: Error rate > 5% in 5 minutes
- **Action**: Email + Slack notification
- **Frequency**: Immediate

**Setup Steps**:
1. Go to: Sentry > Alerts > Create Alert
2. Select: "Errors"
3. Configure:
   ```
   When: error count
   Is: greater than 50
   In: 5 minutes
   Then: Send notification to #incidents
   ```

#### New Error Type Alert
- **Name**: New Error Detected
- **Condition**: New error type appears
- **Action**: Email notification
- **Frequency**: Immediate

**Setup Steps**:
1. Go to: Sentry > Alerts > Create Alert
2. Select: "Issues"
3. Configure:
   ```
   When: a new issue is created
   Then: Send notification to devops@otoburada.com
   ```

#### Performance Degradation Alert
- **Name**: Slow Response Time
- **Condition**: P95 response time > 1s
- **Action**: Slack notification
- **Frequency**: Every 15 minutes

**Setup Steps**:
1. Go to: Sentry > Performance > Alerts
2. Create alert:
   ```
   When: p95(transaction.duration)
   Is: greater than 1000ms
   In: 15 minutes
   Then: Send notification to #performance
   ```

### 1.3 Performance Monitoring

#### Enable Performance Monitoring
```typescript
// Already configured in src/lib/monitoring/sentry-client.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of transactions
  profilesSampleRate: 0.1, // 10% of transactions
});
```

#### Key Transactions to Monitor
- `/api/listings` - Listing search
- `/api/listings/[id]` - Listing detail
- `/api/payments/initialize` - Payment initialization
- `/api/auth/callback` - Authentication
- `/listing/[slug]` - Public listing page

### 1.4 Custom Context

#### User Context
```typescript
// Automatically set in middleware
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.email,
});
```

#### Custom Tags
```typescript
// Add custom tags for better filtering
Sentry.setTag("feature", "listings");
Sentry.setTag("environment", "production");
```

---

## 2. Vercel Monitoring

### 2.1 Setup

#### Enable Analytics
1. Go to: Vercel Dashboard > Analytics
2. Enable: Web Analytics
3. Enable: Speed Insights
4. Enable: Audience Insights

#### Configure Log Drains (Optional)
1. Go to: Vercel Dashboard > Settings > Log Drains
2. Add drain:
   - Type: HTTP
   - URL: Your log aggregation service
   - Format: JSON

### 2.2 Alert Configuration

#### Function Error Alert
- **Name**: Function Errors
- **Condition**: Function error rate > 1%
- **Action**: Email notification

**Setup Steps**:
1. Go to: Vercel Dashboard > Settings > Notifications
2. Enable: Function Errors
3. Configure:
   ```
   Threshold: 1%
   Recipients: devops@otoburada.com
   ```

#### Build Failure Alert
- **Name**: Build Failed
- **Condition**: Build fails
- **Action**: Email + Slack notification

**Setup Steps**:
1. Go to: Vercel Dashboard > Settings > Notifications
2. Enable: Build Failures
3. Configure:
   ```
   Recipients: devops@otoburada.com, #deployments
   ```

### 2.3 Custom Events

#### Track Business Events
```typescript
// In components
import { track } from '@vercel/analytics';

// Track listing creation
track('listing_created', {
  category: 'engagement',
  label: 'new_listing',
});

// Track payment
track('payment_completed', {
  category: 'conversion',
  value: amount,
});
```

---

## 3. Supabase Monitoring

### 3.1 Setup

#### Enable Database Insights
1. Go to: Supabase Dashboard > Database > Performance
2. Enable: Query Performance Insights
3. Enable: Index Advisor

#### Configure Alerts
1. Go to: Supabase Dashboard > Settings > Alerts
2. Enable email notifications

### 3.2 Alert Configuration

#### Database CPU Alert
- **Name**: High Database CPU
- **Condition**: CPU > 80% for 5 minutes
- **Action**: Email notification

**Setup Steps**:
1. Go to: Supabase Dashboard > Settings > Alerts
2. Enable: High CPU Usage
3. Configure:
   ```
   Threshold: 80%
   Duration: 5 minutes
   Recipients: devops@otoburada.com
   ```

#### Connection Pool Alert
- **Name**: Connection Pool Exhaustion
- **Condition**: Connections > 90% of limit
- **Action**: Email notification

**Setup Steps**:
1. Go to: Supabase Dashboard > Settings > Alerts
2. Enable: High Connection Count
3. Configure:
   ```
   Threshold: 90%
   Recipients: devops@otoburada.com
   ```

#### Slow Query Alert
- **Name**: Slow Queries Detected
- **Condition**: Query time > 1s
- **Action**: Email notification

**Setup Steps**:
1. Go to: Supabase Dashboard > Database > Performance
2. Enable: Slow Query Alerts
3. Configure:
   ```
   Threshold: 1000ms
   Recipients: devops@otoburada.com
   ```

### 3.3 RPC Performance Monitoring

#### Monitor Custom Functions
```sql
-- Check RPC execution times
SELECT 
  proname as function_name,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_user_functions
WHERE proname IN (
  'ban_user_atomic',
  'check_message_rate_limit'
)
ORDER BY total_time DESC;
```

#### Set Up Monitoring Query
```sql
-- Create view for monitoring
CREATE OR REPLACE VIEW monitoring.rpc_performance AS
SELECT 
  proname as function_name,
  calls,
  total_time,
  mean_time,
  max_time,
  NOW() as checked_at
FROM pg_stat_user_functions
WHERE schemaname = 'public'
ORDER BY total_time DESC;
```

---

## 4. Custom Metrics Dashboard

### 4.1 Application Metrics

#### Request Rate
```typescript
// Track in middleware
export async function middleware(request: NextRequest) {
  const start = Date.now();
  
  // Process request
  const response = NextResponse.next();
  
  // Log metrics
  const duration = Date.now() - start;
  console.log(JSON.stringify({
    type: 'request',
    path: request.nextUrl.pathname,
    method: request.method,
    duration,
    status: response.status,
  }));
  
  return response;
}
```

#### Error Rate
```typescript
// Track in error boundary
export function ErrorBoundary({ error }: { error: Error }) {
  useEffect(() => {
    // Log to monitoring
    console.error(JSON.stringify({
      type: 'error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    }));
    
    // Send to Sentry
    Sentry.captureException(error);
  }, [error]);
}
```

### 4.2 Business Metrics

#### User Registration
```typescript
// Track in registration handler
export async function registerUser(data: RegisterData) {
  const result = await createUser(data);
  
  // Log metric
  console.log(JSON.stringify({
    type: 'business_metric',
    event: 'user_registered',
    timestamp: new Date().toISOString(),
  }));
  
  return result;
}
```

#### Listing Creation
```typescript
// Track in listing creation handler
export async function createListing(data: ListingData) {
  const result = await insertListing(data);
  
  // Log metric
  console.log(JSON.stringify({
    type: 'business_metric',
    event: 'listing_created',
    category: data.category,
    timestamp: new Date().toISOString(),
  }));
  
  return result;
}
```

### 4.3 Security Metrics

#### Chat Rate Limit Triggers
```sql
-- Query to check rate limit triggers
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  chat_id,
  COUNT(*) as message_count
FROM messages
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour, chat_id
HAVING COUNT(*) > 90
ORDER BY hour DESC, message_count DESC;
```

#### Atomic Ban Operations
```sql
-- Query to check ban operations
SELECT 
  DATE_TRUNC('day', banned_at) as day,
  COUNT(*) as ban_count,
  COUNT(CASE WHEN ban_reason LIKE '%Account Deleted%' THEN 1 END) as deleted_count
FROM profiles
WHERE is_banned = true
  AND banned_at > NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;
```

#### CSRF Token Failures
```typescript
// Track in CSRF middleware
export async function validateCsrfToken(token: string) {
  const isValid = await verifyToken(token);
  
  if (!isValid) {
    // Log metric
    console.log(JSON.stringify({
      type: 'security_metric',
      event: 'csrf_token_failure',
      timestamp: new Date().toISOString(),
    }));
  }
  
  return isValid;
}
```

---

## 5. Alert Testing

### 5.1 Test Sentry Alerts

#### Trigger Test Error
```typescript
// In browser console or test endpoint
throw new Error('Test Sentry alert - please ignore');
```

#### Verify Alert Delivery
1. Check email inbox
2. Check Slack #incidents channel
3. Verify alert appears in Sentry dashboard

### 5.2 Test Vercel Alerts

#### Trigger Function Error
```bash
# Create test endpoint that throws error
curl https://oto-burada.com/api/test-error
```

#### Verify Alert Delivery
1. Check email inbox
2. Check Vercel dashboard
3. Verify error appears in logs

### 5.3 Test Supabase Alerts

#### Trigger Slow Query
```sql
-- Run slow query
SELECT pg_sleep(2);
```

#### Verify Alert Delivery
1. Check email inbox
2. Check Supabase dashboard
3. Verify query appears in performance tab

### 5.4 Test Rate Limit Alerts

#### Trigger Rate Limit
```bash
# Send many requests rapidly
for i in {1..1000}; do
  curl https://oto-burada.com/api/listings &
done
```

#### Verify Rate Limit Works
1. Check for 429 responses
2. Check Redis dashboard
3. Verify rate limit logs

---

## 6. Dashboard Setup

### 6.1 Grafana (Optional)

#### Setup
1. Create Grafana Cloud account (FREE tier)
2. Add data sources:
   - Vercel (via API)
   - Supabase (via PostgreSQL)
   - Custom metrics (via HTTP)

#### Create Dashboards
1. **Application Health**
   - Request rate
   - Error rate
   - Response time (p50, p95, p99)
   - Active users

2. **Database Performance**
   - Query execution time
   - Connection pool usage
   - RPC call count
   - Slow queries

3. **Business Metrics**
   - User registrations
   - Listing creations
   - Favorites added
   - Payments processed

4. **Security Metrics**
   - Rate limit triggers
   - CSRF failures
   - Ban operations
   - Failed login attempts

### 6.2 Sentry (Optional)

#### Setup
1. Create Sentry account (FREE tier: 1M events/month)
2. Install Sentry SDK
3. Configure event tracking

#### Track Events
```typescript
// In components
import telemetry from 'telemetry shim';

// Track page view
telemetry.capture('$pageview');

// Track custom event
telemetry.capture('listing_created', {
  category: 'engagement',
  listing_id: listing.id,
});
```

---

## 7. Monitoring Checklist

### Daily Checks
- [ ] Check Sentry error rate
- [ ] Check Vercel deployment status
- [ ] Check Supabase database health
- [ ] Review user reports
- [ ] Check rate limit effectiveness

### Weekly Checks
- [ ] Review slow queries
- [ ] Check payment reconciliation
- [ ] Review security metrics
- [ ] Update documentation
- [ ] Review alert effectiveness

### Monthly Checks
- [ ] Review incident reports
- [ ] Update monitoring thresholds
- [ ] Review alert fatigue
- [ ] Conduct monitoring drills
- [ ] Update runbook

---

## 8. Troubleshooting

### Sentry Not Receiving Errors

#### Check Configuration
```typescript
// Verify Sentry is initialized
console.log('Sentry DSN:', process.env.NEXT_PUBLIC_SENTRY_DSN);

// Test Sentry
Sentry.captureMessage('Test message');
```

#### Verify Environment Variables
```bash
# In Vercel dashboard
vercel env ls production
```

### Vercel Alerts Not Working

#### Check Notification Settings
1. Go to: Vercel Dashboard > Settings > Notifications
2. Verify email is correct
3. Check spam folder

### Supabase Alerts Not Working

#### Check Alert Configuration
1. Go to: Supabase Dashboard > Settings > Alerts
2. Verify email is correct
3. Check alert thresholds

---

## 9. Best Practices

### Alert Fatigue Prevention
- Set appropriate thresholds
- Use alert grouping
- Implement alert escalation
- Regular alert review

### Monitoring Coverage
- Monitor all critical paths
- Track business metrics
- Monitor external dependencies
- Track security events

### Performance Optimization
- Use sampling for high-volume events
- Aggregate metrics before sending
- Use async logging
- Implement log rotation

### Security
- Sanitize sensitive data in logs
- Use secure log transmission
- Implement log retention policies
- Regular security audits

---

## 10. Resources

### Documentation
- [Sentry Documentation](https://docs.sentry.io)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/metrics)

### Tools
- [Sentry CLI](https://docs.sentry.io/product/cli/)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Community
- [Sentry Community](https://discord.gg/sentry)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Supabase Community](https://discord.supabase.com)

---

**Guide Version**: 1.0  
**Last Updated**: 2026-04-30  
**Next Review**: 2026-05-30
