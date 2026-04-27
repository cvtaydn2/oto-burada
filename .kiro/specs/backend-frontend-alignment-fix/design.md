# Backend-API-Frontend Alignment Bugfix Design

## Overview

This design addresses architectural debt accumulated across 46 development phases that manifests as backend-frontend alignment issues. While the application functions correctly (all pages render, build succeeds), these issues create technical debt impacting developer experience, maintenance efficiency, and future development velocity.

The fix approach is systematic cleanup and consolidation:
1. **Database Schema Alignment**: Fix PostgREST relationship syntax to eliminate fallback queries
2. **Service Layer Consolidation**: Merge duplicate service directories and establish clear naming conventions
3. **Documentation Cleanup**: Archive obsolete phase-specific documentation, consolidate security docs
4. **Service Architecture Standardization**: Establish server actions as the primary pattern with clear separation of concerns

This is a **refactoring bugfix** - no user-facing behavior changes, only internal code quality improvements.

## Glossary

- **Bug_Condition (C)**: The condition that triggers technical debt - schema mismatches, duplicate services, obsolete docs, or inconsistent patterns
- **Property (P)**: The desired state - aligned schemas, consolidated services, clean documentation, consistent architecture
- **Preservation**: All user-facing functionality, business logic, security policies, and performance optimizations must remain unchanged
- **PostgREST Relationship Syntax**: The query syntax used by Supabase to join tables/views (e.g., `profiles:public_profiles!inner!seller_id`)
- **Server Actions**: Next.js "use server" functions that serve as API endpoints (established pattern in Phase 28.4)
- **Client Service**: Browser-side API wrapper that calls server actions or route handlers
- **Legacy Service**: Class-based service pattern from earlier phases (e.g., `FavoriteService` class)
- **public_profiles**: A database view exposing non-sensitive profile fields for public access
- **Schema Cache**: PostgREST's internal cache of table/view relationships and foreign keys
- **PGRST200**: PostgREST error code indicating relationship not found in schema cache

## Bug Details

### Bug Condition

The bug manifests when the codebase contains architectural inconsistencies that don't prevent functionality but create maintenance burden. The system has accumulated technical debt across four categories: schema mismatches, duplicate services, obsolete documentation, and inconsistent patterns.

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X of type CodebaseElement
  OUTPUT: boolean
  
  RETURN (
    // Category 1: Schema mismatch condition
    (X.type = "DatabaseQuery" AND 
     X.usesViewRelationship = true AND
     X.syntax = "profiles:public_profiles!inner!seller_id" AND
     triggersSchemaFallback(X)) OR
    
    // Category 2: Duplicate service condition
    (X.type = "ServiceDirectory" AND 
     EXISTS(Y WHERE Y.type = "ServiceDirectory" AND 
            Y.domain = X.domain AND 
            Y.path ≠ X.path AND
            Y.hasOverlappingResponsibility(X))) OR
    
    // Category 3: Obsolete documentation condition
    (X.type = "DocumentationFile" AND 
     X.location = "repository_root" AND
     (X.isPhaseSpecific = true OR
      X.isDuplicateSummary = true OR
      X.isSupersededSecurityDoc = true)) OR
    
    // Category 4: Inconsistent pattern condition
    (X.type = "ServiceImplementation" AND
     X.isClientSideApiWrapper = true AND
     NOT MATCHES(X.pattern, "ServerAction") AND
     serverActionPatternExists(X.domain))
  )
END FUNCTION
```

### Examples

#### Example 1: Schema Mismatch (PGRST200 Error)

**Buggy Input:**
```typescript
// src/services/listings/listing-submission-query.ts (line 88)
const query = `
  profiles:public_profiles!inner!seller_id (
    id, full_name, avatar_url
  )
`;
```

**Current Behavior:** 
- PostgREST cannot find the relationship `public_profiles!seller_id` in schema cache
- System logs "Marketplace schema mismatch detected, attempting legacy fallback"
- Query falls back to direct `profiles` table join
- Build completes but with warnings

**Root Cause:** The syntax `profiles:public_profiles!inner!seller_id` attempts to:
1. Join the `profiles` table
2. Through the `public_profiles` view
3. Using the `seller_id` foreign key

However, `public_profiles` is a VIEW, not a table with foreign key constraints. PostgREST's schema cache only tracks foreign keys on actual tables, not views. The correct syntax should reference the base table relationship.

#### Example 2: Duplicate Services (Payment/Payments Confusion)

**Buggy Input:**
```typescript
// Developer tries to import PaymentService
import { PaymentService } from "@/services/payment/payment-service"; // Server-side Iyzico integration
// OR
import { PaymentService } from "@/services/payments/client-service"; // Client-side API wrapper
```

**Current Behavior:**
- Two directories exist: `src/services/payment/` and `src/services/payments/`
- Both export `PaymentService` with different implementations
- `payment/payment-service.ts`: Server-side class with Iyzico integration logic
- `payments/client-service.ts`: Client-side object with API wrapper methods
- Developers must remember which path to use based on context
- Import autocomplete shows both options, causing confusion

**Root Cause:** Inconsistent naming convention - no clear distinction between server-side business logic and client-side API wrappers.

#### Example 3: Obsolete Documentation Clutter

**Buggy Input:**
```
Repository root contains 30+ obsolete files:
- PHASE_6_CRITICAL_FIXES_REPORT.md
- PHASE_7_SECURITY_HARDENING_REPORT.md
- ARCHITECTURAL-ISSUES-PHASE-39.md
- LOGIC-ISSUES-PHASE-40.md
- PERFORMANCE-ISSUES-PHASE-42.md
- ALL_FIXES_COMPLETE_SUMMARY.md
- COMPLETE_FIXES_SUMMARY.md
- CRITICAL_FIXES_SUMMARY.md
- SECURITY_ALERT.md
- SECURITY_FIXES_REPORT.md
- SECURITY_FIXES.md
- SECURITY-FIXES.md
... (and 20+ more)
```

**Current Behavior:**
- Repository root is cluttered with historical documentation
- Unclear which security documentation is current
- Multiple overlapping summary files
- New developers struggle to find relevant documentation

**Root Cause:** No documentation lifecycle management - files created during development phases were never archived or consolidated.

#### Example 4: Inconsistent Service Patterns

**Buggy Input:**
```typescript
// Pattern 1: Server Action (established in Phase 28.4)
// src/app/dashboard/favorites/actions.ts
export async function toggleFavoriteAction(listingId: string) {
  const user = await getCurrentUser();
  return await favoriteAddUseCase(user.id, listingId);
}

// Pattern 2: Legacy Class-based Service
// src/services/favorites/favorite-service.ts
export class FavoriteService {
  static async addFavorite(listingId: string) {
    return ApiClient.request(API_ROUTES.FAVORITES.BASE, { method: "POST" });
  }
}

// Pattern 3: Modern Client Service
// src/services/favorites/client-service.ts
export const FavoriteService = {
  add: (listingId: string) => ApiClient.request(API_ROUTES.FAVORITES.BASE, { method: "POST" })
};
```

**Current Behavior:**
- Three different patterns for the same functionality
- Components use different patterns inconsistently
- No clear guidance on which pattern to use for new features

**Root Cause:** Architecture evolved over 46 phases without consolidating legacy patterns.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All pages must continue to render correctly without errors
- All business logic must continue to execute correctly (payments, favorites, listings, etc.)
- All security policies must continue to be enforced (RLS, authentication, authorization)
- All performance optimizations must continue to function (caching, rate limiting, query optimization)
- Build must continue to succeed without compilation errors
- All tests must continue to pass

**Scope:**
All user-facing functionality and business logic should be completely unaffected by this fix. This includes:
- User authentication and authorization flows
- Listing creation, editing, and viewing
- Payment processing with Iyzico
- Favorite toggling and persistence
- Admin moderation workflows
- All API endpoints and their responses

## Hypothesized Root Cause

Based on the bug analysis, the root causes are:

### 1. Schema Relationship Syntax Issue

**Hypothesis**: The `profiles:public_profiles!inner!seller_id` syntax fails because PostgREST's schema cache only tracks foreign key relationships on base tables, not views.

**Evidence**:
- `public_profiles` is defined as a VIEW in `database/migrations/0108_secure_profiles_rls.sql`
- Views don't have foreign key constraints in PostgreSQL
- PostgREST builds its relationship cache from `information_schema.table_constraints`
- The `seller_id` foreign key exists on the `listings` table pointing to `profiles.id`, not on the view

**Correct Approach**: Use the base table relationship syntax: `seller:profiles!seller_id(...)` or query the view directly without relationship syntax.

### 2. Lack of Service Naming Conventions

**Hypothesis**: No established naming convention to distinguish server-side business logic from client-side API wrappers led to duplicate directories with overlapping names.

**Evidence**:
- `payment/` contains server-side Iyzico integration (`PaymentService`, `DopingService`)
- `payments/` contains client-side API wrapper (also named `PaymentService`)
- `favorites/` contains both legacy class (`favorite-service.ts`) and modern client service (`client-service.ts`)
- No documentation defining naming standards

**Correct Approach**: Establish clear naming: `*-actions.ts` for server actions, `*-records.ts` for data access, `*-logic.ts` for business logic.

### 3. No Documentation Lifecycle Management

**Hypothesis**: Phase-specific documentation files were created during development but never archived or consolidated after phase completion.

**Evidence**:
- 30+ phase-specific files in repository root
- Multiple overlapping summary files (ALL_FIXES_COMPLETE_SUMMARY.md, COMPLETE_FIXES_SUMMARY.md, CRITICAL_FIXES_SUMMARY.md)
- Multiple security documentation files with unclear precedence
- PROGRESS.md exists but historical phase docs were not consolidated into it

**Correct Approach**: Archive phase-specific docs to `docs/archive/`, consolidate security docs, use PROGRESS.md as single source of truth.

### 4. Architecture Evolution Without Consolidation

**Hypothesis**: The codebase evolved from class-based services → client services → server actions without migrating legacy patterns.

**Evidence**:
- Phase 28.4 established server actions as the primary pattern
- Legacy class-based services still exist (`FavoriteService` class)
- Modern client services coexist with legacy services
- No migration guide or deprecation strategy

**Correct Approach**: Migrate all client-side API calls to use server actions, deprecate legacy patterns, document the standard architecture.

## Correctness Properties

Property 1: Bug Condition - Schema Alignment

_For any_ database query that joins listings with seller profiles, the fixed query syntax SHALL use the correct PostgREST relationship syntax that references base table foreign keys (not view relationships), eliminating schema mismatch warnings and fallback queries during build and runtime.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Bug Condition - Service Consolidation

_For any_ service domain (payment, favorites, etc.), the fixed codebase SHALL have exactly one service directory with clear separation of concerns (server actions for API endpoints, records for data access, logic for business rules), eliminating duplicate directories and naming confusion.

**Validates: Requirements 2.4, 2.5, 2.6, 2.7**

Property 3: Bug Condition - Documentation Cleanup

_For any_ documentation file in the repository root, the fixed codebase SHALL contain only current, relevant documentation (AGENTS.md, README.md, TASKS.md, PROGRESS.md, DEPLOYMENT_CHECKLIST.md), with historical phase-specific documentation archived to `docs/archive/` and security documentation consolidated into a single source.

**Validates: Requirements 2.8, 2.9, 2.10**

Property 4: Bug Condition - Architecture Consistency

_For any_ client-side API interaction, the fixed codebase SHALL use server actions as the primary pattern (as established in Phase 28.4), with clear architectural documentation defining the separation between actions (API endpoints), services (data access), and domain logic (business rules).

**Validates: Requirements 2.11, 2.12**

Property 5: Preservation - Application Functionality

_For any_ user interaction or page access, the fixed codebase SHALL produce exactly the same behavior as the original codebase, preserving all rendering, business logic execution, and build success.

**Validates: Requirements 3.1, 3.2, 3.3**

Property 6: Preservation - Data Integrity and Security

_For any_ database query, payment processing, or authentication check, the fixed codebase SHALL produce exactly the same results as the original codebase, preserving data correctness, RLS enforcement, security policies, and performance optimizations.

**Validates: Requirements 3.4, 3.5, 3.6, 3.7, 3.8, 3.9**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, the implementation will proceed in four phases:

#### Phase 1: Database Schema Alignment

**File**: `src/services/listings/listing-submission-query.ts`

**Function**: Query builder for listing submissions with seller profiles

**Specific Changes**:

1. **Replace View Relationship Syntax with Base Table Syntax**:
   - Current: `profiles:public_profiles!inner!seller_id (...)`
   - Fixed: `seller:profiles!seller_id(id, full_name, city, avatar_url, role, user_type, business_name, business_logo_url, is_verified, is_banned, ban_reason, verified_business)`
   - Rationale: Use the actual foreign key relationship on the `listings` table (`seller_id` → `profiles.id`)

2. **Alternative Approach (if base table has sensitive fields)**:
   - Query `public_profiles` view directly without relationship syntax
   - Use a separate query to fetch seller profiles by ID
   - Join in application code rather than database

3. **Verify Schema Cache Alignment**:
   - Run `npm run db:migrate` to ensure schema is up-to-date
   - Check that `listings.seller_id` foreign key exists in `information_schema.table_constraints`
   - Test query in Supabase dashboard to confirm no PGRST200 errors

**Expected Outcome**: Build completes without "schema mismatch" warnings, queries execute without fallback.

#### Phase 2: Service Layer Consolidation

**Affected Directories**:
- `src/services/payment/` (server-side)
- `src/services/payments/` (client-side)
- `src/services/favorites/` (mixed patterns)

**Consolidation Strategy**:

1. **Payment Services Consolidation**:
   - **Keep**: `src/services/payment/` (rename to `src/services/payments/`)
   - **Structure**:
     - `payments/payment-logic.ts` - Server-side Iyzico integration (rename from `payment-service.ts`)
     - `payments/doping-logic.ts` - Server-side doping application (rename from `doping-service.ts`)
     - `payments/iyzico-client.ts` - Iyzico SDK wrapper (keep as-is)
   - **Delete**: `src/services/payments/client-service.ts` (migrate to server actions)
   - **Create**: `src/app/api/payments/actions.ts` - Server actions for payment initialization and retrieval

2. **Favorites Services Consolidation**:
   - **Keep**: `src/services/favorites/`
   - **Structure**:
     - `favorites/favorite-records.ts` - Data access layer (keep as-is)
     - `favorites/favorites-storage.ts` - Local storage utilities (keep as-is)
   - **Delete**: 
     - `favorites/favorite-service.ts` (legacy class-based)
     - `favorites/client-service.ts` (modern but redundant with server actions)
   - **Already Exists**: `src/app/dashboard/favorites/actions.ts` (server actions pattern)

3. **Naming Convention Standard** (document in AGENTS.md):
   - `*-actions.ts` - Server actions (API endpoints)
   - `*-records.ts` - Data access layer (database queries)
   - `*-logic.ts` - Business logic (pure functions)
   - `*-client.ts` - External API clients (Iyzico, OpenAI, etc.)

4. **Update All Imports**:
   - Search for `@/services/payments/client-service` → replace with server action imports
   - Search for `@/services/favorites/favorite-service` → replace with server action imports
   - Search for `@/services/favorites/client-service` → replace with server action imports

**Expected Outcome**: Single source of truth for each service domain, clear naming conventions, no duplicate exports.

#### Phase 3: Documentation Cleanup

**Root Directory Cleanup**:

1. **Create Archive Directory**: `docs/archive/phases/`

2. **Move Phase-Specific Documentation** (30+ files):
   ```
   PHASE_6_CRITICAL_FIXES_REPORT.md → docs/archive/phases/
   PHASE_7_SECURITY_HARDENING_REPORT.md → docs/archive/phases/
   PHASE_8_ARCHITECTURAL_REFACTORING_REPORT.md → docs/archive/phases/
   ARCHITECTURAL-ISSUES-PHASE-39.md → docs/archive/phases/
   LOGIC-ISSUES-PHASE-40.md → docs/archive/phases/
   LOGIC-ISSUES-PHASE-41.md → docs/archive/phases/
   PERFORMANCE-ISSUES-PHASE-42.md → docs/archive/phases/
   PERFORMANCE-PHASE-42-COMPLETE.md → docs/archive/phases/
   PERFORMANCE-PHASE-43-ANALYSIS.md → docs/archive/phases/
   UI-UX-PHASE-44-ANALYSIS.md → docs/archive/phases/
   PHASE-42-SUMMARY.md → docs/archive/phases/
   PHASE-43-SUMMARY.md → docs/archive/phases/
   ```

3. **Move Duplicate Summary Files**:
   ```
   ALL_FIXES_COMPLETE_SUMMARY.md → docs/archive/summaries/
   ALL_PHASES_COMPLETE_SUMMARY.md → docs/archive/summaries/
   COMPLETE_FIXES_SUMMARY.md → docs/archive/summaries/
   CRITICAL_FIXES_SUMMARY.md → docs/archive/summaries/
   COMPLETE_AUDIT_RESOLUTION_SUMMARY.md → docs/archive/summaries/
   COMPLETE_AUDIT_SUMMARY.md → docs/archive/summaries/
   ARCHITECTURAL_IMPROVEMENTS.md → docs/archive/summaries/
   ARCHITECTURAL-IMPROVEMENTS-SUMMARY.md → docs/archive/summaries/
   BUG-FIXES-SUMMARY.md → docs/archive/summaries/
   COMPLETE-BUG-FIXES-AND-TESTS.md → docs/archive/summaries/
   TESTING-SUMMARY.md → docs/archive/summaries/
   ```

4. **Consolidate Security Documentation**:
   - **Keep**: `docs/SECURITY.md` (create if doesn't exist)
   - **Archive**:
     ```
     SECURITY_ALERT.md → docs/archive/security/
     SECURITY_FIXES_REPORT.md → docs/archive/security/
     SECURITY_FIXES.md → docs/archive/security/
     SECURITY-FIXES.md → docs/archive/security/
     SECURITY_FIX_SUMMARY.md → docs/archive/security/
     SECURITY_AUDIT_COMPLETE.md → docs/archive/security/
     SECURITY_AUDIT_RESOLUTION.md → docs/archive/security/
     SECURITY_AND_ARCHITECTURE_SUMMARY.md → docs/archive/security/
     SECURITY_UX_FIXES_SUMMARY.md → docs/archive/security/
     FINAL_SECURITY_RESOLUTION.md → docs/archive/security/
     ```
   - **Consolidate**: Extract current security policies from archived files into `docs/SECURITY.md`

5. **Archive Other Obsolete Files**:
   ```
   ADDITIONAL_FIXES_REPORT.md → docs/archive/fixes/
   ARCHITECTURAL-ISSUES-COMPLETE.md → docs/archive/fixes/
   CRITICAL_FIXES_FINAL.md → docs/archive/fixes/
   CRITICAL-ISSUES-RESOLUTION.md → docs/archive/fixes/
   FINAL_LOGIC_FIXES_REPORT.md → docs/archive/fixes/
   PERFORMANCE_FIXES_REPORT.md → docs/archive/fixes/
   PERFORMANCE_FIXES_SUMMARY.md → docs/archive/fixes/
   PERFORMANCE_QUICK_REFERENCE.md → docs/archive/fixes/
   UI_UX_FIXES_REPORT.md → docs/archive/fixes/
   REMAINING_UX_ISSUES.md → docs/archive/fixes/
   DATABASE_MIGRATION_IMPROVEMENTS.md → docs/archive/fixes/
   DEPENDENCY_SECURITY_FIX.md → docs/archive/fixes/
   RESERVATIONS_MIGRATION.md → docs/archive/fixes/
   ```

6. **Keep in Root** (current, relevant documentation):
   ```
   AGENTS.md - Architectural compass
   README.md - Entry point
   TASKS.md - Current backlog
   PROGRESS.md - Implementation log
   DEPLOYMENT_CHECKLIST.md - Deployment guide
   RUNBOOK.md - Operational procedures
   ```

**Expected Outcome**: Clean repository root with only current documentation, historical files archived and organized.

#### Phase 4: Service Architecture Standardization

**Documentation Updates**:

1. **Update AGENTS.md** - Add "Service Architecture" section:
   ```markdown
   ## Service Architecture

   ### Established Pattern (Phase 28.4)

   **Server Actions** are the primary pattern for client-server communication:
   - Located in `src/app/**/actions.ts`
   - Use `"use server"` directive
   - Handle authentication, validation, and business logic orchestration
   - Call domain use cases or service records

   **Service Layer Structure**:
   - `services/*/records.ts` - Data access layer (database queries)
   - `services/*/logic.ts` - Business logic (pure functions)
   - `services/*/client.ts` - External API clients (Iyzico, OpenAI, etc.)

   **Domain Layer Structure**:
   - `domain/usecases/*.ts` - Business use cases (orchestration)
   - `domain/logic/*.ts` - Pure business logic (calculations, validations)

   ### Migration from Legacy Patterns

   **Deprecated Patterns**:
   - ❌ Class-based services (e.g., `export class FavoriteService`)
   - ❌ Client-side API wrappers (e.g., `services/*/client-service.ts`)

   **Migration Path**:
   1. Move API logic to server actions (`app/**/actions.ts`)
   2. Move data access to service records (`services/*/records.ts`)
   3. Move business logic to domain use cases (`domain/usecases/*.ts`)
   4. Delete legacy service files
   5. Update all imports
   ```

2. **Create Migration Guide**: `docs/SERVICE_ARCHITECTURE.md`
   - Document the server action pattern
   - Provide migration examples
   - List all migrated services

3. **Update README.md** - Add architecture overview linking to AGENTS.md

**Code Migrations**:

1. **Migrate Payment Client Service**:
   - Create `src/app/api/payments/initialize/route.ts` or use server action
   - Move logic from `payments/client-service.ts` to server action
   - Update components to call server action instead of client service

2. **Remove Legacy Favorites Services**:
   - Already migrated to `src/app/dashboard/favorites/actions.ts`
   - Delete `favorites/favorite-service.ts` and `favorites/client-service.ts`
   - Update any remaining imports

3. **Document Standard in Code**:
   - Add JSDoc comments to server actions explaining the pattern
   - Add README.md files in service directories explaining structure

**Expected Outcome**: Consistent architecture across codebase, clear documentation, deprecated patterns removed.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, verify the current system works correctly (baseline), then verify the refactored system produces identical behavior (preservation checking).

### Exploratory Bug Condition Checking

**Goal**: Confirm the bugs exist in the current codebase BEFORE implementing the fix. Document the exact manifestations.

**Test Plan**: Run the application and observe the specific issues described in the requirements.

**Test Cases**:

1. **Schema Mismatch Verification**:
   - Run `npm run build` and capture console output
   - Search for "schema mismatch" or "legacy fallback" warnings
   - Expected: Warnings present in build logs

2. **Duplicate Service Verification**:
   - Search codebase for `export.*PaymentService` 
   - Expected: Multiple exports with same name in different files
   - Verify both `payment/payment-service.ts` and `payments/client-service.ts` exist

3. **Documentation Clutter Verification**:
   - List files in repository root: `ls -la | grep -E "PHASE|SUMMARY|FIXES"`
   - Expected: 30+ obsolete documentation files

4. **Pattern Inconsistency Verification**:
   - Search for `class.*Service` (legacy pattern)
   - Search for `export const.*Service.*=` (modern client service pattern)
   - Search for `"use server"` (server action pattern)
   - Expected: All three patterns coexist in the codebase

**Expected Counterexamples**:
- Build warnings about schema mismatches
- Multiple `PaymentService` exports causing import confusion
- Cluttered repository root with 30+ obsolete files
- Mixed service patterns across the codebase

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed codebase eliminates the technical debt.

**Pseudocode:**
```
// Schema Alignment Check
FOR ALL query WHERE usesViewRelationship(query) DO
  result := executeQuery_fixed(query)
  ASSERT no_schema_mismatch_warning(result)
  ASSERT no_legacy_fallback(result)
  ASSERT query_executes_successfully(result)
END FOR

// Service Consolidation Check
FOR ALL domain IN ["payment", "favorites"] DO
  services := getServiceDirectories(domain)
  ASSERT COUNT(services) = 1
  ASSERT has_clear_naming_convention(services[0])
  ASSERT no_duplicate_exports(services[0])
END FOR

// Documentation Cleanup Check
rootFiles := listFiles("./")
ASSERT NOT EXISTS(f IN rootFiles WHERE f.isPhaseSpecific)
ASSERT NOT EXISTS(f IN rootFiles WHERE f.isDuplicateSummary)
ASSERT COUNT(f IN rootFiles WHERE f.isSecurityDoc) = 1

// Architecture Consistency Check
FOR ALL clientApiCall IN codebase DO
  ASSERT uses_server_action_pattern(clientApiCall)
  ASSERT NOT uses_legacy_class_service(clientApiCall)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all user-facing functionality and business logic, the fixed codebase produces exactly the same behavior as the original codebase.

**Pseudocode:**
```
FOR ALL userInteraction IN [pageAccess, formSubmission, apiCall] DO
  ASSERT originalCodebase(userInteraction) = fixedCodebase(userInteraction)
END FOR

FOR ALL businessLogic IN [payment, favorite, listing, auth] DO
  ASSERT originalCodebase(businessLogic) = fixedCodebase(businessLogic)
END FOR

FOR ALL securityPolicy IN [rls, authentication, authorization] DO
  ASSERT originalCodebase(securityPolicy) = fixedCodebase(securityPolicy)
END FOR
```

**Testing Approach**: Since this is a refactoring bugfix with no user-facing changes, preservation checking is critical. We will:
1. Run the full test suite before and after the fix
2. Manually test key user flows (listing creation, payment, favorites)
3. Verify build succeeds without errors
4. Check that all API endpoints return identical responses

**Test Plan**: 

1. **Baseline Testing (BEFORE fix)**:
   - Run `npm run test` and capture results
   - Run `npm run build` and verify success
   - Manually test: Create listing, add to favorites, process payment
   - Document all behaviors

2. **Preservation Testing (AFTER fix)**:
   - Run `npm run test` and compare results (must be identical)
   - Run `npm run build` and verify success (no new errors)
   - Manually test same flows and verify identical behavior
   - Check API responses are identical

**Test Cases**:

1. **Page Rendering Preservation**:
   - Test all pages render correctly: homepage, listing detail, dashboard, admin
   - Verify no console errors
   - Verify no visual regressions

2. **Business Logic Preservation**:
   - Test payment flow: initialize checkout, complete payment, verify doping applied
   - Test favorites: add favorite, remove favorite, verify persistence
   - Test listing creation: create draft, publish, verify moderation

3. **Security Preservation**:
   - Test RLS: Verify users can only access their own data
   - Test authentication: Verify protected routes require login
   - Test authorization: Verify admin routes require admin role

4. **Performance Preservation**:
   - Measure query execution time before and after
   - Verify no new N+1 queries introduced
   - Check build time remains similar

### Unit Tests

- Test schema query syntax produces correct PostgREST queries
- Test service consolidation doesn't break imports
- Test documentation cleanup doesn't delete current files
- Test server action pattern matches established conventions

### Property-Based Tests

Not applicable for this refactoring bugfix - no complex business logic changes that would benefit from property-based testing.

### Integration Tests

- Test full listing creation flow with seller profile join
- Test payment initialization and completion flow
- Test favorites toggle flow
- Test admin moderation flow
- Verify all flows produce identical results before and after fix

### Manual Testing Checklist

**Before Fix**:
- [ ] Build succeeds with warnings
- [ ] All pages render correctly
- [ ] Payment flow works end-to-end
- [ ] Favorites toggle works
- [ ] Listing creation works
- [ ] Admin moderation works

**After Fix**:
- [ ] Build succeeds WITHOUT warnings
- [ ] All pages render correctly (identical to before)
- [ ] Payment flow works end-to-end (identical to before)
- [ ] Favorites toggle works (identical to before)
- [ ] Listing creation works (identical to before)
- [ ] Admin moderation works (identical to before)
- [ ] No duplicate service directories
- [ ] Clean repository root (only current docs)
- [ ] Consistent server action pattern

## Risk Assessment

### Low-Risk Changes
- Documentation cleanup (no code changes)
- Renaming service files (TypeScript will catch broken imports)

### Medium-Risk Changes
- Schema query syntax changes (could break queries if incorrect)
- Service consolidation (could break imports if not thorough)

### High-Risk Changes
- None - this is a refactoring bugfix with no user-facing changes

### Mitigation Strategies
1. **Incremental Implementation**: Fix one category at a time, test thoroughly before moving to next
2. **Comprehensive Testing**: Run full test suite after each change
3. **Rollback Plan**: Use git branches, can revert if issues arise
4. **Staged Deployment**: Deploy to staging environment first, verify before production

## Success Criteria

The fix is successful when:

1. ✅ Build completes without "schema mismatch" or "legacy fallback" warnings
2. ✅ No duplicate service directories exist (single source of truth per domain)
3. ✅ Repository root contains only current documentation (≤10 files)
4. ✅ All client-server communication uses server action pattern
5. ✅ All existing tests pass
6. ✅ All user-facing functionality works identically to before
7. ✅ AGENTS.md documents the service architecture standard
8. ✅ No TypeScript compilation errors
9. ✅ No broken imports
10. ✅ Developer onboarding documentation updated
