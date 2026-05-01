import { apiSuccess } from "@/lib/api/response";
import { withCronOrAdmin } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { processCompensatingActions } from "@/services/system/compensating-processor";
import { processComplianceVacuum } from "@/services/system/compliance-vacuum";
import { processOutboxQueue } from "@/services/system/outbox-processor";
import { processReconciliation } from "@/services/system/reconciliation-worker";

/**
 * Triggered by Vercel Cron to process the transaction outbox.
 * Frequency: Every minute in production.
 *
 * Uses Promise.allSettled to ensure all workers complete even if one fails.
 * Individual failures are logged but don't stop other workers from executing.
 */
export async function GET(request: Request) {
  const security = await withCronOrAdmin(request);
  if (!security.ok) return security.response;

  const results = await Promise.allSettled([
    processOutboxQueue().catch((err) => ({ ok: false, error: err })),
    processCompensatingActions().catch((err) => ({ ok: false, error: err })),
    processComplianceVacuum().catch((err) => ({ ok: false, error: err })),
    processReconciliation().catch((err) => ({ ok: false, error: err })),
  ]);

  const failures = results.filter(
    (r) =>
      r.status === "rejected" ||
      (r.status === "fulfilled" &&
        r.value &&
        typeof r.value === "object" &&
        "ok" in r.value &&
        !r.value.ok)
  );

  if (failures.length > 0) {
    const failureDetails = failures.map((f, i) => {
      if (f.status === "rejected") return `Worker ${i}: Promise rejected`;
      return `Worker ${i}: ${(f as PromiseFulfilledResult<{ ok: boolean; error?: unknown }>).value.error}`;
    });
    logger.system.error(`Cron: ${failures.length}/4 workers failed`, {
      failures: failureDetails,
    });
  }

  const successCount = results.length - failures.length;
  const message =
    failures.length > 0
      ? `Processed with ${failures.length} worker failures`
      : `All ${successCount} workers completed successfully`;

  return apiSuccess(null, message);
}
