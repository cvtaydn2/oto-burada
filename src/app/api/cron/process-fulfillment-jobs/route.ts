import { NextResponse } from "next/server";

import { withCronOrAdmin } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DopingService } from "@/services/payment/doping-service";

/**
 * ── PILL: Issue 1 - Fulfillment Job Processor (DLQ & Retries) ──────
 * Orchestrates background retries for critical financial operations.
 * Uses Exponential Backoff to handle transient database or API failures.
 */
export async function GET(request: Request) {
  const security = await withCronOrAdmin(request);
  if (!security.ok) return security.response;

  const admin = createSupabaseAdminClient();

  try {
    // 1. Fetch ready jobs (skip locked is handled by SQL function)
    const { data: jobs, error: fetchError } = await admin.rpc("get_ready_fulfillment_jobs", {
      p_limit: 10,
    });

    if (fetchError || !jobs) {
      return NextResponse.json({ error: fetchError?.message }, { status: 500 });
    }

    const results = { success: 0, failed: 0 };

    for (const job of jobs) {
      try {
        // 2. Mark as processing
        await admin.rpc("mark_job_processing", { p_job_id: job.id });

        // 3. Logic based on job type
        if (job.job_type === "credit_add") {
          // B14 FIX: Get credits from pricing_plan instead of using payment amount directly
          const { data: payment } = await admin
            .from("payments")
            .select("plan_id, user_id")
            .eq("id", job.payment_id)
            .single();

          let credits = 0;
          if (payment?.plan_id) {
            const { data: plan } = await admin
              .from("pricing_plans")
              .select("credits")
              .eq("id", payment.plan_id)
              .single();
            credits = plan?.credits ?? 0;
          }

          // Fallback: use payment_data.amount if plan not found
          if (!credits) {
            credits =
              typeof job.payment_data.amount === "number"
                ? job.payment_data.amount
                : parseInt(String(job.payment_data.amount), 10) || 0;
          }

          if (!credits) {
            throw new Error(`No credits found for payment ${job.payment_id}`);
          }

          // RPC for atomic credit add
          const { error: creditError } = await admin.rpc("adjust_user_credits_atomic", {
            p_user_id: job.payment_data.user_id,
            p_amount: credits,
            p_type: "purchase",
            p_description: "Ödeme sonrası kredi yükleme",
            p_reference_id: `Payment:${job.payment_id}`,
          });
          if (creditError) throw creditError;
        } else if (job.job_type === "doping_apply") {
          const metadata = job.metadata as {
            listing_id?: string;
            package_id?: string;
            user_id?: string;
          };

          const userId = metadata.user_id ?? job.payment_data.user_id;
          const listingId = metadata.listing_id ?? job.payment_data.listing_id;
          const packageId = metadata.package_id;

          if (!userId || !listingId || !packageId) {
            throw new Error("Doping fulfillment job metadata is incomplete");
          }

          await DopingService.applyDoping({
            userId,
            listingId,
            packageId,
            paymentId: job.payment_id,
          });
        }

        // 4. Mark success
        await admin.rpc("mark_job_success", { p_job_id: job.id });
        results.success++;
      } catch (err: unknown) {
        const error = err as Error;
        logger.system.error("Fulfillment job failed", error, { jobId: job.id });

        // 5. Mark failure (SQL function handles backoff/DLQ logic)
        await admin.rpc("mark_job_failed", {
          p_job_id: job.id,
          p_error_message: error.message || "Unknown error",
          p_error_details: { stack: error.stack },
        });

        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.system.error("Fulfillment processor fatal error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
