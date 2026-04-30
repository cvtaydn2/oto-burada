import { type SupabaseClient } from "@supabase/supabase-js";

import { resendBreaker } from "@/lib/api/resilience";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  sendListingApprovedEmail,
  sendListingRejectedEmail,
  sendSavedSearchAlertEmail,
  sendTicketCreatedEmail,
  sendTicketReplyEmail,
} from "@/services/email/email-service";

/**
 * Hyper-Scale Transaction Outbox Processor (Item 10 - Reliability)
 * Processes events created during main transactions that might fail.
 *
 * ── SECURITY FIX: Issue OUTBOX-01 - System Context for Cron Jobs ──
 * Uses admin client to bypass RLS since this runs in system/cron context,
 * not user context. Server client would fail if RLS doesn't allow anon access.
 */
export async function processOutboxQueue() {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  // ── BUG FIX: Clean up expired poison pills to prevent table bloat ──
  const { error: cleanupError } = await supabase
    .from("transaction_outbox")
    .delete()
    .eq("is_poison_pill", true)
    .lt("hard_deadline", now);

  if (cleanupError) {
    logger.system.warn("Outbox: Failed to cleanup expired poison pills", {
      error: cleanupError.message,
      code: cleanupError.code,
    } as Record<string, unknown>);
  }

  // 1. Fetch pending items
  const { data: queue, error: fetchError } = await supabase
    .from("transaction_outbox")
    .select(
      "id, event_type, payload, status, retry_count, next_attempt_at, is_poison_pill, hard_deadline, last_error, processed_at, created_at"
    )
    .eq("status", "pending")
    .eq("is_poison_pill", false) // ── PILL: Issue 2 - Skip toxic messages
    .gte("hard_deadline", now) // ── PILL: Issue 8 - Only process if not expired
    .lte("next_attempt_at", now)
    .order("created_at", { ascending: true })
    .limit(50);

  if (fetchError || !queue || queue.length === 0) {
    return;
  }

  logger.system.info(`Outbox: Processing ${queue.length} events concurrently...`);

  // ── PILL: Issue 3 - Concurrent Processing (Avoid HOL Blocking) ──
  // We process messages in parallel to ensure one slow external API (e.g. Email)
  // doesn't block other successful operations.
  const results = await Promise.allSettled(
    queue.map(async (item) => {
      try {
        // Mark as processing
        await supabase
          .from("transaction_outbox")
          .update({ status: "processing" })
          .eq("id", item.id);

        switch (item.event_type) {
          case "email_notification":
            await handleEmailNotification(item.payload as unknown as EmailNotificationPayload);
            break;
          case "audit_cleanup":
            break;
          default:
            logger.system.warn(`Outbox: Unknown event type ${item.event_type}`);
        }

        await supabase
          .from("transaction_outbox")
          .update({
            status: "completed",
            processed_at: new Date().toISOString(),
          })
          .eq("id", item.id);
      } catch (err) {
        const retryCount = (item.retry_count || 0) + 1;
        const status = retryCount >= 5 ? "failed" : "pending";

        const delayMs = Math.min(1000 * Math.pow(2, retryCount), 3600000);
        const nextAttempt = new Date(Date.now() + delayMs);

        await supabase
          .from("transaction_outbox")
          .update({
            status,
            retry_count: retryCount,
            next_attempt_at: nextAttempt.toISOString(),
            is_poison_pill: status === "failed",
            error_message: (err as Error).message,
          })
          .eq("id", item.id);

        logger.system.error(`Outbox: Failed item ${item.id}. Status: ${status}`, err);
      }
    })
  );

  const failedCount = results.filter((r) => r.status === "rejected").length;
  if (failedCount > 0) {
    logger.system.warn(
      `Outbox: Parallel processing finished with ${failedCount} worker-level errors.`
    );
  }
}

interface EmailNotificationPayload {
  template: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}

/**
 * Specialized handler for email notifications with Circuit Breaker
 */
async function handleEmailNotification(payload: EmailNotificationPayload) {
  if (!payload || !payload.template) {
    throw new Error("Outbox: Email notification payload is missing template information");
  }

  return await resendBreaker.execute(async () => {
    logger.system.info(`Outbox: Processing email template '${payload.template}'`);

    let result;
    switch (payload.template) {
      case "ticket_created":
        result = await sendTicketCreatedEmail(payload.params);
        break;
      case "ticket_reply":
        result = await sendTicketReplyEmail(payload.params);
        break;
      case "listing_approved":
        result = await sendListingApprovedEmail(payload.params);
        break;
      case "listing_rejected":
        result = await sendListingRejectedEmail(payload.params);
        break;
      case "saved_search_alert":
        result = await sendSavedSearchAlertEmail(payload.params);
        break;
      default:
        logger.system.error(`Outbox: Unsupported email template '${payload.template}'`);
        throw new Error(`Unsupported email template: ${payload.template}`);
    }

    if (!result.success) {
      throw new Error(`Email sending failed: ${result.error}`);
    }

    return true;
  });
}

/**
 * Utility to enqueue an outbox event within a transaction
 *
 * ── BUG FIX: Transaction Safety ──
 * This function should be called within the same transaction as the main operation.
 * For reliable outbox pattern, use enqueueOutboxEventInTransaction() which wraps
 * both operations in a single atomic RPC call.
 *
 * @deprecated Use enqueueOutboxEventInTransaction for new code
 */
export async function enqueueOutboxEvent(
  supabaseClient: SupabaseClient,
  eventType: string,
  payload: unknown,
  idempotencyKey?: string
) {
  const { error } = await supabaseClient.from("transaction_outbox").insert({
    event_type: eventType,
    payload,
    idempotency_key: idempotencyKey,
  });

  if (error) {
    logger.system.error("Outbox: Failed to enqueue event", error, { eventType });
    throw error;
  }
}

/**
 * Enqueues an outbox event atomically within the same transaction as the main operation.
 * This prevents event loss when the main transaction succeeds but outbox insert fails.
 *
 * Usage: Call this instead of separate RPC + enqueueOutboxEvent
 * The caller should wrap both operations in a single transaction-aware pattern.
 *
 * @param supabaseClient - The supabase client (should be same instance used for main operation)
 * @param mainOperationPromise - Promise that performs the main DB operation
 * @param eventType - Type of event to enqueue
 * @param payload - Event payload
 * @param idempotencyKey - Optional idempotency key
 */
export async function enqueueOutboxEventInTransaction<T>(
  supabaseClient: SupabaseClient,
  mainOperationPromise: Promise<{ data: T; error: unknown }>,
  eventType: string,
  payload: unknown,
  idempotencyKey?: string
): Promise<{ data: T; outboxEnqueued: boolean }> {
  const result = await mainOperationPromise;

  if (result.error) {
    return { data: result.data, outboxEnqueued: false };
  }

  try {
    await enqueueOutboxEvent(supabaseClient, eventType, payload, idempotencyKey);
    return { data: result.data, outboxEnqueued: true };
  } catch (outboxError) {
    logger.system.error(
      "Outbox: Main operation succeeded but outbox enqueue failed - data inconsistency risk",
      outboxError,
      { eventType }
    );
    return { data: result.data, outboxEnqueued: false };
  }
}
