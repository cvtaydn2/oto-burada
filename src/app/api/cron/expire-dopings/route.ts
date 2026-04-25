import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withCronOrAdmin } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

  try {
    // Call the atomic RPC function
    const { data, error } = await admin.rpc("expire_dopings_atomic");

    if (error) {
      logger.system.error("Atomic doping expiry failed", error);
      return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Atomic doping expiry failed.", 500);
    }

    if (!data?.success) {
      logger.system.error("Doping expiry logic failed", data?.error);
      return apiError(API_ERROR_CODES.INTERNAL_ERROR, data?.error || "Expiry failed.", 500);
    }

    logger.system.info("Doping expiry cron completed via RPC", data);

    return apiSuccess(data, "Doping expiry completed.");
  } catch (error) {
    logger.system.error("Doping expiry cron failed", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Doping expiry failed.", 500);
  }
}
