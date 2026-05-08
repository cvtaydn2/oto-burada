import { createSupabaseAdminClient } from "@/lib/admin";
import { logger } from "@/lib/logger";

const CORPORATE_PLAN_NAME_REGEX = /(kurumsal|corporate|filo)/i;
const PAYMENT_EXPIRY_KEYS = [
  "expires_at",
  "expiresAt",
  "subscription_expires_at",
  "subscriptionExpiresAt",
] as const;

type SubscriptionStatus = "active" | "expired";

export async function processReconciliation() {
  const supabase = createSupabaseAdminClient();

  logger.system.info("Reconciliation: Starting daily status audit...");

  const syncThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 1. Audit Corporate Subscriptions
  // Fetch corporate users synced more than 24h ago or never synced
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, role, subscription_synced_at")
    .eq("role", "corporate")
    .or(`subscription_synced_at.is.null,subscription_synced_at.lte.${syncThreshold}`);

  if (error || !users) return;

  let processedCount = 0;
  let expiredCount = 0;
  let errorCount = 0;

  for (const user of users) {
    try {
      const subscriptionStatus = await checkUserSubscriptionStatus(user.id);

      if (subscriptionStatus === "expired") {
        logger.system.warn(
          `Reconciliation: User ${user.id} subscription expired or unverifiable in DB. Fixing...`
        );
        await supabase
          .from("profiles")
          .update({
            role: "user",
            subscription_synced_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        expiredCount++;
      } else {
        // Still active - update sync timestamp
        await supabase
          .from("profiles")
          .update({
            subscription_synced_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }
      processedCount++;
    } catch (err) {
      errorCount++;
      logger.system.error(`Reconciliation: Failed to check user ${user.id}`, err);
      // Continue with next user - don't fail entire reconciliation
    }
  }

  logger.system.info(
    `Reconciliation: Completed. Processed: ${processedCount}, Expired: ${expiredCount}, Errors: ${errorCount}`
  );
}

async function checkUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const supabase = createSupabaseAdminClient();

  logger.system.debug(`Reconciliation: Checking subscription status for user ${userId}`);

  const { data: latestPaidPlan, error } = await supabase
    .from("payments")
    .select("id, plan_name, metadata, created_at")
    .eq("user_id", userId)
    .eq("status", "success")
    .not("plan_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !latestPaidPlan) {
    logger.system.warn("Reconciliation: Subscription cannot be derived from payments", {
      userId,
      reason: error?.message ?? "missing_successful_plan_payment",
    });
    return "expired";
  }

  const planName = latestPaidPlan.plan_name ?? "";
  if (!CORPORATE_PLAN_NAME_REGEX.test(planName)) {
    logger.system.warn("Reconciliation: Non-corporate plan found for corporate role", {
      userId,
      paymentId: latestPaidPlan.id,
      planName,
    });
    return "expired";
  }

  const expiresAt = extractExpiryDateFromPaymentMetadata(latestPaidPlan.metadata);
  if (!expiresAt) {
    logger.system.warn("Reconciliation: Expiry is missing/invalid in payment metadata", {
      userId,
      paymentId: latestPaidPlan.id,
    });
    return "expired";
  }

  return expiresAt.getTime() > Date.now() ? "active" : "expired";
}

function extractExpiryDateFromPaymentMetadata(metadata: unknown): Date | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const safeMetadata = metadata as Record<string, unknown>;

  for (const key of PAYMENT_EXPIRY_KEYS) {
    const rawValue = safeMetadata[key];
    if (typeof rawValue !== "string") continue;

    const parsed = new Date(rawValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

// Backward compatibility alias
const simulateExternalStatusCheck = checkUserSubscriptionStatus;
export { simulateExternalStatusCheck };
