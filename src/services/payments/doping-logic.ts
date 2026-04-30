import { logger } from "@/lib/logging/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Applies a doping package to a listing using the activate_doping RPC.
 * This is typically called after a successful payment.
 *
 * Pure function - no class wrapper
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */
export async function applyDopingPackage(params: {
  userId: string;
  listingId: string;
  packageId: string;
  paymentId: string;
}) {
  const supabase = await createSupabaseServerClient();

  // Map slug to DB UUID if needed
  const dbPackageId = await getDbPackageId(params.packageId);
  if (!dbPackageId) {
    throw new Error(`Invalid doping package: ${params.packageId}`);
  }

  // Call the RPC function
  // USE SERVER CLIENT: Enforce RLS and auth context on RPC call
  const { data, error } = await supabase.rpc("activate_doping", {
    p_user_id: params.userId,
    p_listing_id: params.listingId,
    p_package_id: dbPackageId,
    p_payment_id: params.paymentId,
  });

  if (error) {
    logger.payments.error("Doping activation RPC failed", error);
    throw new Error(`Doping activation failed: ${error.message}`);
  }

  if (!data?.success) {
    throw new Error(data?.error || "Doping activation failed");
  }

  return {
    purchaseId: data.purchaseId,
    expiresAt: data.expiresAt,
  };
}

/**
 * Helper to map package slug (id in DOPING_PACKAGES) to DB UUID
 * Private helper function
 */
async function getDbPackageId(slug: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("doping_packages").select("id").eq("slug", slug).single();

  return data?.id || null;
}

/**
 * Get active dopings for a listing
 *
 * Pure function - no class wrapper
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */
export async function getActiveDopingsForListing(listingId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_active_dopings_for_listing", {
    p_listing_id: listingId,
  });

  if (error) {
    logger.payments.error("Failed to get active dopings", error);
    return [];
  }

  return data || [];
}
