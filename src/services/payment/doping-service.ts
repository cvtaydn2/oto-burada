import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export class DopingService {
  /**
   * Applies a doping package to a listing using the activate_doping RPC.
   * This is typically called after a successful payment.
   */
  static async applyDoping(params: {
    userId: string;
    listingId: string;
    packageId: string;
    paymentId: string;
  }) {
    const admin = createSupabaseAdminClient();

    // Map slug to DB UUID if needed
    const dbPackageId = await this.getDbPackageId(params.packageId);
    if (!dbPackageId) {
      throw new Error(`Invalid doping package: ${params.packageId}`);
    }

    // Call the RPC function
    const { data, error } = await admin.rpc("activate_doping", {
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
   */
  private static async getDbPackageId(slug: string): Promise<string | null> {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("doping_packages").select("id").eq("slug", slug).single();

    return data?.id || null;
  }

  /**
   * Get active dopings for a listing
   */
  static async getActiveDopings(listingId: string) {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc("get_active_dopings_for_listing", {
      p_listing_id: listingId,
    });

    if (error) {
      logger.payments.error("Failed to get active dopings", error);
      return [];
    }

    return data || [];
  }
}
