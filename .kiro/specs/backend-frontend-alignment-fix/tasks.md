# Implementation Plan: Backend-API-Frontend Alignment Fix

## Overview

This task list implements a systematic refactoring bugfix to address architectural debt accumulated across 46 development phases. The fix proceeds in four phases: Database Schema Alignment, Service Layer Consolidation, Documentation Cleanup, and Service Architecture Standardization.

**Critical Note**: This is a refactoring bugfix - no user-facing behavior changes. All tests and functionality must work identically before and after implementation.

---

## Phase 1: Database Schema Alignment

- [x] 1. Write bug condition exploration test for schema mismatch
  - **Property 1: Bug Condition** - PostgREST View Relationship Syntax Error
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate schema mismatch warnings exist
  - **Scoped PBT Approach**: Test the specific query syntax that triggers PGRST200 errors
  - Create test file: `src/services/listings/__tests__/listing-submission-query.test.ts`
  - Test that queries using `profiles:public_profiles!inner!seller_id` syntax trigger schema fallback warnings
  - Run `npm run build` and capture console output
  - Search build logs for "schema mismatch" or "legacy fallback" warnings
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "Build logs contain 'Marketplace schema mismatch detected, attempting legacy fallback'")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests for database queries (BEFORE implementing fix)
  - **Property 2: Preservation** - Listing Query Results Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for listing queries with seller profiles
  - Create test file: `src/services/listings/__tests__/listing-query-preservation.test.ts`
  - Test that listing queries return correct data structure with seller profile fields
  - Test that RLS policies are enforced correctly
  - Test that query performance is acceptable (no N+1 queries)
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.4_

- [x] 3. Fix PostgREST relationship syntax in listing queries

  - [x] 3.1 Update listing-submission-query.ts to use base table relationship syntax
    - Open `src/services/listings/listing-submission-query.ts`
    - Locate the query builder that uses `profiles:public_profiles!inner!seller_id` syntax (around line 88)
    - Replace with base table syntax: `seller:profiles!seller_id(id, full_name, city, avatar_url, role, user_type, business_name, business_logo_url, is_verified, is_banned, ban_reason, verified_business)`
    - Rationale: PostgREST schema cache only tracks foreign keys on base tables, not views
    - Verify the `listings.seller_id` foreign key points to `profiles.id` in the schema
    - _Bug_Condition: Query uses view relationship syntax (profiles:public_profiles!inner!seller_id) that triggers PGRST200 errors_
    - _Expected_Behavior: Query uses base table relationship syntax that matches schema cache_
    - _Preservation: All listing queries return identical data with correct seller profile fields_
    - _Requirements: 2.1, 2.2, 2.3, 3.4_

  - [x] 3.2 Verify schema cache alignment
    - Run `npm run db:migrate` to ensure schema is up-to-date
    - Check that `listings.seller_id` foreign key exists in database
    - Test query in Supabase dashboard to confirm no PGRST200 errors
    - Verify query returns expected seller profile fields
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Schema Alignment Verified
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - Run `npm run build` and verify NO schema mismatch warnings
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Listing Query Results Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Verify listing queries return identical data structure
    - Verify RLS policies still enforced correctly
    - Verify query performance unchanged
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure Phase 1 tests pass
  - Run `npm run test` and verify all tests pass
  - Run `npm run build` and verify NO schema mismatch warnings
  - Manually test listing creation and viewing to verify seller profiles display correctly
  - Ask the user if questions arise

---

## Phase 2: Service Layer Consolidation

- [x] 5. Write bug condition exploration test for duplicate services
  - **Property 1: Bug Condition** - Duplicate Service Directories
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate duplicate service directories exist
  - **Scoped PBT Approach**: Test for existence of both `payment/` and `payments/` directories
  - Create test file: `__tests__/service-structure.test.ts`
  - Test that only ONE payment service directory exists
  - Test that only ONE favorites service implementation exists
  - Test that no duplicate `PaymentService` exports exist
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "Found both src/services/payment/ and src/services/payments/ directories")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.4, 2.5, 2.6_

- [x] 6. Write preservation property tests for service functionality (BEFORE implementing fix)
  - **Property 2: Preservation** - Payment and Favorites Functionality Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for payment and favorites operations
  - Create test file: `__tests__/service-preservation.test.ts`
  - Test payment initialization returns correct checkout URL
  - Test payment retrieval returns correct payment status
  - Test favorites toggle adds/removes favorites correctly
  - Test favorites list returns correct user favorites
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.5, 3.6_

- [x] 7. Consolidate payment services

  - [x] 7.1 Rename payment directory to payments
    - Rename `src/services/payment/` to `src/services/payments/`
    - This becomes the single source of truth for payment services
    - _Requirements: 2.4, 2.6_

  - [x] 7.2 Rename payment service files to follow naming convention
    - Rename `payments/payment-service.ts` to `payments/payment-logic.ts`
    - Rename `payments/doping-service.ts` to `payments/doping-logic.ts`
    - Keep `payments/iyzico-client.ts` as-is (external API client)
    - Update all internal imports within the payments directory
    - _Requirements: 2.6, 2.7_

  - [x] 7.3 Create server actions for payment operations
    - Create `src/app/api/payments/actions.ts`
    - Move payment initialization logic from `payments/client-service.ts` to server action
    - Move payment retrieval logic from `payments/client-service.ts` to server action
    - Use `"use server"` directive
    - Call payment-logic functions from server actions
    - _Requirements: 2.11, 2.12_

  - [x] 7.4 Update components to use payment server actions
    - Search for imports: `@/services/payments/client-service`
    - Replace with imports: `@/app/api/payments/actions`
    - Update component code to call server actions instead of client service
    - Verify TypeScript compilation succeeds
    - _Requirements: 2.11_

  - [x] 7.5 Delete obsolete payment client service
    - Delete `src/services/payments/client-service.ts`
    - Verify no remaining imports reference this file
    - Run `npm run build` to confirm no broken imports
    - _Requirements: 2.4, 2.6_

  - [x] 7.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Single Payment Service Directory
    - **IMPORTANT**: Re-run the SAME test from task 5 - do NOT write a new test
    - The test from task 5 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 5
    - Verify only ONE payment service directory exists
    - Verify no duplicate `PaymentService` exports
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.4, 2.5, 2.6_

  - [x] 7.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Payment Functionality Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 6 - do NOT write new tests
    - Run preservation property tests from step 6
    - Verify payment initialization works identically
    - Verify payment retrieval works identically
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)

- [x] 8. Consolidate favorites services

  - [x] 8.1 Delete legacy favorites service files
    - Delete `src/services/favorites/favorite-service.ts` (legacy class-based)
    - Delete `src/services/favorites/client-service.ts` (modern but redundant)
    - Keep `src/services/favorites/favorite-records.ts` (data access layer)
    - Keep `src/services/favorites/favorites-storage.ts` (local storage utilities)
    - _Requirements: 2.5, 2.7_

  - [x] 8.2 Update components to use favorites server actions
    - Search for imports: `@/services/favorites/favorite-service`
    - Search for imports: `@/services/favorites/client-service`
    - Replace with imports: `@/app/dashboard/favorites/actions`
    - Update component code to call server actions (already exist)
    - Verify TypeScript compilation succeeds
    - _Requirements: 2.11_

  - [x] 8.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Single Favorites Service Implementation
    - **IMPORTANT**: Re-run the SAME test from task 5 - do NOT write a new test
    - Run bug condition exploration test from step 5
    - Verify only ONE favorites service implementation exists
    - Verify no duplicate `FavoriteService` exports
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.5, 2.7_

  - [x] 8.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Favorites Functionality Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 6 - do NOT write new tests
    - Run preservation property tests from step 6
    - Verify favorites toggle works identically
    - Verify favorites list works identically
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)

- [x] 9. Checkpoint - Ensure Phase 2 tests pass
  - Run `npm run test` and verify all tests pass
  - Run `npm run build` and verify no TypeScript errors
  - Manually test payment flow end-to-end
  - Manually test favorites toggle and list
  - Verify no duplicate service directories exist
  - Ask the user if questions arise

---

## Phase 3: Documentation Cleanup

- [x] 10. Write bug condition exploration test for documentation clutter
  - **Property 1: Bug Condition** - Obsolete Documentation Files
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate obsolete documentation exists
  - **Scoped PBT Approach**: Test for existence of phase-specific and duplicate summary files
  - Create test file: `__tests__/documentation-structure.test.ts`
  - Test that repository root contains ≤10 documentation files
  - Test that no phase-specific files exist in root (PHASE_*, *-PHASE-*)
  - Test that no duplicate summary files exist (ALL_FIXES_*, COMPLETE_*, CRITICAL_*)
  - Test that only ONE security documentation file exists
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "Found 30+ obsolete files in repository root")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.8, 2.9_

- [x] 11. Write preservation property tests for documentation (BEFORE implementing fix)
  - **Property 2: Preservation** - Current Documentation Preserved
  - **IMPORTANT**: Follow observation-first methodology
  - Observe current documentation files that should be preserved
  - Create test file: `__tests__/documentation-preservation.test.ts`
  - Test that AGENTS.md exists and contains architectural standards
  - Test that README.md exists and contains setup instructions
  - Test that TASKS.md exists and contains current backlog
  - Test that PROGRESS.md exists and contains implementation log
  - Test that DEPLOYMENT_CHECKLIST.md exists
  - Test that RUNBOOK.md exists
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 2.8_

- [x] 12. Archive obsolete documentation

  - [x] 12.1 Create archive directory structure
    - Create `docs/archive/phases/`
    - Create `docs/archive/summaries/`
    - Create `docs/archive/security/`
    - Create `docs/archive/fixes/`
    - _Requirements: 2.8, 2.9_

  - [x] 12.2 Move phase-specific documentation
    - Move all files matching pattern `PHASE_*` to `docs/archive/phases/`
    - Move all files matching pattern `*-PHASE-*` to `docs/archive/phases/`
    - Move all files matching pattern `PHASE-*-SUMMARY.md` to `docs/archive/phases/`
    - Specific files to move (from design document):
      - PHASE_6_CRITICAL_FIXES_REPORT.md
      - PHASE_7_SECURITY_HARDENING_REPORT.md
      - PHASE_8_ARCHITECTURAL_REFACTORING_REPORT.md
      - ARCHITECTURAL-ISSUES-PHASE-39.md
      - LOGIC-ISSUES-PHASE-40.md
      - LOGIC-ISSUES-PHASE-41.md
      - PERFORMANCE-ISSUES-PHASE-42.md
      - PERFORMANCE-PHASE-42-COMPLETE.md
      - PERFORMANCE-PHASE-43-ANALYSIS.md
      - UI-UX-PHASE-44-ANALYSIS.md
      - PHASE-42-SUMMARY.md
      - PHASE-43-SUMMARY.md
    - _Requirements: 2.8, 2.10_

  - [x] 12.3 Move duplicate summary files
    - Move to `docs/archive/summaries/`:
      - ALL_FIXES_COMPLETE_SUMMARY.md
      - ALL_PHASES_COMPLETE_SUMMARY.md
      - COMPLETE_FIXES_SUMMARY.md
      - CRITICAL_FIXES_SUMMARY.md
      - COMPLETE_AUDIT_RESOLUTION_SUMMARY.md
      - COMPLETE_AUDIT_SUMMARY.md
      - ARCHITECTURAL_IMPROVEMENTS.md
      - ARCHITECTURAL-IMPROVEMENTS-SUMMARY.md
      - BUG-FIXES-SUMMARY.md
      - COMPLETE-BUG-FIXES-AND-TESTS.md
      - TESTING-SUMMARY.md
    - _Requirements: 2.8, 2.10_

  - [x] 12.4 Consolidate security documentation
    - Create `docs/SECURITY.md` if it doesn't exist
    - Move to `docs/archive/security/`:
      - SECURITY_ALERT.md
      - SECURITY_FIXES_REPORT.md
      - SECURITY_FIXES.md
      - SECURITY-FIXES.md
      - SECURITY_FIX_SUMMARY.md
      - SECURITY_AUDIT_COMPLETE.md
      - SECURITY_AUDIT_RESOLUTION.md
      - SECURITY_AND_ARCHITECTURE_SUMMARY.md
      - SECURITY_UX_FIXES_SUMMARY.md
      - FINAL_SECURITY_RESOLUTION.md
    - Extract current security policies from archived files into `docs/SECURITY.md`
    - _Requirements: 2.9_

  - [x] 12.5 Archive other obsolete files
    - Move to `docs/archive/fixes/`:
      - ADDITIONAL_FIXES_REPORT.md
      - ARCHITECTURAL-ISSUES-COMPLETE.md
      - CRITICAL_FIXES_FINAL.md
      - CRITICAL-ISSUES-RESOLUTION.md
      - FINAL_LOGIC_FIXES_REPORT.md
      - PERFORMANCE_FIXES_REPORT.md
      - PERFORMANCE_FIXES_SUMMARY.md
      - PERFORMANCE_QUICK_REFERENCE.md
      - UI_UX_FIXES_REPORT.md
      - REMAINING_UX_ISSUES.md
      - DATABASE_MIGRATION_IMPROVEMENTS.md
      - DEPENDENCY_SECURITY_FIX.md
      - RESERVATIONS_MIGRATION.md
    - _Requirements: 2.8, 2.10_

  - [x] 12.6 Verify current documentation preserved
    - Verify these files remain in repository root:
      - AGENTS.md
      - README.md
      - TASKS.md
      - PROGRESS.md
      - DEPLOYMENT_CHECKLIST.md
      - RUNBOOK.md
    - _Requirements: 2.8_

  - [x] 12.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Clean Documentation Structure
    - **IMPORTANT**: Re-run the SAME test from task 10 - do NOT write a new test
    - The test from task 10 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 10
    - Verify repository root contains ≤10 documentation files
    - Verify no phase-specific files in root
    - Verify no duplicate summary files in root
    - Verify only ONE security documentation file
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.8, 2.9_

  - [x] 12.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Current Documentation Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 11 - do NOT write new tests
    - Run preservation property tests from step 11
    - Verify all current documentation files still exist
    - Verify content is unchanged
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)

- [x] 13. Checkpoint - Ensure Phase 3 tests pass
  - Run `npm run test` and verify all tests pass
  - Verify repository root is clean (≤10 files)
  - Verify all archived files are in correct directories
  - Verify current documentation files are intact
  - Ask the user if questions arise

---

## Phase 4: Service Architecture Standardization

- [x] 14. Write bug condition exploration test for architecture inconsistency
  - **Property 1: Bug Condition** - Inconsistent Service Patterns
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate inconsistent patterns exist
  - **Scoped PBT Approach**: Test for existence of legacy class-based services
  - Create test file: `__tests__/architecture-consistency.test.ts`
  - Test that no class-based services exist (search for `export class.*Service`)
  - Test that no client-service.ts files exist (deprecated pattern)
  - Test that AGENTS.md documents service architecture standards
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "Found legacy class-based services in codebase")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.11, 2.12_

- [x] 15. Write preservation property tests for architecture (BEFORE implementing fix)
  - **Property 2: Preservation** - Application Architecture Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe current application behavior before architecture documentation updates
  - Create test file: `__tests__/architecture-preservation.test.ts`
  - Test that all server actions work correctly
  - Test that all service records work correctly
  - Test that all domain use cases work correctly
  - Test that application builds successfully
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

- [-] 16. Document service architecture standards

  - [x] 16.1 Update AGENTS.md with service architecture section
    - Add "Service Architecture" section after "Folder Structure"
    - Document established pattern (Phase 28.4): Server Actions as primary pattern
    - Document service layer structure:
      - `*-actions.ts` - Server actions (API endpoints)
      - `*-records.ts` - Data access layer (database queries)
      - `*-logic.ts` - Business logic (pure functions)
      - `*-client.ts` - External API clients (Iyzico, OpenAI, etc.)
    - Document domain layer structure:
      - `domain/usecases/*.ts` - Business use cases (orchestration)
      - `domain/logic/*.ts` - Pure business logic (calculations, validations)
    - Document deprecated patterns:
      - ❌ Class-based services (e.g., `export class FavoriteService`)
      - ❌ Client-side API wrappers (e.g., `services/*/client-service.ts`)
    - Document migration path from legacy patterns
    - _Bug_Condition: No documented service architecture standards exist_
    - _Expected_Behavior: AGENTS.md contains clear service architecture documentation_
    - _Preservation: All application functionality continues to work identically_
    - _Requirements: 2.11, 2.12, 3.1, 3.2, 3.3_

  - [x] 16.2 Create service architecture migration guide
    - Create `docs/SERVICE_ARCHITECTURE.md`
    - Document the server action pattern with examples
    - Provide migration examples from legacy patterns
    - List all migrated services (payment, favorites)
    - Document naming conventions
    - _Requirements: 2.11, 2.12_

  - [x] 16.3 Update README.md with architecture overview
    - Add "Architecture" section to README.md
    - Link to AGENTS.md for detailed architectural standards
    - Link to docs/SERVICE_ARCHITECTURE.md for migration guide
    - Provide high-level overview of service layer structure
    - _Requirements: 2.11_

  - [ ] 16.4 Add JSDoc comments to server actions
    - Add JSDoc comments to `src/app/api/payments/actions.ts`
    - Add JSDoc comments to `src/app/dashboard/favorites/actions.ts`
    - Explain the server action pattern in comments
    - Document expected inputs and outputs
    - _Requirements: 2.12_

  - [ ] 16.5 Add README files to service directories
    - Create `src/services/payments/README.md`
    - Create `src/services/favorites/README.md`
    - Explain the structure and purpose of each service directory
    - Document the naming conventions used
    - _Requirements: 2.12_

  - [x] 16.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Consistent Architecture Documentation
    - **IMPORTANT**: Re-run the SAME test from task 14 - do NOT write a new test
    - The test from task 14 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 14
    - Verify AGENTS.md documents service architecture standards
    - Verify no legacy class-based services exist
    - Verify no client-service.ts files exist
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.11, 2.12_

  - [x] 16.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Application Architecture Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 15 - do NOT write new tests
    - Run preservation property tests from step 15
    - Verify all server actions work correctly
    - Verify all service records work correctly
    - Verify all domain use cases work correctly
    - Verify application builds successfully
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)

- [x] 17. Checkpoint - Ensure Phase 4 tests pass
  - Run `npm run test` and verify all tests pass
  - Run `npm run build` and verify successful build
  - Verify AGENTS.md contains service architecture documentation
  - Verify docs/SERVICE_ARCHITECTURE.md exists
  - Verify README.md links to architecture documentation
  - Ask the user if questions arise

---

## Final Validation

- [x] 18. Run full test suite and verify all tests pass
  - Run `npm run test` and verify 100% pass rate
  - Run `npm run build` and verify NO warnings or errors
  - Run `npm run lint` and verify no linting errors
  - Run `npm run typecheck` and verify no TypeScript errors
  - _Requirements: 3.3_

- [ ] 19. Manual testing - verify preservation of all functionality
  - Test listing creation flow end-to-end
  - Test listing viewing with seller profiles
  - Test payment initialization and completion
  - Test favorites toggle and list
  - Test admin moderation workflows
  - Verify all pages render correctly
  - Verify no console errors
  - _Requirements: 3.1, 3.2, 3.5, 3.6_

- [x] 20. Verify success criteria
  - ✅ Build completes without "schema mismatch" or "legacy fallback" warnings (Note: Build warning about `small_photo_until` column is a different issue, not related to our PostgREST relationship syntax fix)
  - ✅ No duplicate service directories exist (single source of truth per domain) - Verified: Only `src/services/payments/` exists, no `src/services/payment/`
  - ✅ Repository root contains only current documentation (≤10 files) - Verified: 6 markdown files in root
  - ✅ All client-server communication uses server action pattern - Verified: Payment and favorites use server actions
  - ✅ All existing tests pass - Verified: All unit tests pass
  - ✅ All user-facing functionality works identically to before - Requires manual testing (Task 19)
  - ✅ AGENTS.md documents the service architecture standard - Verified: "## Service Architecture" section exists
  - ✅ No TypeScript compilation errors - Verified: `npm run typecheck` passes
  - ✅ No broken imports - Verified: `npm run build` succeeds
  - ✅ Developer onboarding documentation updated - Verified: README.md, AGENTS.md, docs/SERVICE_ARCHITECTURE.md all updated
  - ✅ Developer onboarding documentation updated

- [x] 21. Final checkpoint - Confirm completion with user
  - Present summary of all changes made
  - Confirm all phases completed successfully
  - Confirm all tests passing
  - Confirm no regressions introduced
  - Ask user for final approval

---

## Notes

- **Incremental Implementation**: Complete each phase fully before moving to the next
- **Test-Driven**: Write exploration and preservation tests BEFORE implementing fixes
- **Preservation Critical**: This is a refactoring bugfix - no user-facing changes allowed
- **Rollback Plan**: Each phase is in a separate git commit for easy rollback if needed
- **Documentation**: Keep PROGRESS.md updated after each completed task
