import { createSupabaseAdminClient } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/response";
import { withCronRoute } from "@/lib/security";

type ExpireDopingsResult = {
  counts?: {
    featured?: number;
    highlighted?: number;
    purchases?: number;
    urgent?: number;
  };
  error?: string;
  success: boolean;
  timestamp?: string;
};

/**
 * Cron job to expire doping purchases and reset listing doping flags.
 * Triggered by Vercel Cron every hour.
 * Note: pg_cron also handles this at the DB level (migration 0069).
 * This route provides an application-level fallback and audit trail.
 */
export async function GET(request: Request) {
  const security = await withCronRoute(request);
  if (!security.ok) return security.response;

  const admin = createSupabaseAdminClient();

  try {
    // Call the atomic RPC function
    const { data, error } = await admin.rpc("expire_dopings_atomic");
    const result = data as unknown as ExpireDopingsResult | null;

    if (error) {
      logger.system.error("Atomic doping expiry failed", error);
      return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Atomic doping expiry failed.", 500);
    }

    if (!result?.success) {
      logger.system.error("Doping expiry logic failed", result?.error);
      return apiError(API_ERROR_CODES.INTERNAL_ERROR, result?.error || "Expiry failed.", 500);
    }

    logger.system.info("Doping expiry cron completed via RPC", result as Record<string, unknown>);

    return apiSuccess(result, "Doping expiry completed.");
  } catch (error) {
    logger.system.error("Doping expiry cron failed", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Doping expiry failed.", 500);
  }
}
