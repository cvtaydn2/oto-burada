/**
 * POST /api/cron/process-fulfillments
 * 
 * Cron endpoint for processing payment fulfillment jobs.
 * 
 * Security:
 * - Requires CRON_SECRET in Authorization header
 * - Only callable by Vercel Cron or authorized services
 * 
 * Schedule:
 * - Runs every 2 minutes (configured in vercel.json)
 * 
 * Flow:
 * 1. Verify cron secret
 * 2. Process batch of ready jobs (max 10)
 * 3. Return processing summary
 * 
 * Vercel Cron docs:
 * https://vercel.com/docs/cron-jobs
 */

import { NextResponse } from "next/server";
import { processFulfillmentJobs } from "@/services/billing/fulfillment-worker";
import { logger } from "@/lib/utils/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  // 1. Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.payments.error("CRON_SECRET not configured");
    return NextResponse.json(
      { error: "Cron not configured" },
      { status: 503 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    logger.payments.warn("Unauthorized cron request", {
      ip: request.headers.get("x-forwarded-for") ?? "unknown",
    });
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. Process fulfillment jobs
  try {
    const startTime = Date.now();
    const result = await processFulfillmentJobs(10); // Process max 10 jobs per run
    const duration = Date.now() - startTime;

    logger.payments.info("Cron fulfillment processing completed", {
      ...result,
      duration_ms: duration,
    });

    captureServerEvent("cron_fulfillment_completed", {
      ...result,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      ...result,
      duration_ms: duration,
    });

  } catch (error) {
    logger.payments.error("Cron fulfillment processing failed", error);
    captureServerError("Cron fulfillment processing failed", "payments", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: Request): Promise<NextResponse> {
  return GET(request);
}

