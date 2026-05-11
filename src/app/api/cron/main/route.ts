import { NextResponse } from "next/server";

import { applyDopingPackage, warnExpiringDopings } from "@/features/payments/services/doping-logic";
import { expireReservations } from "@/features/reservations/services/reservation-service";
import { processCompensatingActions } from "@/features/shared/services/compensating-processor";
import { processComplianceVacuum } from "@/features/shared/services/compliance-vacuum";
import { processOutboxQueue } from "@/features/shared/services/outbox-processor";
import { processReconciliation } from "@/features/shared/services/reconciliation-worker";
import { triggerSavedSearchNotifications } from "@/features/shared/services/saved-search-notifier";
import { createSupabaseAdminClient } from "@/lib/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { withCronOrAdmin } from "@/lib/security";

import { expireListings } from "../expire-listings/route";

type FulfillmentJobPaymentData = {
  amount?: number;
  listing_id?: string;
  user_id?: string;
};

/**
 * MASTER CRON HANDLER for Vercel Hobby (Free) Plan.
 * Schedule: Daily at midnight (0 0 * * *)
 * Execution limit: 10 seconds (Vercel Hobby plan limit)
 *
 * ── VERCEL HOBBY PLAN LIMITATION ─────────────────────────────────────────────
 * Hobby plan allows only 1 cron job with 1/day frequency.
 * All critical periodic tasks are consolidated into this single endpoint.
 * Less-critical jobs (outbox, fulfillment) run daily instead of every minute.
 * For near-real-time background jobs, upgrade to Pro plan or use external worker.
 *
 * ── TASKS EXECUTED BY THIS CRON (in priority order) ──────────────────────────
 * 1. Expire Dopings (atomic RPC) - critical for billing accuracy
 * 2. Expire Reservations - critical for inventory management
 * 3. Expire Listings (60+ days old, batch update) - database hygiene
 * 4. Cleanup Stale Payments (24+ hours old) - financial integrity
 * 5. Process Outbox Queue (email notifications) - may be delayed up to 24h on Hobby
 * 6. Process Fulfillment Jobs (payment retries, doping activation) - may be delayed
 * 7. Process Compliance & Reconciliation - system integrity checks
 * 8. Trigger Saved Search Notifications (if time budget allows)
 *
 * ── MANUAL TRIGGER (for less-critical jobs when needed) ──────────────────────
 * curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/outbox
 * curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/process-fulfillment-jobs
 * curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/sync-listing-views
 *
 * ── UNUSED CRON ENDPOINTS (kept for future scaling, not scheduled) ───────────
 * - /api/cron/cleanup-stale-payments (consolidated into this master cron)
 * - /api/cron/cleanup-storage (manual trigger only)
 * - /api/cron/expire-dopings (consolidated into this master cron)
 * - /api/cron/expire-listings (consolidated into this master cron)
 * - /api/cron/expire-reservations (consolidated into this master cron)
 */
export async function GET(request: Request) {
  const security = await withCronOrAdmin(request);
  if (!security.ok) return security.response;

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const admin = createSupabaseAdminClient();
  const startTime = Date.now();
  const results: Record<string, unknown> = {};

  try {
    // 1. Expire Dopings (Atomic RPC)
    const { data: dopingData } = await admin.rpc("expire_dopings_atomic");
    results.expireDopings = dopingData;

    // 1b. Send Doping Expiration Warnings
    try {
      const warningResult = await warnExpiringDopings();
      results.warnDopings = warningResult;
    } catch (warnError) {
      logger.system.error("Failed to run doping warnings", warnError);
    }

    // 2. Expire Reservations
    results.expireReservations = await expireReservations();

    // 3. Expire Listings (30+ days old, uses OCC-safe approach)
    try {
      const expireResult = await expireListings(admin);
      results.expireListings = expireResult;
    } catch (expireError) {
      const errorMessage = expireError instanceof Error ? expireError.message : String(expireError);
      logger.api.error("Failed to expire listings", { error: errorMessage });
      results.expireListings = { processed: 0, error: errorMessage };
    }

    // 4. Cleanup Stale Payments
    const { data: stale } = await admin
      .from("payments")
      .update({ status: "failure" })
      .eq("status", "pending")
      .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .select("id");
    results.cleanupPayments = { count: stale?.length || 0 };

    // 5. Process Outbox Queue (email notifications, compliance, reconciliation)
    // HOBBY PLAN: Runs daily instead of every minute. Emails may be delayed up to 24h.
    if (Date.now() - startTime < 6000) {
      try {
        await Promise.all([
          processOutboxQueue(),
          processCompensatingActions(),
          processComplianceVacuum(),
          processReconciliation(),
        ]);
        results.outboxProcessing = "success";
      } catch (e) {
        logger.system.error("Outbox processing failed in master cron", e);
        results.outboxProcessing = "failed";
      }
    }

    // 6. Process Fulfillment Jobs (payment retries, doping activation)
    // HOBBY PLAN: Runs daily instead of every minute. Payment retries may be delayed.
    if (Date.now() - startTime < 7000) {
      try {
        const { data: jobs, error: fetchError } = await admin.rpc("get_ready_fulfillment_jobs", {
          p_limit: 5, // Conservative limit for daily run
        });

        if (!fetchError && jobs) {
          let successCount = 0;
          let failCount = 0;

          const jobsToProcess = jobs.slice(0, 5);

          // ⚡ perf: Bulk mark all jobs as processing in a single RPC call (fixes N+1 query)
          if (jobsToProcess.length > 0) {
            const jobIds = jobsToProcess.map((j: { id: string }) => j.id);
            await admin.rpc("mark_jobs_processing", { p_job_ids: jobIds });
          }

          for (const job of jobsToProcess) {
            try {
              // mark_jobs_processing handled in bulk above

              if (job.job_type === "doping_apply") {
                const metadata = job.metadata as {
                  listing_id?: string;
                  package_id?: string;
                  user_id?: string;
                };
                const paymentData = (job.payment_data as FulfillmentJobPaymentData | null) ?? {};
                const userId = metadata.user_id ?? paymentData.user_id;
                const listingId = metadata.listing_id ?? paymentData.listing_id;
                const packageId = metadata.package_id;

                if (userId && listingId && packageId) {
                  await applyDopingPackage({
                    userId,
                    listingId,
                    packageId,
                    paymentId: job.payment_id,
                  });
                  await admin.rpc("mark_job_success", { p_job_id: job.id });
                  successCount++;
                } else {
                  throw new Error("Incomplete metadata");
                }
              } else if (job.job_type === "credit_add") {
                // Simplified credit add for daily run
                const paymentData = (job.payment_data as FulfillmentJobPaymentData | null) ?? {};
                const { error: creditError } = await admin.rpc("adjust_user_credits_atomic", {
                  p_user_id: paymentData.user_id || "",
                  p_amount: paymentData.amount || 0,
                  p_type: "purchase",
                  p_description: "Ödeme sonrası kredi yükleme (daily cron)",
                  p_reference_id: `Payment:${job.payment_id}`,
                });
                if (!creditError) {
                  await admin.rpc("mark_job_success", { p_job_id: job.id });
                  successCount++;
                } else {
                  throw creditError;
                }
              }
            } catch (err) {
              const error = err as Error;
              await admin.rpc("mark_job_failed", {
                p_job_id: job.id,
                p_error_message: error.message || "Unknown error",
              });
              failCount++;
            }
          }

          results.fulfillmentJobs = { success: successCount, failed: failCount };
        }
      } catch (e) {
        logger.system.error("Fulfillment processing failed in master cron", e);
        results.fulfillmentJobs = "failed";
      }
    }

    // 7. Trigger Saved Search Notifications (via shared server function)
    // We do this at the end because it's the most time-consuming
    // ── SECURITY FIX: Issue SEC-CRON-01 - No HTTP Fetch with Cron Secret ──
    // Use shared server function instead of internal HTTP fetch to avoid
    // passing CRON_SECRET in headers (which could be logged).
    if (Date.now() - startTime < 8000) {
      try {
        const result = await triggerSavedSearchNotifications();
        results.notificationsTriggered = result.success;
        if (result.error) {
          logger.api.warn("Saved search notifications partially failed", { error: result.error });
        }
      } catch (e) {
        logger.api.error("Saved search notification trigger failed", e);
        results.notificationsTriggered = false;
      }
    }

    const duration = Date.now() - startTime;
    return NextResponse.json({ success: true, duration: `${duration}ms`, results });
  } catch {
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}
