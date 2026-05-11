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
 * @param listingId - Listing ID
 * @param packageId - Doping package ID
 * @param paymentId - Payment ID from Iyzico
 * @returns Purchase ID and expiration date
 */
export async function applyDopingAction(params: {
  listingId: string;
  packageId: string;
  paymentId: string;
}) {
  const supabase = await import("@/lib/supabase/server").then((m) =>
    m.createSupabaseServerClient()
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Doping işlemi için giriş yapmalısınız.");
  }

  return applyDopingPackage({
    userId: user.id,
    listingId: params.listingId,
    packageId: params.packageId,
    paymentId: params.paymentId,
  });
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
