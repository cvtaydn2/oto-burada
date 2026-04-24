# Security Documentation

## Overview

This document outlines the security measures implemented in OtoBurada to protect against common vulnerabilities and ensure safe payment processing.

## Critical Security Fixes (April 2026)

### 1. Iyzico Webhook Signature Verification

**Issue**: Webhook endpoints were not verifying the authenticity of requests from Iyzico, allowing potential payment fraud.

**Fix**: Implemented HMAC-SHA256 signature verification in `src/lib/utils/iyzico-webhook.ts`:
- All webhook requests must include `x-iyzi-signature` header
- Signature is verified using timing-safe comparison
- Invalid signatures are logged and rejected with 403 status

**Configuration Required**:
```env
IYZICO_SECRET_KEY=your_secret_key_here
```

### 2. Payment Callback Validation

**Issue**: Payment callback could be manipulated to activate expensive doping packages with cheap payments.

**Fixes**:
- Package ID now stored in dedicated `package_id` column (not metadata)
- Payment amount validated against package price
- Listing ownership verified before doping activation
- All validations logged for audit trail

### 3. Payment Service - Identity Number

**Issue**: Hardcoded TC identity number (11111111111) used for all payments.

**Fix**:
- ✅ Added `identity_number` column to profiles table (migration 0063)
- ✅ Production: Identity number **required** from user profile
- ✅ Development: Uses test value (11111111111) if not provided
- ✅ Clear error message if missing: "Ödeme yapabilmek için TC Kimlik Numaranızı profil ayarlarınızdan eklemeniz gerekmektedir."
- ✅ RLS policies: users can only see/update their own identity number

**KVKK Compliance**:
- Identity number is sensitive personal data (Hassas Kişisel Veri)
- Stored in `profiles.identity_number` column
- Consider pgcrypto encryption for production
- Never logged in plain text
- Never exposed in API responses (except to owner via RLS)

**User Flow**:
1. User attempts payment
2. System checks `profiles.identity_number`
3. If missing in production → Error with clear message
4. User adds identity number in profile settings
5. Retry payment

### 4. API Route Security

**Issue**: Chat and payment endpoints lacked proper security middleware.

**Fixes**:
- All mutation endpoints now use `withUserAndCsrf` middleware
- Read endpoints use `withUserRoute` middleware
- Rate limiting applied to all critical endpoints
- IP addresses normalized to prevent subnet rotation attacks

## Security Middleware

### Authentication & CSRF Protection

```typescript
import { withUserAndCsrf } from "@/lib/utils/api-security";

const security = await withUserAndCsrf(req, {
  userRateLimit: rateLimitProfiles.general,
  rateLimitKey: "endpoint:action",
});

if (!security.ok) {
  return security.response;
}
```

### Rate Limiting Profiles

| Profile | Limit | Window | Fail-Closed |
|---------|-------|--------|-------------|
| auth | 10 | 15 min | Yes |
| listingCreate | 10 | 1 hour | No |
| imageUpload | 30 | 1 hour | No |
| reportCreate | 5 | 1 hour | No |
| adminModerate | 30 | 1 min | Yes |
| general | 60 | 1 min | No |

**Fail-Closed**: When enabled, requests are blocked if rate limiting infrastructure (Redis/Supabase) is unavailable. Used for critical endpoints (auth, payments, admin).

## Payment Callback Security

### Architecture

The payment callback endpoint (`/api/payments/callback`) is called by the **user's browser** after Iyzico redirects them back. This means:

1. **We CANNOT verify Iyzico signature** - the request doesn't come from Iyzico servers
2. **The token could be manipulated** - users can modify the URL before submitting

### Defense Strategy

We use a **defense-in-depth** approach:

1. **Token Validation**: Token is validated against Iyzico API (server-to-server)
2. **Authoritative Source**: Payment status fetched directly from Iyzico, not from request
3. **Idempotency**: `fulfilled_at` timestamp prevents double-processing
4. **Server-Side Validation**: All checks happen server-side (amount, ownership, package)
5. **Webhook Authority**: Webhook (with signature) is the authoritative confirmation source

### Flow

```
User Browser → Callback Endpoint → Iyzico API (verify token)
                                 ↓
                          Database (check fulfilled_at)
                                 ↓
                          Apply Doping (if not fulfilled)
                                 ↓
                          Mark as fulfilled
```

**Key Point**: Callback is for **UX only**. The webhook (with signature verification) is the authoritative source for payment confirmation.

Before processing any payment:

- [ ] User authentication verified
- [ ] CSRF token validated
- [ ] Rate limit checked
- [ ] Profile fields validated (full_name, phone)
- [ ] Package ID stored in database
- [ ] IP address normalized and logged

After payment callback:

- [ ] Webhook signature verified (if webhook)
- [ ] Payment status is "success"
- [ ] Package exists in DOPING_PACKAGES
- [ ] Payment amount matches package price (±0.01 tolerance)
- [ ] Listing belongs to paying user
- [ ] Doping activation logged

## Database Security

### Row Level Security (RLS)

All tables use RLS policies. Key patterns:

```sql
-- Use (SELECT auth.uid()) for better performance
CREATE POLICY "Users can view own data"
ON profiles FOR SELECT
USING ((SELECT auth.uid()) = id);

-- Admin bypass with security definer functions
CREATE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;
```

### Indexes

All foreign keys are indexed for performance:
- `listings(user_id)`
- `payments(user_id, listing_id, plan_id, package_id)`
- `favorites(user_id, listing_id)`
- `reports(listing_id, reported_by)`

## IP Address Handling

### Anti-Spoofing

Priority order for IP extraction:
1. `x-real-ip` (Vercel edge)
2. `cf-connecting-ip` (Cloudflare)
3. `x-forwarded-for` (first element only)

### IPv6 Normalization

IPv6 addresses normalized to /64 subnet to prevent lease rotation attacks:
```typescript
// 2001:0db8:85a3:0000:0000:8a2e:0370:7334
// becomes: 2001:0db8:85a3:0000::/64
```

## Webhook Security

### Iyzico Webhook Endpoint

**URL**: `/api/payments/webhook`

**Security Measures**:
- Signature verification (HMAC-SHA256)
- All requests logged to `payment_webhook_logs`
- Invalid signatures logged and rejected
- Idempotency via `webhook_attempts` counter

**IP Whitelist** (TODO):
Document Iyzico's webhook IP addresses and configure firewall rules.

## Environment Variables

### Required for Production

```env
# Iyzico Payment Gateway
IYZICO_API_KEY=your_api_key
IYZICO_SECRET_KEY=your_secret_key
IYZICO_BASE_URL=https://api.iyzipay.com

# Security
CRON_SECRET=random_64_char_string
INTERNAL_API_SECRET=random_64_char_string

# Rate Limiting
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Secret Generation

```bash
# Generate strong secrets
openssl rand -hex 32
```

## Monitoring & Logging

### Structured Logging

All security events logged via `logger.api`:

```typescript
import { logger } from "@/lib/utils/logger";

logger.api.warn("Invalid webhook signature", {
  hasSignature: !!signature,
  eventType: body.iyziEventType,
});
```

### Key Events to Monitor

- Invalid webhook signatures
- Payment amount mismatches
- Listing ownership violations
- Rate limit violations
- Failed authentication attempts
- Admin actions

## Incident Response

### Payment Fraud Detection

If suspicious payment activity detected:

1. Check `payment_webhook_logs` for signature validation
2. Query `payments` table for amount mismatches
3. Check `doping_logs` for unauthorized activations
4. Review user's recent activity in `audit_logs`

### User Ban

```sql
-- Ban user and hide all listings
UPDATE profiles SET is_banned = true WHERE id = 'user_id';

-- Listings automatically hidden via RLS policies
-- Check: SELECT * FROM listings WHERE user_id = 'user_id';
-- Should return empty for non-admin users
```

## Testing Security

### Webhook Signature Testing

```bash
# Generate test signature
echo -n '{"test":"data"}' | openssl dgst -sha256 -hmac "your_secret_key"

# Test webhook endpoint
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-iyzi-signature: generated_signature" \
  -d '{"test":"data"}'
```

### Rate Limit Testing

```bash
# Test rate limiting
for i in {1..70}; do
  curl http://localhost:3000/api/chats
done
# Should return 429 after 60 requests
```

## Compliance

### KVKK (Turkish GDPR)

- User data stored in Supabase (EU region recommended)
- Personal data (phone, email) encrypted at rest
- User can request data deletion via support
- Audit logs retained for 1 year

### PCI DSS

- No credit card data stored in our database
- All payment processing via Iyzico (PCI DSS compliant)
- Payment tokens stored, not card details

## Future Improvements

### High Priority

1. **SMS OTP Verification**: Add phone verification before payments
2. **2FA for Admin**: Require two-factor authentication for admin panel
3. **Virus Scanning**: Scan uploaded images for malware
4. **Identity Verification**: Implement proper TC identity number collection and validation

### Medium Priority

1. **OpenAPI Documentation**: Generate API docs with security requirements
2. **Dependency Scanning**: Add `npm audit` to CI/CD pipeline
3. **Backup Strategy**: Document disaster recovery procedures
4. **CDN/Edge Caching**: Implement caching strategy for static assets

### Low Priority

1. **Security Headers**: Add additional CSP directives
2. **Penetration Testing**: Schedule regular security audits
3. **Bug Bounty Program**: Consider public bug bounty after stable release

## Contact

For security issues, contact: security@otoburada.com (TODO: Set up email)

**Do not** disclose security vulnerabilities publicly. Use responsible disclosure.
