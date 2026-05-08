import { NextResponse } from "next/server";

import { applyDopingPackage } from "@/features/payments/services/doping-logic";
import { createSupabaseAdminClient } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { withCronRoute } from "@/lib/security";

type FulfillmentJobPaymentData = {
  amount?: number;
  listing_id?: string;
  user_id?: string;
};

/**
 * ── PILL: Issue 1 - Fulfillment Job Processor (DLQ & Retries) ──────
 * Orchestrates background retries for critical financial operations.
 * Uses Exponential Backoff to handle transient database or API failures.
 */
export async function GET(request: Request) {
  const security = await withCronRoute(request);
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

    // Pre-fetch data for credit_add jobs to avoid N+1 query problem
    const creditAddJobs = jobs.filter((job) => job.job_type === "credit_add");
    const paymentIds = Array.from(
      new Set(creditAddJobs.map((job) => job.payment_id).filter(Boolean))
    );

    const paymentsMap = new Map<string, { plan_id: string | null; user_id: string }>();
    const plansMap = new Map<string, { credits: number }>();

    if (paymentIds.length > 0) {
      const { data: payments } = await admin
        .from("payments")
        .select("id, plan_id, user_id")
        .in("id", paymentIds);

      if (payments) {
        payments.forEach((p) => {
          paymentsMap.set(p.id, { plan_id: p.plan_id, user_id: p.user_id });
        });

        const planIds = Array.from(
          new Set(payments.map((p) => p.plan_id).filter(Boolean))
        ) as string[];

        if (planIds.length > 0) {
          const { data: plans } = await admin
            .from("pricing_plans")
            .select("id, credits")
            .in("id", planIds);

          if (plans) {
            plans.forEach((p) => {
              plansMap.set(p.id, { credits: p.credits });
            });
          }
        }
      }
    }

    const results = { success: 0, failed: 0 };

    for (const job of jobs) {
      try {
        // 2. Mark as processing
        await admin.rpc("mark_job_processing", { p_job_id: job.id });

        // 3. Logic based on job type
        if (job.job_type === "credit_add") {
          // B14 FIX: Get credits from pricing_plan instead of using payment amount directly
          const payment = paymentsMap.get(job.payment_id);

          let credits = 0;
          if (payment?.plan_id) {
            const plan = plansMap.get(payment.plan_id);
            credits = plan?.credits ?? 0;
          }

          // Fallback: use payment_data.amount if plan not found
          if (!credits) {
            const paymentData = (job.payment_data as FulfillmentJobPaymentData | null) ?? {};
            credits =
              typeof paymentData.amount === "number"
                ? paymentData.amount
                : parseInt(String(paymentData.amount), 10) || 0;
          }

          if (!credits) {
            throw new Error(`No credits found for payment ${job.payment_id}`);
          }

          // RPC for atomic credit add
          const paymentData = (job.payment_data as FulfillmentJobPaymentData | null) ?? {};
          const { error: creditError } = await admin.rpc("adjust_user_credits_atomic", {
            p_user_id: paymentData.user_id || "",
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

          const paymentData = (job.payment_data as FulfillmentJobPaymentData | null) ?? {};
          const userId = metadata.user_id ?? paymentData.user_id;
          const listingId = metadata.listing_id ?? paymentData.listing_id;
          const packageId = metadata.package_id;

          if (!userId || !listingId || !packageId) {
            throw new Error("Doping fulfillment job metadata is incomplete");
          }

          await applyDopingPackage({
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
