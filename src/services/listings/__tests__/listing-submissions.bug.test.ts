/**
 * Bug Condition Exploration Test — Bug 1: viewCount NaN
 *
 * These tests MUST FAIL on unfixed code.
 * Failure confirms the bug exists.
 * DO NOT fix the code when these tests fail.
 *
 * Validates: Requirements 1.1, 1.2
 */

import { describe, it, expect } from 'vitest';
import { buildListingRecord } from '../listing-submissions';
import type { ListingCreateInput } from '@/types';

const minimalInput: ListingCreateInput = {
  title: 'Test Araç',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2020,
  mileage: 50000,
  fuelType: 'benzin',
  transmission: 'manuel',
  price: 500000,
  city: 'İstanbul',
  district: 'Kadıköy',
  description: 'Test açıklama',
  whatsappPhone: '905551234567',
  vin: 'JT2BF22K1W0123456',
  images: [],
};

describe('Bug 1 — viewCount NaN (EXPECTED TO FAIL on unfixed code)', () => {
  /**
   * Bug condition: buildListingRecord calls listingSchema.parse(record)
   * but record does NOT contain viewCount field.
   * z.coerce.number() converts undefined → NaN, min(0) validation fails.
   *
   * Counterexample: buildListingRecord(minimalInput, 'seller-1', []) → ZodError: viewCount NaN
   */
  it('should NOT throw ZodError for viewCount when creating a new listing', () => {
    // On unfixed code this throws: ZodError: viewCount: Invalid input: expected number, received NaN
    expect(() => buildListingRecord(minimalInput, 'seller-1', [])).not.toThrow();
  });

  it('should return a listing with viewCount === 0 for a new listing', () => {
    // On unfixed code this throws before returning anything
    const result = buildListingRecord(minimalInput, 'seller-1', []);
    expect(result.viewCount).toBe(0);
  });
});
