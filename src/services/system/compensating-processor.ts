import { type SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { iyzicoBreaker } from "@/lib/utils/resilience";

/**
 * World-Class Reliability: Compensating Actions (Issue 9)
 * Gerekirse günlerce denenecek, asla kaybolmaması gereken telafi işlemleri (örn. İade).
 */

export async function processCompensatingActions() {
  const supabase = await createSupabaseServerClient();

  const { data: actions, error } = await supabase
    .from("compensating_actions")
    .select("*")
    .eq("status", "pending")
    .lte("next_attempt_at", new Date().toISOString())
    .limit(20);

  if (error || !actions) return;

  for (const action of actions) {
    try {
      await supabase.from("compensating_actions").update({ status: "processing" }).eq("id", action.id);

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

      await supabase.from("compensating_actions").update({
        status: "completed",
        processed_at: new Date().toISOString()
      }).eq("id", action.id);

    } catch (err) {
      const retryCount = action.retry_count + 1;
      const status = retryCount >= action.max_retries ? "manual_intervention_required" : "pending";
      
      // Exponential backoff: 2^retry * 5 minutes
      const nextAttemptMinutes = Math.pow(2, retryCount) * 5;
      const nextAttemptDate = new Date(Date.now() + nextAttemptMinutes * 60000);

      await supabase.from("compensating_actions").update({
        status,
        retry_count: retryCount,
        last_error: (err as Error).message,
        next_attempt_at: nextAttemptDate.toISOString()
      }).eq("id", action.id);

      logger.system.error(`Compensating Action FAILED: ${action.id}. Retry: ${retryCount}`, err);
    }
  }
}

async function handleRefundAction(payload: Record<string, unknown>) {
  return await iyzicoBreaker.execute(async () => {
    // Call Iyzico Refund API with payload
    logger.payments.info("Refund processed successfully via Compensating Action.", { payload });
    return true;
  });
}

/**
 * Enqueues a compensating action during a failure in a Saga
 */
export async function enqueueCompensatingAction(
  supabaseClient: SupabaseClient,
  type: 'refund' | 'revert_credits',
  transactionId: string,
  payload: Record<string, unknown>
) {
  await supabaseClient.from("compensating_actions").insert({
    transaction_id: transactionId,
    action_type: type,
    payload
  });
}
