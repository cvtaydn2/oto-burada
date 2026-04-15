# Implementation Plan

- [x] 1. Write bug condition exploration tests (BEFORE implementing any fix)
  - **Property 1: Bug Condition** - viewCount NaN / profiles.email / plateLookup / expertGrid / submitButton
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **GOAL**: Surface counterexamples that demonstrate each bug exists
  - Create test file: `src/services/listings/__tests__/listing-submissions.bug.test.ts`
    - Import `buildListingRecord` from `src/services/listings/listing-submissions.ts`
    - Call `buildListingRecord` with minimal valid `ListingCreateInput` (no `viewCount` in parse call)
    - Assert `ZodError` is thrown with message containing `"viewCount"` and `"NaN"`
    - Scoped PBT: for any `ListingCreateInput`, `buildListingRecord` throws `ZodError` on unfixed code
    - Document counterexample: `buildListingRecord(minimalInput, sellerId, [])` → `ZodError: viewCount: Invalid input: expected number, received NaN`
  - Create test file: `src/services/admin/__tests__/support.bug.test.ts`
    - Import `getAllTickets` (or `getSupportTickets`) from `src/services/admin/support.ts`
    - Mock Supabase client to return `{ code: "42703", message: "column profiles_1.email does not exist" }`
    - Assert the function returns empty array or propagates the DB error
    - Document counterexample: `getSupportTickets()` → `PostgrestError: column profiles_1.email does not exist`
  - Create test file: `src/services/listings/__tests__/plate-lookup.bug.test.ts`
    - Import `lookupVehicleByPlate` from `src/services/listings/plate-lookup.ts`
    - Mock Supabase `brands` query with `is_active = true` filter returning empty array
    - Assert `lookupVehicleByPlate("34ABC123")` returns `null`
    - Document counterexample: `lookupVehicleByPlate("34ABC123")` → `null` (is_active filter eliminates all brands)
  - Create test file: `src/components/forms/__tests__/expert-inspection-editor.bug.test.tsx`
    - Render `ExpertInspectionEditor` with `hasInspection = true`
    - Assert right-column fields ("Şanzıman", "Fren", "İç Kondisyon", "Klima") are in the DOM but not visible (overflow hidden)
    - Document counterexample: `getByText("Şanzıman / Vites Geçişleri")` exists but `getBoundingClientRect().width === 0`
  - Create test file: `src/components/forms/__tests__/listing-create-form.bug.test.tsx`
    - Render `ListingCreateForm` with `isEmailVerified = true`, all required fields filled
    - Mock `fetch` to return `{ ok: true, json: () => ({ success: true }) }`
    - Mock `router.push`
    - Submit the form
    - Assert `router.push("/dashboard/listings")` was NOT called (only `router.refresh` was called)
    - Document counterexample: successful submit → `router.push` never called, user stays on same page
  - Run all tests on UNFIXED code — **EXPECTED OUTCOME**: All 5 tests FAIL
  - Document all counterexamples found
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

- [x] 2. Write preservation property tests (BEFORE implementing any fix)
  - **Property 2: Preservation** - Mevcut Davranışların Korunması
  - **IMPORTANT**: Follow observation-first methodology — observe UNFIXED code behavior for non-buggy inputs
  - **GOAL**: Establish baseline behavior that must not regress after fixes
  - Observe on UNFIXED code:
    - `mapListingRow` with `row.view_count = 42` → `viewCount: 42` (not affected by Bug 1)
    - `mapListingRow` with `row.view_count = null` → `viewCount: 0`
    - `getSupportTickets` `full_name` field is correctly mapped when query succeeds
    - `lookupVehicleByPlate` with invalid format (e.g. `"INVALID"`) → `null`
    - `ExpertInspectionEditor` with `hasInspection = false` → grid not rendered
    - `ListingCreateForm` with `isEditing = true` → `router.replace("/dashboard/listings")` called
  - Create test file: `src/services/listings/__tests__/listing-submissions.preservation.test.ts`
    - PBT: for any `row` where `row.view_count` is a non-null number, `mapListingRow(row).viewCount === row.view_count`
    - PBT: for any `row` where `row.view_count` is null/undefined, `mapListingRow(row).viewCount === 0`
    - Assert `buildListingRecord` with `existingListing.viewCount = 42` preserves `viewCount: 42` after fix
  - Create test file: `src/services/admin/__tests__/support.preservation.test.ts`
    - Assert `full_name` is correctly returned from `getSupportTickets` when query succeeds (no email column)
    - Assert ticket creation and listing still works end-to-end
  - Create test file: `src/services/listings/__tests__/plate-lookup.preservation.test.ts`
    - Assert `lookupVehicleByPlate` with invalid plate format returns `null` (format validation preserved)
    - Assert VIN/chassis 17-char validation still applies
  - Create test file: `src/components/forms/__tests__/expert-inspection-editor.preservation.test.tsx`
    - Assert `ExpertInspectionEditor` with `hasInspection = false` renders no grid fields
    - Assert form can be submitted without inspection data when `hasInspection = false`
  - Create test file: `src/components/forms/__tests__/listing-create-form.preservation.test.tsx`
    - Assert `isEditing = true` → `router.replace("/dashboard/listings")` called (not `router.push`)
    - Assert fraud score, slug generation, `pending` status are unchanged in API payload
  - Run all preservation tests on UNFIXED code
  - **EXPECTED OUTCOME**: All preservation tests PASS (confirms baseline behavior)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3. Fix Bug 1 — viewCount NaN (`src/services/listings/listing-submissions.ts`)

  - [x] 3.1 Implement viewCount fix in `buildListingRecord`
    - Open `src/services/listings/listing-submissions.ts`
    - Locate `buildListingRecord` function and its `listingSchema.parse({...})` call
    - Add `viewCount: existingListing?.viewCount ?? 0` to the parse object
    - Ensure `existingListing` parameter is accessible at the call site (pass through if needed)
    - Verify `mapListingRow` already has `viewCount: row.view_count ?? 0` — no change needed there
    - _Bug_Condition: `buildListingRecord` calls `listingSchema.parse(record)` AND `record` does NOT contain `viewCount` field_
    - _Expected_Behavior: `result.viewCount === 0` for new listings, `result.viewCount === existingListing.viewCount` for updates, no ZodError thrown_
    - _Preservation: `mapListingRow` behavior unchanged; existing listings' viewCount values preserved_
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Verify Bug 1 exploration test now passes
    - **Property 1: Expected Behavior** - viewCount NaN Fix
    - **IMPORTANT**: Re-run the SAME test from task 1 (`listing-submissions.bug.test.ts`) — do NOT write a new test
    - Run: `npx jest src/services/listings/__tests__/listing-submissions.bug.test.ts --run`
    - **EXPECTED OUTCOME**: Test PASSES (confirms viewCount NaN bug is fixed)
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify preservation tests still pass for Bug 1
    - **Property 2: Preservation** - viewCount Preservation
    - Re-run `listing-submissions.preservation.test.ts`
    - **EXPECTED OUTCOME**: All preservation tests PASS (no regressions)

- [x] 4. Fix Bug 2 — profiles.email kolon hatası (`src/services/admin/support.ts`)

  - [x] 4.1 Remove `email` from profiles join query
    - Open `src/services/admin/support.ts`
    - In `getAllTickets` (or `getSupportTickets`), change select from `profiles(full_name, email)` to `profiles(full_name)`
    - Update `SupportTicketRow` interface: remove `email` from profiles type definition
    - Update `mapTicketWithProfile` (or equivalent mapper): remove `userEmail: profile?.email` mapping
    - _Bug_Condition: query selects `email` column FROM `profiles` table via join_
    - _Expected_Behavior: no `42703` DB error, tickets returned successfully with `full_name` only_
    - _Preservation: ticket listing, full_name display, ticket creation all unchanged_
    - _Requirements: 2.3_

  - [x] 4.2 Add `getUserEmailById` helper for email lookup via Auth API
    - In `src/services/admin/support.ts`, add exported async function `getUserEmailById(userId: string): Promise<string | null>`
    - Use `createSupabaseAdminClient().auth.admin.getUserById(userId)` to fetch email
    - Return `data.user.email ?? null` on success, `null` on error
    - Update `updateTicketStatus` (or equivalent) to call `getUserEmailById` when sending email notifications
    - _Requirements: 2.4_

  - [x] 4.3 Verify Bug 2 exploration test now passes
    - **Property 1: Expected Behavior** - profiles.email Fix
    - Re-run `support.bug.test.ts`
    - **EXPECTED OUTCOME**: Test PASSES (confirms profiles.email bug is fixed)
    - _Requirements: 2.3, 2.4_

  - [x] 4.4 Verify preservation tests still pass for Bug 2
    - **Property 2: Preservation** - Support Ticket Preservation
    - Re-run `support.preservation.test.ts`
    - **EXPECTED OUTCOME**: All preservation tests PASS (no regressions)

- [x] 5. Fix Bug 3 — Plaka sorgulama (`src/services/listings/plate-lookup.ts`)

  - [x] 5.1 Remove `is_active` filter from brands and models queries
    - Open `src/services/listings/plate-lookup.ts`
    - Remove `.eq("is_active", true)` from `brands` table query
    - Remove `.eq("is_active", true)` from `models` table query (if present)
    - Keep all other query logic (limit, brand_id filter, etc.) unchanged
    - _Bug_Condition: `brands` query with `is_active = true` filter returns empty array because column doesn't exist or all records are false_
    - _Expected_Behavior: `lookupVehicleByPlate("34ABC123")` returns `PlateLookupResult` with brand/model/year/fuel/transmission data_
    - _Preservation: invalid plate format still returns `null`; VIN validation unchanged_
    - _Requirements: 2.5, 2.6_

  - [x] 5.2 Verify plate lookup works end-to-end in the form
    - Open `src/components/forms/listing-create-form.tsx` (or the Step 1 component)
    - Confirm `handlePlateLookup` calls `lookupVehicleByPlate` and uses `setValue` to populate form fields
    - If `setValue` calls are missing, add them for: `brand`, `model`, `year`, `fuelType`, `transmission`
    - Confirm success toast/message is shown on successful lookup
    - _Requirements: 2.5, 2.6_

  - [x] 5.3 Verify Bug 3 exploration test now passes
    - **Property 1: Expected Behavior** - Plate Lookup Fix
    - Re-run `plate-lookup.bug.test.ts`
    - **EXPECTED OUTCOME**: Test PASSES (confirms plate lookup bug is fixed)
    - _Requirements: 2.5, 2.6_

  - [x] 5.4 Verify preservation tests still pass for Bug 3
    - **Property 2: Preservation** - Plate Lookup Preservation
    - Re-run `plate-lookup.preservation.test.ts`
    - **EXPECTED OUTCOME**: All preservation tests PASS (no regressions)

- [x] 6. Fix Bug 4 — Ekspertiz grid sağ sütun (`src/components/forms/expert-inspection-editor.tsx`)

  - [x] 6.1 Fix grid layout breakpoint and overflow
    - Open `src/components/forms/expert-inspection-editor.tsx`
    - Change grid class from `grid-cols-1 sm:grid-cols-2` to `grid-cols-1 md:grid-cols-2`
    - Add `overflow-visible` to the grid `div`
    - Add `overflow-visible` to the container `div` with `bg-muted/30 rounded-2xl p-6 border border-border/50`
    - Optionally change `gap-x-8` to `gap-x-6` for tighter fit
    - _Bug_Condition: viewport width >= 640px AND `hasInspection = true` AND right-column fields not visible_
    - _Expected_Behavior: all 10 `INSPECTION_FIELDS` render in two-column layout, both columns visible at md+ breakpoints_
    - _Preservation: `hasInspection = false` → grid not rendered; mobile (< 768px) → single column layout_
    - _Requirements: 2.7, 2.8_

  - [x] 6.2 Verify Bug 4 exploration test now passes
    - **Property 1: Expected Behavior** - Expert Grid Fix
    - Re-run `expert-inspection-editor.bug.test.tsx`
    - **EXPECTED OUTCOME**: Test PASSES (all 10 fields visible)
    - _Requirements: 2.7, 2.8_

  - [x] 6.3 Verify preservation tests still pass for Bug 4
    - **Property 2: Preservation** - Expert Grid Preservation
    - Re-run `expert-inspection-editor.preservation.test.tsx`
    - **EXPECTED OUTCOME**: All preservation tests PASS (no regressions)

- [x] 7. Fix Bug 5 — İlan Yayınla butonu (`src/components/forms/listing-create-form.tsx`)

  - [x] 7.1 Extract submit logic into `submitListing` function
    - Open `src/components/forms/listing-create-form.tsx`
    - Extract the `fetch("/api/listings", ...)` block into a standalone `submitListing(values: ListingCreateFormValues)` async function
    - `submitListing` handles: `clearErrors`, `setSubmitState`, fetch call, field error mapping, success state
    - On success: call `router.replace("/dashboard/listings")` if `isEditing`, else call `router.push("/dashboard/listings")`
    - Remove the old `router.refresh()` call for the non-editing case
    - _Bug_Condition: `submitSuccess = true` AND `router.push` NOT called (only `router.refresh` called)_
    - _Expected_Behavior: after successful POST, `router.push("/dashboard/listings")` is called_
    - _Preservation: `isEditing = true` → `router.replace("/dashboard/listings")` still called (unchanged)_
    - _Requirements: 2.9, 2.10_

  - [x] 7.2 Fix `onSubmit` handler and `PhoneVerificationDialog` `onSuccess` callback
    - Update `onSubmit` to call `await submitListing(values)` (using the extracted function)
    - Update `PhoneVerificationDialog` `onSuccess` callback:
      - Set `isEmailVerifiedLocally(true)`
      - Set `setIsVerifyDialogOpen(false)`
      - Call `form.handleSubmit(submitListing)()` to programmatically re-submit with current form values
    - Remove the old `onSubmit()` direct call from `onSuccess`
    - _Bug_Condition: `isEmailVerifiedLocally = false` AND `allFieldsValid = true` → dialog opens, closes, form never submits_
    - _Expected_Behavior: after verification dialog success, form submits and `router.push("/dashboard/listings")` is called_
    - _Requirements: 2.9, 2.10_

  - [x] 7.3 Verify Bug 5 exploration test now passes
    - **Property 1: Expected Behavior** - Submit Button Fix
    - Re-run `listing-create-form.bug.test.tsx`
    - **EXPECTED OUTCOME**: Test PASSES (`router.push("/dashboard/listings")` is called after successful submit)
    - _Requirements: 2.9, 2.10_

  - [x] 7.4 Verify preservation tests still pass for Bug 5
    - **Property 2: Preservation** - Submit Flow Preservation
    - Re-run `listing-create-form.preservation.test.tsx`
    - **EXPECTED OUTCOME**: All preservation tests PASS (`isEditing` flow, fraud score, slug, pending status all unchanged)

- [x] 8. Checkpoint — Tüm testler geçmeli
  - Run full test suite: `npx jest --testPathPattern="listing-submissions|support|plate-lookup|expert-inspection-editor|listing-create-form" --run`
  - Confirm all 5 bug condition exploration tests PASS (bugs fixed)
  - Confirm all preservation tests PASS (no regressions)
  - Confirm TypeScript compiles cleanly: `npx tsc --noEmit`
  - Confirm ESLint passes: `npx eslint src/services/listings/listing-submissions.ts src/services/admin/support.ts src/services/listings/plate-lookup.ts src/components/forms/expert-inspection-editor.tsx src/components/forms/listing-create-form.tsx`
  - If any test fails, investigate and fix before marking complete
  - Ask the user if any questions arise
