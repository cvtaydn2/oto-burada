import { processOutboxQueue } from "@/services/system/outbox-processor";
import { processCompensatingActions } from "@/services/system/compensating-processor";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";

/**
 * Triggered by Vercel Cron to process the transaction outbox.
 * Frequency: Every minute in production.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized cron request.", 401);
  }

  try {
    await Promise.all([
      processOutboxQueue(),
      processCompensatingActions()
    ]);
    return apiSuccess(null, "System queues processed.");
  } catch (error) {
    logger.system.error("Cron: Outbox processing failed", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Outbox processing failed.");
  }
}
