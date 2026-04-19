# API Design & Business Logic Refactoring Plan

**Date**: 2026-04-19  
**Priority**: Orta (Medium) - Technical Debt  
**Status**: 📋 Planning Phase

---

## 🎯 Executive Summary

Current API routes mix orchestration, business logic, security checks, and data access in single files. While functional, this creates maintenance risks and makes security audits harder. This document outlines a phased refactoring plan to improve separation of concerns without breaking existing functionality.

**Key Principles**:
- ✅ Incremental refactoring (no big-bang rewrites)
- ✅ Backward compatible
- ✅ Security-first (never weaken existing protections)
- ✅ Test coverage before refactoring

---

## 📊 Current Issues Analysis

### 1. `/api/listings` Route - Bloated Orchestration

**File**: `src/app/api/listings/route.ts` (200+ lines)

**Current Flow** (POST):
```typescript
1. CSRF check
2. IP rate limit
3. Environment check
4. Parse JSON body
5. Form validation
6. Auth check
7. Listing limit check
8. User rate limit
9. Input normalization
10. Schema validation
11. ensureProfileRecord() ← SIDE-EFFECT
12. Profile fetch
13. Email verification check
14. Ban check
15. Slug collision prevention
16. Build listing
17. Create listing
18. Create notification
19. Track analytics
20. Return response
```

**Problems**:
- 🔴 **20 steps in single function** - hard to test, maintain, audit
- 🔴 **ensureProfileRecord() side-effect** - read operation mutates data
- 🟠 **Slug collision prevention** - `getExistingListingSlugs()` fetches ALL slugs (doesn't scale)
- 🟠 **Security step ordering** - easy to accidentally skip a check during refactoring

**Recommended Fix**:
```typescript
// Phase 1: Extract use case
class CreateListingUseCase {
  async execute(input: ListingCreateInput, userId: string) {
    // Business logic only
    await this.validateUserEligibility(userId);
    await this.checkListingLimits(userId);
    const listing = await this.buildAndCreateListing(input, userId);
    await this.sendNotifications(listing, userId);
    await this.trackAnalytics(listing);
    return listing;
  }
}

// Route becomes thin orchestrator
export async function POST(request: Request) {
  // Security layer
  const securityCheck = await validateRequest(request);
  if (!securityCheck.ok) return securityCheck.response;
  
  // Parse & validate
  const input = await parseAndValidate(request);
  if (!input.ok) return input.response;
  
  // Execute use case
  const useCase = new CreateListingUseCase();
  const result = await useCase.execute(input.data, securityCheck.userId);
  
  return apiSuccess(result);
}
```

---

### 2. `ensureProfileRecord()` Side-Effect in Read Operations

**Affected Files**:
- `src/app/api/listings/route.ts` (POST)
- `src/app/api/saved-searches/[searchId]/route.ts` (GET, PATCH, DELETE)
- `src/app/api/reports/route.ts` (POST)

**Problem**:
```typescript
// ❌ Read operation performs upsert
await ensureProfileRecord(user);
const profile = await getStoredProfileById(user.id);
```

**Impact**:
- 🟠 Unexpected mutations in GET requests
- 🟠 Audit log pollution
- 🟠 Violates HTTP semantics (GET should be idempotent)

**Fix** (Already implemented in previous PR):
```typescript
// ✅ Use read-only function
const profile = buildProfileFromAuthUser(user);

// ✅ Or explicit mutation in auth callback
await createOrUpdateProfile(user); // Only in auth flow
```

**Action**: Remove `ensureProfileRecord()` calls from all API routes

---

### 3. Slug Collision Prevention Doesn't Scale

**File**: `src/app/api/listings/route.ts`

**Current Implementation**:
```typescript
// ❌ Fetches ALL existing slugs into memory
const existingListings = await getExistingListingSlugs();
const createdListing = buildPendingListing(input, userId, existingListings);
```

**Problems**:
- 🔴 **Memory**: With 100k listings, loads 100k slugs into memory
- 🔴 **Race condition**: Two concurrent requests can generate same slug
- 🟠 **DB unique constraint mismatch**: App-level check races with DB constraint

**Recommended Fix**:
```typescript
// ✅ Option 1: DB unique constraint + retry
async function createListingWithUniqueSlug(input, userId, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const slug = generateSlug(input.title, attempt);
    try {
      return await db.listings.insert({ ...input, slug });
    } catch (error) {
      if (error.code === '23505' && attempt < maxRetries - 1) {
        continue; // Retry with different slug
      }
      throw error;
    }
  }
}

// ✅ Option 2: Targeted existence check
async function generateUniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let counter = 0;
  while (await slugExists(slug)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  return slug;
}
```

**Migration**:
1. Ensure DB unique constraint exists: `CREATE UNIQUE INDEX listings_slug_idx ON listings(slug)`
2. Implement retry logic
3. Remove `getExistingListingSlugs()` call

---

### 4. Inconsistent CSRF Protection

**Files with CSRF**:
- ✅ `src/app/api/listings/route.ts` (POST)
- ✅ `src/app/api/reports/route.ts` (POST)

**Files WITHOUT CSRF**:
- ❌ `src/app/api/support/tickets/route.ts` (POST)
- ❌ `src/app/api/saved-searches/[searchId]/route.ts` (PATCH, DELETE)
- ❌ `src/app/api/listings/images/route.ts` (POST, DELETE)
- ❌ `src/app/api/listings/documents/route.ts` (POST, DELETE)

**Problem**:
- 🟠 Inconsistent security posture
- 🟠 Easy to forget CSRF check in new endpoints
- 🟠 Cross-site request forgery risk for authenticated mutations

**Recommended Fix**:
```typescript
// ✅ Centralized security middleware
export async function withSecurity(
  request: Request,
  options: {
    requireAuth?: boolean;
    requireCsrf?: boolean;
    rateLimit?: RateLimitConfig;
  }
) {
  // CSRF check for mutations
  if (options.requireCsrf && !isValidRequestOrigin(request)) {
    return { ok: false, response: apiError(...) };
  }
  
  // Rate limiting
  if (options.rateLimit) {
    const limit = await enforceRateLimit(...);
    if (limit) return { ok: false, response: limit.response };
  }
  
  // Auth check
  if (options.requireAuth) {
    const user = await getCurrentUser();
    if (!user) return { ok: false, response: apiError(...) };
    return { ok: true, user };
  }
  
  return { ok: true };
}

// Usage
export async function POST(request: Request) {
  const security = await withSecurity(request, {
    requireAuth: true,
    requireCsrf: true,
    rateLimit: rateLimitProfiles.ticketCreate,
  });
  
  if (!security.ok) return security.response;
  
  // Business logic...
}
```

---

### 5. `sanitizeFileName()` Purpose Unclear

**Files**: 
- `src/app/api/listings/images/route.ts`
- `src/app/api/listings/documents/route.ts`

**Current Implementation**:
```typescript
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.+/g, ".")
    .substring(0, 200);
}

// But storage path is UUID-based:
const storagePath = buildListingImageStoragePath(userId, sanitizedFileName, mimeType);
// Returns: "listings/{userId}/{uuid}-{timestamp}.jpg"
```

**Problem**:
- 🟡 **Misleading**: Sanitization suggests security, but UUID path already prevents injection
- 🟡 **Unused**: Sanitized filename not actually used in storage path
- 🟡 **False confidence**: Developers might think this provides security

**Recommended Fix**:
```typescript
// ✅ Option 1: Remove if truly unused
// Storage path is UUID-based, filename sanitization unnecessary

// ✅ Option 2: Clarify purpose if used for display
/**
 * Sanitizes filename for DISPLAY purposes only.
 * Storage paths use UUIDs and are not affected by this.
 * This prevents XSS if filename is shown in UI without escaping.
 */
function sanitizeFileNameForDisplay(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.+/g, ".")
    .substring(0, 200);
}
```

---

### 6. Hardcoded URL Fallback

**File**: `src/app/api/saved-searches/notify/route.ts`

**Current Code**:
```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://otoburada.com";
```

**Problem**:
- 🟠 **Environment mismatch**: Fallback might not match actual deployment
- 🟠 **Email links broken**: If env var missing, emails link to wrong domain
- 🟡 **Silent failure**: No warning when fallback is used

**Recommended Fix**:
```typescript
// ✅ Fail-closed in production
function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_APP_URL must be set in production");
    }
    // Development fallback
    return "http://localhost:3000";
  }
  
  return url;
}

const appUrl = getAppUrl();
```

---

### 7. SSE/Redis Notification Complexity

**File**: `src/app/api/saved-searches/notify/route.ts`

**Current Implementation**:
- Dual-purpose endpoint: Cron job (GET) + SSE stream (GET with Accept header)
- Redis polling every 3 seconds for SSE
- No native pub/sub (Upstash HTTP limitation)

**Problems**:
- 🟠 **Operational complexity**: SSE + polling + cron in single endpoint
- 🟠 **Scalability**: Long-lived SSE connections in serverless
- 🟠 **Consistency**: Redis unavailable → notification system fails
- 🟡 **Vercel timeout**: Serverless functions have bounded execution time

**Recommended Alternatives**:

**Option 1: Simplify to Email-Only (MVP)**
```typescript
// Remove SSE complexity
// Keep only cron job for email notifications
// Use Supabase Realtime for in-app notifications
```

**Option 2: Separate Endpoints**
```typescript
// /api/saved-searches/notify - Cron job only
// /api/notifications/stream - SSE endpoint only
// Use Supabase Realtime instead of Redis polling
```

**Option 3: Use Supabase Realtime**
```typescript
// Client subscribes to Supabase Realtime channel
// Server writes to notifications table
// Supabase broadcasts changes automatically
// No custom SSE/Redis needed
```

---

## 🔄 Refactoring Phases

### Phase 1: Quick Wins (1-2 days)

**Priority**: High  
**Risk**: Low

1. **Remove `ensureProfileRecord()` from API routes**
   - Replace with `buildProfileFromAuthUser()`
   - Profile bootstrap moved to auth callback
   - Files: listings, saved-searches, reports routes

2. **Add CSRF to missing endpoints**
   - Add `isValidRequestOrigin()` check
   - Files: tickets, saved-searches, images, documents routes

3. **Fix hardcoded URL fallback**
   - Replace with `getAppUrl()` helper
   - Fail-closed in production

4. **Clarify `sanitizeFileName()` purpose**
   - Add JSDoc comment
   - Or remove if truly unused

**Verification**:
```bash
npm run typecheck
npm run lint
npm run build
# Manual test: Create listing, upload image, create ticket
```

---

### Phase 2: Security Middleware (3-5 days)

**Priority**: Medium  
**Risk**: Medium

1. **Create `withSecurity()` middleware**
   - Centralize CSRF, rate limit, auth checks
   - Consistent security across all routes

2. **Migrate existing routes**
   - Start with low-traffic routes
   - Gradually migrate high-traffic routes
   - A/B test to ensure no regressions

3. **Add security tests**
   - CSRF bypass attempts
   - Rate limit enforcement
   - Auth requirement validation

**Verification**:
```bash
npm run test:security
# Load test to ensure no performance regression
```

---

### Phase 3: Use Case Extraction (1-2 weeks)

**Priority**: Medium  
**Risk**: Medium-High

1. **Extract `CreateListingUseCase`**
   - Move business logic from route
   - Keep route as thin orchestrator
   - Add unit tests for use case

2. **Extract other use cases**
   - `CreateTicketUseCase`
   - `CreateReportUseCase`
   - `UpdateSavedSearchUseCase`

3. **Slug collision fix**
   - Implement DB retry logic
   - Remove `getExistingListingSlugs()`
   - Add unique constraint migration

**Verification**:
```bash
npm run test:unit
npm run test:integration
# Concurrent listing creation test
```

---

### Phase 4: Notification Simplification (1 week)

**Priority**: Low  
**Risk**: High (user-facing feature)

1. **Evaluate SSE necessity**
   - Check usage metrics
   - Consider Supabase Realtime alternative

2. **Separate concerns**
   - Cron job endpoint
   - SSE endpoint (if needed)
   - Or migrate to Supabase Realtime

3. **Add monitoring**
   - Email delivery rate
   - SSE connection count
   - Redis health

**Verification**:
```bash
# Monitor production metrics for 1 week
# Gradual rollout with feature flag
```

---

## 📋 Migration Checklist

### Pre-Refactoring
- [ ] Add integration tests for current behavior
- [ ] Document current API contracts
- [ ] Set up monitoring/alerting
- [ ] Create rollback plan

### Phase 1 (Quick Wins)
- [ ] Remove `ensureProfileRecord()` from routes
- [ ] Add CSRF to missing endpoints
- [ ] Fix hardcoded URL fallback
- [ ] Clarify `sanitizeFileName()` purpose
- [ ] Run full test suite
- [ ] Deploy to staging
- [ ] Smoke test all affected endpoints
- [ ] Deploy to production
- [ ] Monitor for 24 hours

### Phase 2 (Security Middleware)
- [ ] Implement `withSecurity()` helper
- [ ] Add security tests
- [ ] Migrate low-traffic routes
- [ ] Monitor for regressions
- [ ] Migrate high-traffic routes
- [ ] Load test
- [ ] Deploy to production
- [ ] Monitor for 1 week

### Phase 3 (Use Case Extraction)
- [ ] Extract `CreateListingUseCase`
- [ ] Add unit tests
- [ ] Migrate route to use case
- [ ] Fix slug collision logic
- [ ] Add DB unique constraint
- [ ] Test concurrent creation
- [ ] Deploy to staging
- [ ] Load test
- [ ] Deploy to production
- [ ] Monitor for 1 week

### Phase 4 (Notification Simplification)
- [ ] Evaluate SSE usage metrics
- [ ] Design alternative (Supabase Realtime?)
- [ ] Implement alternative
- [ ] Feature flag rollout
- [ ] Monitor delivery rates
- [ ] Gradual migration
- [ ] Deprecate old system
- [ ] Remove old code

---

## 🎯 Success Metrics

### Code Quality
- ✅ Route handlers < 100 lines
- ✅ Business logic in use cases, not routes
- ✅ 100% CSRF coverage on mutations
- ✅ Consistent security middleware

### Performance
- ✅ No regression in response times
- ✅ Slug generation < 100ms (vs current fetch-all)
- ✅ Rate limiting overhead < 10ms

### Reliability
- ✅ Zero security regressions
- ✅ Zero data loss incidents
- ✅ 99.9% uptime maintained

---

## 🚨 Risks & Mitigation

### Risk 1: Breaking Changes
**Mitigation**: 
- Incremental refactoring
- Comprehensive test coverage
- Feature flags for major changes
- Rollback plan for each phase

### Risk 2: Performance Regression
**Mitigation**:
- Load testing before production
- Monitoring/alerting
- Gradual rollout
- A/B testing for high-traffic routes

### Risk 3: Security Weakening
**Mitigation**:
- Security-first approach
- Never remove existing checks
- Add tests for security requirements
- Security audit after each phase

---

## 📝 Notes

1. **Not Urgent**: These are technical debt items, not critical bugs
2. **Incremental**: Refactor in small, testable chunks
3. **Backward Compatible**: Never break existing API contracts
4. **Test Coverage**: Add tests before refactoring
5. **Monitor**: Watch metrics after each deployment

---

## 🔗 Related Documents

- `PROGRESS.md` - Implementation history
- `SECURITY.md` - Security guidelines
- `AGENTS.md` - Architecture principles
- `TASKS.md` - Feature backlog

---

## ✅ Immediate Actions (This PR)

**Scope**: Phase 1 Quick Wins only

1. Document current issues (this file)
2. Add TODO comments in affected files
3. Create tracking issues
4. Plan Phase 1 implementation

**NOT in this PR**:
- No code refactoring yet
- No breaking changes
- No use case extraction
- No middleware creation

**Reason**: These changes require careful planning, testing, and gradual rollout. This document serves as the roadmap.
