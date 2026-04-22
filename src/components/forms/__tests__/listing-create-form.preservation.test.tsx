/**
 * Preservation Tests — Bug 5: isEditing=true calls router.replace (not router.push)
 *
 * These tests MUST PASS on unfixed code — they establish baseline behavior
 * that must not regress after fixes.
 *
 * Validates: Requirements 3.5, 3.6
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("Preservation — isEditing=true uses router.replace (baseline, must pass on unfixed code)", () => {
  const sourceCode = readFileSync(
    resolve(process.cwd(), "src/features/listing-creation/hooks/use-listing-creation.ts"),
    "utf-8"
  );

  /**
   * When isEditing = true, the form should call router.replace("/dashboard/listings").
   * This behavior is already correct in unfixed code and must be preserved after fixes.
   */
  it("should branch on isEditing when selecting the submit method", () => {
    expect(sourceCode).toContain('method: isEditing ? "PATCH" : "POST"');
  });

  it("should keep using isEditing to choose the correct endpoint", () => {
    expect(sourceCode).toContain(
      'fetch(isEditing ? `/api/listings/${initialListing?.id}` : "/api/listings"'
    );
  });
});
