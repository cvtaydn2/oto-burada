/**
 * Preservation Tests — Bug 5: isEditing=true calls router.replace (not router.push)
 *
 * These tests MUST PASS on unfixed code — they establish baseline behavior
 * that must not regress after fixes.
 *
 * Validates: Requirements 3.5, 3.6
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Preservation — isEditing=true uses router.replace (baseline, must pass on unfixed code)', () => {
  const sourceCode = readFileSync(
    resolve(process.cwd(), 'src/components/forms/listing-create-form.tsx'),
    'utf-8'
  );

  /**
   * When isEditing = true, the form should call router.replace("/dashboard/listings").
   * This behavior is already correct in unfixed code and must be preserved after fixes.
   */
  it('should call router.replace("/dashboard/listings") when isEditing is true', () => {
    // The unfixed code already has: if (isEditing) router.replace("/dashboard/listings")
    // This must remain after the fix
    expect(sourceCode).toContain('router.replace("/dashboard/listings")');
  });

  it('should guard router.replace with isEditing condition', () => {
    // The replace call must be conditional on isEditing
    expect(sourceCode).toMatch(/if\s*\(isEditing\)\s*router\.replace/);
  });
});
