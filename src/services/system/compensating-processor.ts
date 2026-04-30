import { iyzicoBreaker } from "@/lib/api/resilience";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getIyzicoClient } from "@/services/payments/iyzico-client";

/**
 * World-Class Reliability: Compensating Actions (Issue 9)
 * Gerekirse günlerce denenecek, asla kaybolmaması gereken telafi işlemleri (örn. İade).
 *
 * ── SECURITY FIX: Issue COMP-01 - Use Admin Client for Cron Context ──────────
 * Compensating actions run in cron/system context without user session.
 * Must use admin client to bypass RLS, matching outbox-processor pattern.
 */

export async function processCompensatingActions() {
  const supabase = createSupabaseAdminClient();

  const { data: actions, error } = await supabase
    .from("compensating_actions")
    .select("*")
    .eq("status", "pending")
    .lte("next_attempt_at", new Date().toISOString())
    .limit(20);

  if (error || !actions) return;

  for (const action of actions) {
    try {
      await supabase
        .from("compensating_actions")
        .update({ status: "processing" })
        .eq("id", action.id);

      switch (action.action_type) {
        case "refund":
          await handleRefundAction(action.payload);
          break;
        case "revert_credits":
          // User credit rollback logic
          break;
        default:
          throw new Error(`Unknown action_type: ${action.action_type}`);
      }

      await supabase
        .from("compensating_actions")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", action.id);
    } catch (err) {
      const retryCount = action.retry_count + 1;
      const status = retryCount >= action.max_retries ? "manual_intervention_required" : "pending";

      // Exponential backoff: 2^retry * 5 minutes
      const nextAttemptMinutes = Math.pow(2, retryCount) * 5;
      const nextAttemptDate = new Date(Date.now() + nextAttemptMinutes * 60000);

      await supabase
        .from("compensating_actions")
        .update({
          status,
          retry_count: retryCount,
          last_error: (err as Error).message,
          next_attempt_at: nextAttemptDate.toISOString(),
        })
        .eq("id", action.id);

      logger.system.error(`Compensating Action FAILED: ${action.id}. Retry: ${retryCount}`, err);
    }
  }
}

async function handleRefundAction(payload: Record<string, unknown>) {
  return await iyzicoBreaker.execute(async () => {
    const iyzico = getIyzicoClient();
    const paymentId = payload.paymentId as string;
    const conversationId = payload.conversationId as string;
    const price = payload.price as number;

    if (!paymentId || !conversationId || !price) {
      throw new Error("Invalid refund payload: missing required fields");
    }

    const refundRequest = {
      locale: "tr",
      conversationId,
      paymentId,
      price: (price / 100).toFixed(2), // Convert from kurus to lira
      currency: "TRY",
      reason: (payload.reason as string) || "other",
    };

    return new Promise<boolean>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      iyzico.payment.refund.create(refundRequest, (err: any, result: any) => {
        if (err || result.status !== "success") {
          logger.payments.error("Refund API call failed", { err, result });
          reject(new Error(result?.errorMessage || err?.message || "Refund failed"));
          return;
        }
        logger.payments.info("Refund processed successfully via Compensating Action.", {
          paymentId,
          conversationId,
          refundId: result?.refundId,
        });
        resolve(true);
      });
    });
  });
}

/**
 * Enqueues a compensating action during a failure in a Saga
 */
export async function enqueueCompensatingAction(
  supabaseClient: unknown,
  type: "refund" | "revert_credits",
  transactionId: string,
  payload: Record<string, unknown>
) {
  const admin = createSupabaseAdminClient();
  await admin.from("compensating_actions").insert({
    transaction_id: transactionId,
    action_type: type,
    payload,
  });
}
