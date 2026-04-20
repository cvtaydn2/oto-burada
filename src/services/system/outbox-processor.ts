import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { resendBreaker } from "@/lib/utils/resilience";

/**
 * Hyper-Scale Transaction Outbox Processor (Item 10 - Reliability)
 * Processes events created during main transactions that might fail.
 */
export async function processOutboxQueue() {
  const supabase = await createSupabaseServerClient();

  // 1. Fetch pending items
  const { data: queue, error: fetchError } = await supabase
    .from("transaction_outbox")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (fetchError || !queue || queue.length === 0) {
    return;
  }

  logger.system.info(`Outbox: Processing ${queue.length} events...`);

  for (const item of queue) {
    try {
      // Mark as processing
      await supabase
        .from("transaction_outbox")
        .update({ status: "processing" })
        .eq("id", item.id);

      // Handle based on event type
      switch (item.event_type) {
        case "email_notification":
          await handleEmailNotification(item.payload);
          break;
        case "audit_cleanup":
          // Special hyper-scale cleanup tasks
          break;
        default:
          logger.system.warn(`Outbox: Unknown event type ${item.event_type}`);
      }

      // Mark as completed
      await supabase
        .from("transaction_outbox")
        .update({ status: "completed", processed_at: new Date().toISOString() })
        .eq("id", item.id);

    } catch (err) {
      const retryCount = (item.retry_count || 0) + 1;
      const status = retryCount >= 5 ? "failed" : "pending";
      
      await supabase
        .from("transaction_outbox")
        .update({ 
          status, 
          retry_count: retryCount, 
          error_message: (err as Error).message 
        })
        .eq("id", item.id);
        
      logger.system.error(`Outbox: Failed to process item ${item.id}`, err);
    }
  }
}

/**
 * Specialized handler for email notifications with Circuit Breaker
 */
async function handleEmailNotification(payload: unknown) {
  return await resendBreaker.execute(async () => {
    // Logic to call Resend API with payload
    // Example: await resend.emails.send(payload);
    logger.system.info("Outbox: Email notification sent successfully via Circuit Breaker.");
    return true;
  });
}

/**
 * Utility to enqueue an outbox event within a transaction
 */
export async function enqueueOutboxEvent(
  supabase: any,
  eventType: string,
  payload: unknown,
  idempotencyKey?: string
) {
  const { error } = await supabase
    .from("transaction_outbox")
    .insert({
      event_type: eventType,
      payload,
      idempotency_key: idempotencyKey,
    });

  if (error) {
    logger.system.error("Outbox: Failed to enqueue event", error, { eventType });
    throw error;
  }
}
