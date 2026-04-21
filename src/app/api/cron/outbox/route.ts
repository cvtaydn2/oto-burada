import { processOutboxQueue } from "@/services/system/outbox-processor";
import { processCompensatingActions } from "@/services/system/compensating-processor";
import { processComplianceVacuum } from "@/services/system/compliance-vacuum";
import { processReconciliation } from "@/services/system/reconciliation-worker";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";
import { withCronOrAdmin } from "@/lib/utils/api-security";

/**
 * Triggered by Vercel Cron to process the transaction outbox.
 * Frequency: Every minute in production.
 */
export async function GET(request: Request) {
  const security = await withCronOrAdmin(request);
  if (!security.ok) return security.response;

  try {
    await Promise.all([
      processOutboxQueue(),
      processCompensatingActions(),
      processComplianceVacuum(),
      processReconciliation()
    ]);
    return apiSuccess(null, "System queues, compliance, and reconciliation processed.");
  } catch (error) {
    logger.system.error("Cron: Outbox processing failed", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Outbox processing failed.");
  }
}
