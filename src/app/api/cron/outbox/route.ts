import { logger } from "@/features/shared/lib/logger";
import { apiSuccess } from "@/features/shared/lib/response";
import { withCronRoute } from "@/features/shared/lib/security";
import { processCompensatingActions } from "@/features/shared/services/compensating-processor";
import { processComplianceVacuum } from "@/features/shared/services/compliance-vacuum";
import { processOutboxQueue } from "@/features/shared/services/outbox-processor";
import { processReconciliation } from "@/features/shared/services/reconciliation-worker";

/**
 * Triggered by Vercel Cron to process the transaction outbox.
 * Frequency: Every minute in production.
 *
 * Uses Promise.allSettled to ensure all workers complete even if one fails.
 * Individual failures are logged but don't stop other workers from executing.
 */
export async function GET(request: Request) {
  const security = await withCronRoute(request);
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
