import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withCronOrAdmin } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";

/**
 * Cron job to expire doping purchases and reset listing doping flags.
 * Triggered by Vercel Cron every hour.
 * Note: pg_cron also handles this at the DB level (migration 0069).
 * This route provides an application-level fallback and audit trail.
 */
export async function GET(request: Request) {
  const security = await withCronOrAdmin(request);
  if (!security.ok) return security.response;

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  try {
    // 1. Expire featured dopings
    const { error: featuredError } = await admin
      .from("listings")
      .update({
        featured: false,
        is_featured: false,
        featured_until: null,
        updated_at: now,
      })
      .eq("featured", true)
      .not("featured_until", "is", null)
      .lt("featured_until", now);

    if (featuredError) {
      logger.system.error("Failed to expire featured dopings", featuredError);
    }

    // 2. Expire urgent dopings
    const { error: urgentError } = await admin
      .from("listings")
      .update({
        is_urgent: false,
        urgent_until: null,
        updated_at: now,
      })
      .eq("is_urgent", true)
      .not("urgent_until", "is", null)
      .lt("urgent_until", now);

    if (urgentError) {
      logger.system.error("Failed to expire urgent dopings", urgentError);
    }

    // 3. Expire highlighted dopings
    const { error: highlightedError } = await admin
      .from("listings")
      .update({
        highlighted_until: null,
        frame_color: null,
        updated_at: now,
      })
      .not("highlighted_until", "is", null)
      .lt("highlighted_until", now);

    if (highlightedError) {
      logger.system.error("Failed to expire highlighted dopings", highlightedError);
    }

    // 4. Mark doping_purchases as expired
    const { error: purchasesError } = await admin
      .from("doping_purchases")
      .update({ status: "expired" })
      .eq("status", "active")
      .not("expires_at", "is", null)
      .lt("expires_at", now);

    if (purchasesError) {
      logger.system.error("Failed to expire doping purchases", purchasesError);
    }

    const summary = {
      timestamp: now,
      success: !featuredError && !urgentError && !highlightedError && !purchasesError,
    };

    logger.system.info("Doping expiry cron completed", summary);

    return apiSuccess(summary, "Doping expiry completed.");
  } catch (error) {
    logger.system.error("Doping expiry cron failed", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Doping expiry failed.", 500);
  }
}
