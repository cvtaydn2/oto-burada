/**
 * Fulfillment Worker Service
 * 
 * Processes background jobs for payment fulfillments:
 * - Credit additions
 * - Doping applications
 * - Notification sending
 * 
 * Features:
 * - Idempotent job processing
 * - Exponential backoff retry
 * - Dead letter queue for failed jobs
 * - Concurrent processing with SKIP LOCKED
 * 
 * Usage:
 * - Called by cron endpoint: /api/cron/process-fulfillments
 * - Runs once daily at 04:00 UTC (Hobby plan limit)
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { logger } from "@/lib/utils/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { createDatabaseNotification } from "@/services/notifications/notification-records";

export interface FulfillmentJob {
  id: string;
  payment_id: string;
  job_type: 'credit_add' | 'doping_apply' | 'notification_send';
  attempts: number;
  max_attempts: number;
  metadata: Record<string, unknown>;
  payment_data: {
    user_id: string;
    amount: number;
    listing_id: string | null;
    metadata: Record<string, unknown> | null;
  };
}

export interface FulfillmentResult {
  processed: number;
  succeeded: number;
  failed: number;
  dead_letter: number;
  errors: Array<{ job_id: string; error: string }>;
}

/**
 * Process a batch of ready fulfillment jobs.
 * 
 * @param limit Maximum number of jobs to process in this batch
 * @returns Processing result summary
 */
export async function processFulfillmentJobs(limit = 10): Promise<FulfillmentResult> {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase admin environment not configured");
  }

  const admin = createSupabaseAdminClient();
  const result: FulfillmentResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    dead_letter: 0,
    errors: [],
  };

  try {
    // 1. Get ready jobs (SKIP LOCKED prevents concurrent processing)
    const { data: jobs, error: fetchError } = await admin.rpc("get_ready_fulfillment_jobs", {
      p_limit: limit,
    });

    if (fetchError) {
      logger.payments.error("Failed to fetch fulfillment jobs", fetchError);
      throw fetchError;
    }

    if (!jobs || jobs.length === 0) {
      logger.payments.debug("No fulfillment jobs ready for processing");
      return result;
    }

    logger.payments.info(`Processing ${jobs.length} fulfillment jobs`);

    // 2. Process each job
    for (const job of jobs as FulfillmentJob[]) {
      result.processed++;

      try {
        // Mark as processing
        const { error: markError } = await admin.rpc("mark_job_processing", {
          p_job_id: job.id,
        });

        if (markError) {
          logger.payments.error("Failed to mark job as processing", markError, { jobId: job.id });
          continue;
        }

        // Execute job based on type
        await executeFulfillmentJob(job);

        // Mark as success
        const { error: successError } = await admin.rpc("mark_job_success", {
          p_job_id: job.id,
        });

        if (successError) {
          logger.payments.error("Failed to mark job as success", successError, { jobId: job.id });
        } else {
          result.succeeded++;
          logger.payments.info("Fulfillment job succeeded", { jobId: job.id, type: job.job_type });
          
          captureServerEvent("fulfillment_job_success", {
            jobId: job.id,
            jobType: job.job_type,
            attempts: job.attempts + 1,
          });
        }

      } catch (error) {
        // Mark as failed (with retry or dead letter)
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails = {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        };

        const { data: failResult, error: failError } = await admin.rpc("mark_job_failed", {
          p_job_id: job.id,
          p_error_message: errorMessage,
          p_error_details: errorDetails,
        });

        if (failError) {
          logger.payments.error("Failed to mark job as failed", failError, { jobId: job.id });
        } else {
          const status = (failResult as { status?: string })?.status;
          
          if (status === 'dead_letter') {
            result.dead_letter++;
            logger.payments.error("Fulfillment job moved to dead letter queue", error, {
              jobId: job.id,
              type: job.job_type,
              attempts: job.attempts + 1,
            });
            
            captureServerError("Fulfillment job dead letter", "payments", error, {
              jobId: job.id,
              jobType: job.job_type,
              attempts: job.attempts + 1,
            });
          } else {
            result.failed++;
            logger.payments.warn("Fulfillment job failed, will retry", {
              jobId: job.id,
              type: job.job_type,
              attempts: job.attempts + 1,
              nextRetry: (failResult as { next_retry?: string })?.next_retry,
            });
            
            captureServerEvent("fulfillment_job_retry", {
              jobId: job.id,
              jobType: job.job_type,
              attempts: job.attempts + 1,
            });
          }
        }

        result.errors.push({
          job_id: job.id,
          error: errorMessage,
        });
      }
    }

    logger.payments.info("Fulfillment batch completed", {
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      dead_letter: result.dead_letter,
      error_count: result.errors.length,
    });
    return result;

  } catch (error) {
    logger.payments.error("Fulfillment worker error", error);
    captureServerError("Fulfillment worker error", "payments", error);
    throw error;
  }
}

/**
 * Execute a single fulfillment job based on its type.
 */
async function executeFulfillmentJob(job: FulfillmentJob): Promise<void> {
  const admin = createSupabaseAdminClient();

  switch (job.job_type) {
    case 'credit_add': {
      // Add credits to user balance
      const credits = job.payment_data.metadata?.credits as number | undefined;
      
      if (!credits || credits <= 0) {
        throw new Error(`Invalid credits amount: ${credits}`);
      }

      const { error } = await admin.rpc("increment_user_credits", {
        p_user_id: job.payment_data.user_id,
        p_credits: credits,
      });

      if (error) {
        throw new Error(`Failed to add credits: ${error.message}`);
      }

      logger.payments.info("Credits added successfully", {
        userId: job.payment_data.user_id,
        credits,
        paymentId: job.payment_id,
      });

      break;
    }

    case 'doping_apply': {
      // Apply doping to listing
      const listingId = job.payment_data.listing_id;
      const dopingTypes = job.payment_data.metadata?.dopingTypes as string[] | undefined;
      const durationDays = (job.payment_data.metadata?.durationDays as number | undefined) ?? 7;

      if (!listingId) {
        throw new Error("Missing listing_id for doping application");
      }

      if (!dopingTypes || dopingTypes.length === 0) {
        throw new Error("Missing doping_types for doping application");
      }

      const { data, error } = await admin.rpc("apply_listing_doping", {
        p_listing_id: listingId,
        p_user_id: job.payment_data.user_id,
        p_doping_types: dopingTypes,
        p_duration_days: durationDays,
        p_payment_id: job.payment_id,
      });

      if (error) {
        throw new Error(`Failed to apply doping: ${error.message}`);
      }

      const appliedCount = (data as { applied_count?: number })?.applied_count ?? 0;

      logger.payments.info("Doping applied successfully", {
        userId: job.payment_data.user_id,
        listingId,
        dopingTypes,
        appliedCount,
        paymentId: job.payment_id,
      });

      break;
    }

    case 'notification_send': {
      // Send notification to user
      const notificationData = job.metadata.notification as {
        title: string;
        message: string;
        href?: string;
        type: 'system' | 'favorite' | 'moderation' | 'report';
      } | undefined;

      if (!notificationData) {
        throw new Error("Missing notification data");
      }

      const notification = await createDatabaseNotification({
        userId: job.payment_data.user_id,
        type: notificationData.type ?? 'system',
        title: notificationData.title,
        message: notificationData.message,
        href: notificationData.href ?? null,
      });

      if (!notification) {
        throw new Error("Failed to create notification");
      }

      logger.payments.info("Notification sent successfully", {
        userId: job.payment_data.user_id,
        notificationId: notification.id,
        paymentId: job.payment_id,
      });

      break;
    }

    default:
      throw new Error(`Unknown job type: ${job.job_type}`);
  }
}

/**
 * Get dead letter jobs for admin monitoring.
 */
export async function getDeadLetterJobs(limit = 50) {
  if (!hasSupabaseAdminEnv()) {
    return [];
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("get_dead_letter_jobs", {
    p_limit: limit,
  });

  if (error) {
    logger.payments.error("Failed to fetch dead letter jobs", error);
    return [];
  }

  return data ?? [];
}

/**
 * Retry a dead letter job (admin action).
 */
export async function retryDeadLetterJob(jobId: string): Promise<boolean> {
  if (!hasSupabaseAdminEnv()) {
    return false;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("retry_dead_letter_job", {
    p_job_id: jobId,
  });

  if (error) {
    logger.payments.error("Failed to retry dead letter job", error, { jobId });
    return false;
  }

  logger.payments.info("Dead letter job retried", { jobId });
  captureServerEvent("dead_letter_job_retried", { jobId });

  return data === true;
}

