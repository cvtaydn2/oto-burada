import { DOPING_PRICES } from "@/lib/payment/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { adjustUserCredits } from "@/services/billing/transaction-service";

/**
 * Handles monetization logic related to listings, such as featured status and dopings.
 *
 * SECURITY: All operations are atomic via Database RPCs.
 * Direct balance deductions and status updates are strictly forbidden.
 */

export interface DopingApplication {
  listingId: string;
  userId: string;
  type: "featured" | "urgent" | "highlighted";
  durationDays: number;
  useBalance?: boolean;
}

/**
 * Applies a doping to a listing.
 * If useBalance is true, it atomically deducts the cost from the user's credit balance.
 */
export async function applyDoping(application: DopingApplication) {
  const admin = createSupabaseAdminClient();

  // 0. Security Guard: Only active, non-restricted users can use premium surfaces
  const { data: profile } = await admin
    .from("profiles")
    .select("is_banned")
    .eq("id", application.userId)
    .single();

  if (profile?.is_banned) {
    logger.payments.warn("Blocked doping attempt from restricted user", {
      userId: application.userId,
    });
    throw new Error("Hesabınız inceleme altında olduğu için doping işlemi gerçekleştirilemez.");
  }

  try {
    let paymentId: string | undefined;

    // 1. Handle Credit Spending
    if (application.useBalance) {
      const price = DOPING_PRICES[application.type as keyof typeof DOPING_PRICES]?.price || 0;

      // Atomic credit deduction
      const { transactionId } = await adjustUserCredits({
        userId: application.userId,
        amount: -price,
        type: "doping_spend",
        description: `${application.type} doping uygulaması: ${application.listingId}`,
        referenceId: application.listingId,
        metadata: { dopingType: application.type },
      });

      // We use the transaction ID as reference if no real payment exists
      paymentId = transactionId;
    }

    // 2. Atomic Doping Application
    const { data, error } = await admin.rpc("apply_listing_doping", {
      p_listing_id: application.listingId,
      p_user_id: application.userId,
      p_doping_types: [application.type],
      p_duration_days: application.durationDays,
      p_payment_id: paymentId || null,
    });

    if (error) {
      logger.payments.error("Failed to apply doping via RPC", error, { application });
      throw new Error(`Doping uygulanamadı: ${error.message}`);
    }

    const result = data as { applied_count: number };
    return result.applied_count > 0;
  } catch (err) {
    logger.payments.error("Monetization operation failed", err, { application });
    return false;
  }
}
