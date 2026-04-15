/**
 * Bug Condition Exploration Test — Bug 5: router.push NOT called after successful submit
 *
 * These tests MUST FAIL on unfixed code.
 * Failure confirms the bug exists.
 * DO NOT fix the code when these tests fail.
 *
 * Validates: Requirements 1.9, 1.10
 *
 * Strategy: Read the source code directly to detect the bug condition.
 * The bug is: after successful submit (isEditing=false), only router.refresh() is called,
 * router.push("/dashboard/listings") is never called.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Bug 5 — router.push NOT called after successful submit (EXPECTED TO FAIL on unfixed code)', () => {
  const sourceCode = readFileSync(
    resolve(process.cwd(), 'src/components/forms/listing-create-form.tsx'),
    'utf-8'
  );

  /**
   * Bug condition: The onSubmit handler calls router.refresh() but NOT router.push()
   * for the non-editing case after a successful API response.
   *
   * Fixed code should have: else router.push("/dashboard/listings")
   * Unfixed code has: router.refresh() (no push for non-editing case)
   *
   * Counterexample: successful submit (isEditing=false) → router.push never called
   */
  it('should call router.push("/dashboard/listings") for new listing after successful submit', () => {
    // On unfixed code: the source contains only router.refresh() without router.push for new listings
    // The fix adds: else router.push("/dashboard/listings")
    // This test FAILS on unfixed code because router.push is not present in the success path

    // Check that router.push is called in the success path (not just router.refresh)
    // The unfixed code pattern: "if (isEditing) router.replace(...); router.refresh();"
    // The fixed code pattern: "if (isEditing) router.replace(...); else router.push(...);"

    const hasRouterPushInSuccessPath = sourceCode.includes('router.push("/dashboard/listings")');

    // On unfixed code: router.push is NOT in the source → test FAILS
    expect(hasRouterPushInSuccessPath).toBe(true);
  });

  it('should NOT have router.refresh() as the only navigation call after successful submit', () => {
    // On unfixed code: router.refresh() is called without router.push for new listings
    // This means the user stays on the same page after creating a listing

    // Extract the onSubmit handler section
    const onSubmitMatch = sourceCode.match(/const onSubmit = handleSubmit\(async[\s\S]*?\}\);/);
    expect(onSubmitMatch).not.toBeNull();

    const onSubmitCode = onSubmitMatch![0];

    // On unfixed code: onSubmit contains router.refresh() but NOT router.push
    // This test FAILS on unfixed code
    const hasRefreshWithoutPush =
      onSubmitCode.includes('router.refresh()') &&
      !onSubmitCode.includes('router.push(');

    // The bug condition: refresh without push → user stays on page
    // On unfixed code: hasRefreshWithoutPush = true → expect(false).toBe(false) passes... 
    // We want this to FAIL on unfixed code, so we assert the opposite:
    expect(hasRefreshWithoutPush).toBe(false);
  });
});
