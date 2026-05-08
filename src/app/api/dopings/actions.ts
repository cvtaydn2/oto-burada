"use server";

/**
 * Doping Server Actions
 *
 * Modern server actions pattern for doping operations.
 * Replaces legacy DopingService class-based pattern.
 *
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */

import {
  applyDopingPackage,
  getActiveDopingsForListing,
} from "@/features/payments/services/doping-logic";

/**
 * Apply a doping package to a listing
 *
 * @param params - Doping application parameters
 * @returns Purchase ID and expiration date
 */
export async function applyDopingAction(params: {
  userId: string;
  listingId: string;
  packageId: string;
  paymentId: string;
}) {
  return applyDopingPackage(params);
}

/**
 * Get active dopings for a listing
 *
 * @param listingId - Listing ID
 * @returns Array of active doping packages
 */
export async function getActiveDopingsAction(listingId: string) {
  return getActiveDopingsForListing(listingId);
}
