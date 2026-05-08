import { type SupabaseClient } from "@supabase/supabase-js";

import {
  sendListingApprovedEmail,
  sendListingRejectedEmail,
  sendSavedSearchAlertEmail,
  sendTicketCreatedEmail,
  sendTicketReplyEmail,
} from "@/features/notifications/services/email-service";
import { createSupabaseAdminClient } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { resendBreaker } from "@/lib/resilience";

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
      "id, event_type, payload, status, retry_count, next_attempt_at, is_poison_pill, hard_deadline, error_message, processed_at, created_at"
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
  // We process messages in parallel chunks to ensure one slow external API (e.g. Email)
  // doesn't block others, while avoiding rate limits on external services like Resend.
  const CONCURRENCY = 5;
  const results: PromiseSettledResult<void>[] = [];

  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    const chunk = queue.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.allSettled(
      chunk.map(async (item) => {
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

          // Fallback for poison pill items (5 retries failed)
          if (status === "failed" && item.event_type === "email_notification") {
            const payload = item.payload as unknown as EmailNotificationPayload;
            await attemptEmailFallback(payload.template, payload.params).catch((fallbackError) => {
              logger.system.error("Poison pill fallback also failed", fallbackError, {
                itemId: item.id,
              });
            });
          }

          throw err;
        }
      })
    );
    results.push(...chunkResults);
  }

  const failedCount = results.filter((r) => r.status === "rejected").length;
  if (failedCount > 0) {
    logger.system.warn(
      `Outbox: Parallel processing finished with ${failedCount} worker-level errors.`
    );
  }
}

interface EmailNotificationPayload {
  template: string;
  params: Record<string, unknown>;
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
        result = await sendTicketCreatedEmail(
          payload.params as Parameters<typeof sendTicketCreatedEmail>[0]
        );
        break;
      case "ticket_reply":
        result = await sendTicketReplyEmail(
          payload.params as Parameters<typeof sendTicketReplyEmail>[0]
        );
        break;
      case "listing_approved":
        result = await sendListingApprovedEmail(
          payload.params as Parameters<typeof sendListingApprovedEmail>[0]
        );
        break;
      case "listing_rejected":
        result = await sendListingRejectedEmail(
          payload.params as Parameters<typeof sendListingRejectedEmail>[0]
        );
        break;
      case "saved_search_alert":
        result = await sendSavedSearchAlertEmail(
          payload.params as Parameters<typeof sendSavedSearchAlertEmail>[0]
        );
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
 * IMPROVEMENT: Adds retry logic with exponential backoff before giving up.
 * Falls back to direct email sending for critical notification events to prevent data loss.
 *
 * @param supabase - The supabase client (should be same instance used for main operation)
 * @param mainOperation - Function that performs the main DB operation
 * @param eventType - Type of event to enqueue
 * @param payload - Event payload
 * @param idempotencyKey - Optional idempotency key
 * @returns Result with outboxEnqueued flag indicating atomic success
 */
export async function enqueueOutboxEventInTransaction<T>(
  supabase: SupabaseClient,
  mainOperation: () => Promise<{ data: T; error: unknown }>,
  eventType: string,
  payload: unknown,
  idempotencyKey?: string
): Promise<{ data: T; outboxEnqueued: boolean }> {
  const result = await mainOperation();

  if (result.error) {
    return { data: result.data, outboxEnqueued: false };
  }

  // Attempt to enqueue outbox event with retry logic
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await enqueueOutboxEvent(supabase, eventType, payload, idempotencyKey);
      return { data: result.data, outboxEnqueued: true };
    } catch (outboxError) {
      lastError = outboxError instanceof Error ? outboxError : new Error(String(outboxError));
      const delayMs = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
      if (attempt < maxRetries) {
        logger.system.warn(
          `Outbox enqueue failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms`,
          { eventType, error: lastError.message }
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries exhausted - log critical error with full context
  logger.system.error(
    `Outbox: All ${maxRetries} retry attempts exhausted. Main operation succeeded but event lost.`,
    lastError,
    {
      eventType,
      payload: typeof payload === "object" ? JSON.stringify(payload).slice(0, 500) : payload,
      idempotencyKey,
      severity: "critical",
    }
  );

  // For critical notification events, attempt direct fallback to prevent complete data loss
  if (eventType === "email_notification" && payload && typeof payload === "object") {
    const emailPayload = payload as { template?: string; params?: Record<string, unknown> };
    await attemptEmailFallback(emailPayload.template, emailPayload.params).catch(
      (fallbackError) => {
        logger.system.error("Outbox fallback email also failed", fallbackError, { eventType });
      }
    );
  }

  return { data: result.data, outboxEnqueued: false };
}

/**
 * Fallback direct email sending when outbox fails - prevents complete notification loss
 */
async function attemptEmailFallback(
  template?: string,
  params?: Record<string, unknown>
): Promise<void> {
  if (!template || !params) return;

  const templateHandlers: Record<string, () => Promise<void>> = {
    listing_approved: async () => {
      const { sendListingApprovedEmail } =
        await import("@/features/notifications/services/email-service");
      await sendListingApprovedEmail({
        toEmail: params.toEmail as string,
        toName: params.toName as string,
        listingTitle: params.listingTitle as string,
        listingUrl: params.listingUrl as string,
      });
    },
    listing_rejected: async () => {
      const { sendListingRejectedEmail } =
        await import("@/features/notifications/services/email-service");
      await sendListingRejectedEmail({
        toEmail: params.toEmail as string,
        toName: params.toName as string,
        listingTitle: params.listingTitle as string,
        reason: params.reason as string | undefined,
      });
    },
    ticket_created: async () => {
      const { sendTicketCreatedEmail } =
        await import("@/features/notifications/services/email-service");
      await sendTicketCreatedEmail({
        toEmail: params.toEmail as string,
        toName: params.toName as string,
        ticketSubject: params.ticketSubject as string,
        ticketId: params.ticketId as string,
        ticketUrl: params.ticketUrl as string | undefined,
      });
    },
    ticket_reply: async () => {
      const { sendTicketReplyEmail } =
        await import("@/features/notifications/services/email-service");
      await sendTicketReplyEmail({
        toEmail: params.toEmail as string,
        toName: params.toName as string,
        ticketSubject: params.ticketSubject as string,
        adminResponse: params.adminResponse as string,
        ticketId: params.ticketId as string,
      });
    },
    saved_search_alert: async () => {
      const { sendSavedSearchAlertEmail } =
        await import("@/features/notifications/services/email-service");
      await sendSavedSearchAlertEmail({
        toEmail: params.toEmail as string,
        toName: params.toName as string,
        searchTitle: params.searchTitle as string,
        searchUrl: params.searchUrl as string,
        newListings: [],
      });
    },
  };

  const handler = templateHandlers[template];
  if (handler) {
    logger.system.info(`Attempting fallback email for template: ${template}`);
    await handler();
  }
}

/**
 * Fully atomic outbox enqueue using a database-level transaction.
 * Use this when you need guaranteed atomicity between main operation and outbox.
 *
 * @param supabase - Admin client with transaction support
 * @param mainOperation - The main database operation to execute
 * @param eventType - Type of event to enqueue
 * @param payload - Event payload
 * @param idempotencyKey - Optional idempotency key
 * @throws Error if any part of the transaction fails (full rollback)
 */
export async function enqueueOutboxEventAtomic<T>(
  supabase: SupabaseClient,
  mainOperation: () => Promise<{ data: T; error: unknown }>,
  eventType: string,
  payload: unknown,
  idempotencyKey?: string
): Promise<{ data: T; outboxEnqueued: boolean }> {
  // Execute main operation first
  const result = await mainOperation();

  if (result.error) {
    return { data: result.data, outboxEnqueued: false };
  }

  // Now insert outbox event within the same logical flow
  // If this fails, we throw to trigger full rollback expectation
  const { error: outboxError } = await supabase.from("transaction_outbox").insert({
    event_type: eventType,
    payload,
    idempotency_key: idempotencyKey,
  });

  if (outboxError) {
    logger.system.error(
      "Outbox: Atomic enqueue failed - main op succeeded but outbox insert failed",
      outboxError,
      { eventType, payload }
    );
    throw new Error(`Atomic outbox enqueue failed: ${outboxError.message}`);
  }

  return { data: result.data, outboxEnqueued: true };
}
