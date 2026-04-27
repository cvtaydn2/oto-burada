# Design Document: Legacy Service Patterns Migration

**Feature**: `legacy-service-patterns-migration`  
**Type**: Bugfix (Refactoring)  
**Date**: 2026-04-27

---

## Executive Summary

This design document outlines the systematic migration of 9 legacy services from deprecated patterns (class-based services and client-service wrappers) to modern server actions pattern. The migration follows an incremental, test-driven approach prioritized by business criticality.

**Timeline**: 3 weeks (HIGH → MEDIUM → LOW priority)  
**Risk Level**: Medium (refactoring with zero downtime requirement)  
**Success Criteria**: All services migrated, all tests passing, zero regressions

---

## Migration Strategy

### Core Principles

1. **Incremental Migration**: One service at a time to minimize risk
2. **Test-Driven**: Write preservation tests BEFORE migration
3. **Zero Downtime**: All functionality must work identically
4. **Rollback-Ready**: Each migration is a separate commit

### Migration Pattern (8-Step Process)

For each service:

```
1. Analyze → 2. Test → 3. Create Actions → 4. Extract Logic → 
5. Update Imports → 6. Verify → 7. Delete Old → 8. Document
```

**Detailed Steps**:

1. **Analyze Current Implementation**
   - Read existing service file
   - Document all methods and their signatures
   - Identify dependencies and call sites
   - Map business logic vs API calls

2. **Write Preservation Tests**
   - Create `__tests__/*-preservation.test.ts`
   - Test all public methods
   - Verify return types and error handling
   - Run tests on UNFIXED code (must PASS)

3. **Create Server Actions File**
   - Create `*-actions.ts` with `"use server"` directive
   - Implement all methods as server actions
   - Use same function signatures (preserve API contract)

4. **Extract Business Logic** (if needed)
   - Move pure business logic to `*-logic.ts`
   - Keep server actions thin (orchestration only)
   - Maintain separation of concerns

5. **Update All Imports and Call Sites**
   - Search for all imports of old service
   - Replace with new server action imports
   - Update function calls (class methods → functions)

6. **Verify Preservation**
   - Run preservation tests (must PASS)
   - Run full test suite
   - Manual smoke testing

7. **Delete Old Service File**
   - Remove deprecated service file
   - Verify no remaining imports

8. **Update Documentation**
   - Update AGENTS.md if needed
   - Add JSDoc comments to server actions
   - Update service README

---

## Week 1: HIGH Priority Services

### Service 1: PaymentService

**Current State**:
- File: `src/services/payments/payment-logic.ts`
- Pattern: Class-based with static methods
- Lines: ~250
- Methods: 2 (initializeCheckoutForm, retrieveCheckoutResult)
- Dependencies: Iyzico client, Supabase admin

**Migration Plan**:

**Step 1: Analyze**
```typescript
// Current: Class-based
export class PaymentService {
  static async initializeCheckoutForm(params: {...}) { ... }
  static async retrieveCheckoutResult(token: string, userId: string) { ... }
}
```

**Step 2: Test**
Create `src/services/payments/__tests__/payment-preservation.test.ts`:
- Test initializeCheckoutForm with valid params
- Test retrieveCheckoutResult with valid token
- Test error handling (invalid params, timeout, etc.)

**Step 3: Create Actions**
Create `src/app/api/payments/actions.ts`:
```typescript
"use server";

import { initializePaymentCheckout, retrievePaymentResult } from "@/services/payments/payment-logic";

export async function initializeCheckoutFormAction(params: {...}) {
  return initializePaymentCheckout(params);
}

export async function retrieveCheckoutResultAction(token: string, userId: string) {
  return retrievePaymentResult(token, userId);
}
```

**Step 4: Extract Logic**
Rename methods in `payment-logic.ts` to pure functions:
```typescript
// Remove "export class PaymentService"
// Convert to pure functions
export async function initializePaymentCheckout(params: {...}) { ... }
export async function retrievePaymentResult(token: string, userId: string) { ... }
```

**Step 5: Update Imports**
Files to update:
- `src/app/api/payments/initialize/route.ts`
- `src/domain/usecases/payment-initiate.ts`
- `src/components/dashboard/doping-store.tsx` (already updated in Phase 28.4)

**Step 6-8**: Verify, Delete, Document

---

### Service 2: DopingService

**Current State**:
- File: `src/services/payments/doping-logic.ts`
- Pattern: Class-based with static methods
- Lines: ~80
- Methods: 3 (applyDoping, getDbPackageId, getActiveDopings)
- Dependencies: Supabase admin

**Migration Plan**:

**Step 3: Create Actions**
Create `src/app/api/dopings/actions.ts`:
```typescript
"use server";

import { applyDopingPackage, getActiveDopingsForListing } from "@/services/payments/doping-logic";

export async function applyDopingAction(params: {...}) {
  return applyDopingPackage(params);
}

export async function getActiveDopingsAction(listingId: string) {
  return getActiveDopingsForListing(listingId);
}
```

**Step 4: Extract Logic**
Convert class methods to pure functions in `doping-logic.ts`:
```typescript
export async function applyDopingPackage(params: {...}) { ... }
export async function getActiveDopingsForListing(listingId: string) { ... }
async function getDbPackageId(slug: string): Promise<string | null> { ... } // Keep private
```

**Files to Update**:
- `src/app/api/payments/callback/route.ts`
- `src/services/listings/listing-service.ts` (applyDoping method)

---

## Week 2: MEDIUM Priority Services

### Service 3: ChatService

**Current State**:
- File: `src/services/chat/chat-service.ts`
- Pattern: Class-based with static methods
- Lines: ~300
- Methods: 7 (getChatsForUser, createChat, getMessages, sendMessage, deleteMessage, archiveChat, markAsRead)
- Dependencies: Supabase server client

**Migration Plan**:

**Step 3: Create Actions**
Create `src/app/api/chats/actions.ts`:
```typescript
"use server";

import { 
  getUserChats, 
  createNewChat, 
  getChatMessages, 
  sendChatMessage,
  deleteChatMessage,
  toggleChatArchive,
  markChatAsRead
} from "@/services/chat/chat-logic";

export async function getChatsAction(userId: string, includeArchived = false) {
  return getUserChats(userId, includeArchived);
}

export async function createChatAction(input: CreateChatInput) {
  return createNewChat(input);
}

// ... 5 more actions
```

**Step 4: Extract Logic**
Rename `chat-service.ts` to `chat-logic.ts` and convert to pure functions.

**Files to Update**:
- `src/app/api/chats/route.ts`
- `src/app/api/chats/[id]/messages/route.ts`
- `src/app/api/chats/[id]/read/route.ts`
- `src/app/api/chats/[id]/archive/route.ts`
- Any dashboard components using ChatService

---

### Service 4: ListingService

**Current State**:
- File: `src/services/listings/listing-service.ts`
- Pattern: Class-based with static methods (API wrapper)
- Lines: ~100
- Methods: 10 (createListing, updateListing, deleteListing, archiveListing, bumpListing, bulkArchive, bulkDelete, bulkDraft, getMyListings, getListingById, applyDoping)
- Dependencies: ApiClient

**Migration Plan**:

**Analysis**: This is a **client-side API wrapper** - different from server-side services.

**Decision**: 
- Keep for now (LOW priority)
- These methods are already calling API routes
- The API routes themselves should use server actions
- This service can be deprecated later when components call server actions directly

**Alternative Approach**:
- Components should import server actions directly
- Remove this wrapper layer entirely

**Files to Update** (if we remove wrapper):
- All dashboard components using ListingService
- Replace with direct server action imports

---

### Service 5: ProfileService

**Current State**:
- File: `src/services/profile/client-service.ts`
- Pattern: Client-service wrapper (object with methods)
- Lines: ~30
- Methods: 2 (get, update)
- Dependencies: ApiClient

**Migration Plan**:

**Step 1: Analyze**
```typescript
// Current: Client wrapper
export const ProfileService = {
  get: () => ApiClient.request(API_ROUTES.PROFILE.BASE),
  update: (data: Record<string, unknown>) => ApiClient.request(...)
};
```

**Step 2-3: Create Server Actions**
The API routes already exist. Components should call them directly.

**Step 4: Update Components**
Replace:
```typescript
import { ProfileService } from "@/services/profile/client-service";
const profile = await ProfileService.get();
```

With:
```typescript
import { getProfile } from "@/app/api/profile/actions";
const profile = await getProfile();
```

**Step 5: Delete**
Delete `src/services/profile/client-service.ts`

---

### Service 6: AuthService

**Current State**:
- File: `src/services/auth/client-service.ts`
- Pattern: Client-service wrapper
- Lines: ~20
- Methods: 1 (signOut)
- Dependencies: ApiClient

**Migration Plan**:

Similar to ProfileService - remove wrapper, use server actions directly.

---

## Week 3: LOW Priority Services

### Service 7: SupportService

**Current State**:
- File: `src/services/support/support-service.ts`
- Pattern: Class-based (API wrapper)
- Lines: ~50
- Methods: 1 (createTicket)
- Dependencies: ApiClient

**Migration Plan**: Remove wrapper, use server actions directly.

---

### Service 8: NotificationService

**Current State**:
- File: `src/services/notifications/client-service.ts`
- Pattern: Client-service wrapper
- Lines: ~80
- Methods: 5 (getAll, markAsRead, markAllAsRead, getUnreadCount, updatePreferences)
- Dependencies: ApiClient

**Migration Plan**: Remove wrapper, use server actions directly.

---

### Service 9: ReportService

**Current State**:
- File: `src/services/reports/client-service.ts`
- Pattern: Client-service wrapper
- Lines: ~20
- Methods: 1 (create)
- Dependencies: ApiClient

**Migration Plan**: Remove wrapper, use server actions directly.

---

## File Structure Changes

### Before Migration

```
src/
├── services/
│   ├── payments/
│   │   ├── payment-logic.ts          # Class-based ❌
│   │   ├── doping-logic.ts           # Class-based ❌
│   │   └── iyzico-client.ts          # OK ✅
│   ├── chat/
│   │   └── chat-service.ts           # Class-based ❌
│   ├── listings/
│   │   └── listing-service.ts        # Client wrapper ❌
│   ├── profile/
│   │   └── client-service.ts         # Client wrapper ❌
│   ├── auth/
│   │   └── client-service.ts         # Client wrapper ❌
│   ├── support/
│   │   └── support-service.ts        # Client wrapper ❌
│   ├── notifications/
│   │   └── client-service.ts         # Client wrapper ❌
│   └── reports/
│       └── client-service.ts         # Client wrapper ❌
└── app/
    └── api/
        ├── payments/
        │   ├── initialize/route.ts
        │   └── callback/route.ts
        └── chats/
            └── route.ts
```

### After Migration

```
src/
├── services/
│   ├── payments/
│   │   ├── payment-logic.ts          # Pure functions ✅
│   │   ├── doping-logic.ts           # Pure functions ✅
│   │   └── iyzico-client.ts          # External client ✅
│   └── chat/
│       └── chat-logic.ts             # Pure functions ✅
└── app/
    └── api/
        ├── payments/
        │   ├── actions.ts            # NEW: Server actions ✅
        │   ├── initialize/route.ts
        │   └── callback/route.ts
        ├── dopings/
        │   └── actions.ts            # NEW: Server actions ✅
        ├── chats/
        │   ├── actions.ts            # NEW: Server actions ✅
        │   └── route.ts
        ├── profile/
        │   └── actions.ts            # NEW: Server actions ✅
        ├── auth/
        │   └── actions.ts            # NEW: Server actions ✅
        ├── support/
        │   └── actions.ts            # NEW: Server actions ✅
        ├── notifications/
        │   └── actions.ts            # NEW: Server actions ✅
        └── reports/
            └── actions.ts            # NEW: Server actions ✅
```

**Deleted Files** (9):
- `src/services/payments/payment-logic.ts` (converted to pure functions)
- `src/services/payments/doping-logic.ts` (converted to pure functions)
- `src/services/chat/chat-service.ts` (converted to chat-logic.ts)
- `src/services/listings/listing-service.ts` (removed wrapper)
- `src/services/profile/client-service.ts` (removed wrapper)
- `src/services/auth/client-service.ts` (removed wrapper)
- `src/services/support/support-service.ts` (removed wrapper)
- `src/services/notifications/client-service.ts` (removed wrapper)
- `src/services/reports/client-service.ts` (removed wrapper)

**New Files** (8):
- `src/app/api/payments/actions.ts`
- `src/app/api/dopings/actions.ts`
- `src/app/api/chats/actions.ts`
- `src/app/api/profile/actions.ts`
- `src/app/api/auth/actions.ts`
- `src/app/api/support/actions.ts`
- `src/app/api/notifications/actions.ts`
- `src/app/api/reports/actions.ts`

---

## Test Strategy

### Preservation Tests

For each service, create preservation tests that:
1. Test all public methods
2. Verify return types match
3. Test error handling
4. Test edge cases

**Test Files to Create**:
- `src/services/payments/__tests__/payment-preservation.test.ts`
- `src/services/payments/__tests__/doping-preservation.test.ts`
- `src/services/chat/__tests__/chat-preservation.test.ts`
- `src/__tests__/profile-service-preservation.test.ts`
- `src/__tests__/auth-service-preservation.test.ts`
- `src/__tests__/support-service-preservation.test.ts`
- `src/__tests__/notification-service-preservation.test.ts`
- `src/__tests__/report-service-preservation.test.ts`

### Test Execution

**Before Migration** (for each service):
```bash
npm run test:unit -- payment-preservation.test.ts
# Expected: PASS (baseline behavior)
```

**After Migration**:
```bash
npm run test:unit -- payment-preservation.test.ts
# Expected: PASS (preserved behavior)

npm run test:unit
# Expected: All tests PASS

npm run typecheck
# Expected: 0 errors

npm run build
# Expected: Success
```

---

## Import Path Updates

### PaymentService

**Before**:
```typescript
import { PaymentService } from "@/services/payments/payment-logic";
const result = await PaymentService.initializeCheckoutForm(params);
```

**After**:
```typescript
import { initializeCheckoutFormAction } from "@/app/api/payments/actions";
const result = await initializeCheckoutFormAction(params);
```

**Files to Update**:
- `src/app/api/payments/initialize/route.ts`
- `src/domain/usecases/payment-initiate.ts`

### DopingService

**Before**:
```typescript
import { DopingService } from "@/services/payments/doping-logic";
const result = await DopingService.applyDoping(params);
```

**After**:
```typescript
import { applyDopingAction } from "@/app/api/dopings/actions";
const result = await applyDopingAction(params);
```

**Files to Update**:
- `src/app/api/payments/callback/route.ts`

### ChatService

**Before**:
```typescript
import { ChatService } from "@/services/chat/chat-service";
const chats = await ChatService.getChatsForUser(userId);
```

**After**:
```typescript
import { getChatsAction } from "@/app/api/chats/actions";
const chats = await getChatsAction(userId);
```

**Files to Update**:
- `src/app/api/chats/route.ts`
- `src/app/api/chats/[id]/messages/route.ts`
- `src/app/api/chats/[id]/read/route.ts`
- `src/app/api/chats/[id]/archive/route.ts`
- Dashboard components

### Client-Service Wrappers

**Before**:
```typescript
import { ProfileService } from "@/services/profile/client-service";
const profile = await ProfileService.get();
```

**After**:
```typescript
import { getProfile } from "@/app/api/profile/actions";
const profile = await getProfile();
```

---

## Rollback Plan

Each service migration is a separate git commit:

```bash
# Week 1
git commit -m "refactor: migrate PaymentService to server actions"
git commit -m "refactor: migrate DopingService to server actions"

# Week 2
git commit -m "refactor: migrate ChatService to server actions"
git commit -m "refactor: migrate ListingService to server actions"
git commit -m "refactor: remove ProfileService wrapper"
git commit -m "refactor: remove AuthService wrapper"

# Week 3
git commit -m "refactor: remove SupportService wrapper"
git commit -m "refactor: remove NotificationService wrapper"
git commit -m "refactor: remove ReportService wrapper"
```

**Rollback Procedure**:
```bash
# If migration fails, revert the commit
git revert <commit-hash>

# Or reset to previous commit
git reset --hard HEAD~1
```

---

## Risk Assessment

### HIGH Risk Areas

1. **PaymentService**: Critical business logic, handles money
   - **Mitigation**: Extensive testing, manual verification, staged rollout
   
2. **DopingService**: Affects listing visibility and revenue
   - **Mitigation**: Test with test listings first, verify RPC calls

### MEDIUM Risk Areas

3. **ChatService**: User communication, high usage
   - **Mitigation**: Test message sending/receiving thoroughly

4. **ListingService**: Core CRUD operations
   - **Mitigation**: Test all CRUD operations, verify RLS policies

### LOW Risk Areas

5-9. **Client-Service Wrappers**: Thin wrappers, low complexity
   - **Mitigation**: Simple find-replace, verify imports

---

## Success Criteria

### Functional Requirements

- ✅ All 9 services migrated to server actions pattern
- ✅ All existing functionality works identically
- ✅ All preservation tests pass
- ✅ No regressions in user-facing features

### Quality Requirements

- ✅ 0 TypeScript errors
- ✅ 0 ESLint errors
- ✅ All unit tests pass
- ✅ Build succeeds

### Documentation Requirements

- ✅ AGENTS.md updated (if needed)
- ✅ JSDoc comments added to all server actions
- ✅ Service README files created (optional)

### Performance Requirements

- ✅ No performance degradation
- ✅ Response times unchanged
- ✅ No new N+1 queries

---

## Timeline and Milestones

### Week 1: HIGH Priority (Days 1-5)

**Day 1-2**: PaymentService
- Write preservation tests
- Create server actions
- Update imports
- Verify and commit

**Day 3-4**: DopingService
- Write preservation tests
- Create server actions
- Update imports
- Verify and commit

**Day 5**: Week 1 Checkpoint
- Run full test suite
- Manual testing
- User acceptance

### Week 2: MEDIUM Priority (Days 6-10)

**Day 6-7**: ChatService
- Write preservation tests
- Create server actions
- Update imports
- Verify and commit

**Day 8**: ListingService + ProfileService + AuthService
- Remove wrappers
- Update imports
- Verify and commit

**Day 9-10**: Week 2 Checkpoint
- Run full test suite
- Manual testing
- User acceptance

### Week 3: LOW Priority (Days 11-15)

**Day 11-12**: SupportService + NotificationService + ReportService
- Remove wrappers
- Update imports
- Verify and commit

**Day 13-14**: Final Verification
- Run full test suite
- Performance testing
- Security audit

**Day 15**: Final Checkpoint
- User acceptance
- Documentation review
- Production deployment

---

## Next Steps

1. **Review this design document** with stakeholders
2. **Create tasks.md** with detailed implementation tasks
3. **Start Week 1**: PaymentService migration
4. **Iterate and improve** based on learnings

---

## Appendix: Server Actions Pattern

### Template

```typescript
"use server";

import { auth } from "@/lib/auth";
import { businessLogicFunction } from "@/services/domain/logic";

/**
 * Server action description
 * @param param1 - Description
 * @returns Description
 */
export async function myServerAction(param1: string) {
  // 1. Authentication
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // 2. Authorization
  // Check permissions if needed

  // 3. Validation
  // Validate inputs

  // 4. Business Logic
  const result = await businessLogicFunction(param1);

  // 5. Return
  return result;
}
```

### Best Practices

1. **Always use `"use server"` directive**
2. **Validate inputs** with Zod schemas
3. **Handle errors** gracefully
4. **Add JSDoc comments** for documentation
5. **Keep actions thin** - delegate to logic functions
6. **Use TypeScript** for type safety
7. **Test thoroughly** with preservation tests

---

**End of Design Document**
