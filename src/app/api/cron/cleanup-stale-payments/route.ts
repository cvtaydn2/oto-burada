import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/features/shared/lib/admin";
import { logger } from "@/features/shared/lib/logger";
import { withCronRoute } from "@/features/shared/lib/security";

const STALE_PAYMENT_HOURS = 24;

export async function GET(request: Request) {
  const security = await withCronRoute(request);
  if (!security.ok) return security.response;

  const admin = createSupabaseAdminClient();
  const staleBefore = new Date(Date.now() - STALE_PAYMENT_HOURS * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await admin
      .from("payments")
      .update({
        status: "failure",
        processed_at: new Date().toISOString(),
        metadata: {
          cleanup_reason: "stale_pending_payment",
          stale_after_hours: STALE_PAYMENT_HOURS,
        },
      })
      .in("status", ["pending", "processing"])
      .lt("created_at", staleBefore)
      .is("fulfilled_at", null)
      .select("id");

    if (error) {
      logger.payments.error("Failed to cleanup stale payments", error, { staleBefore });
      return NextResponse.json({ error: "cleanup_failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      cleanedCount: data?.length ?? 0,
      staleBefore,
    });
  } catch (error) {
    logger.payments.error("Unexpected stale payment cleanup failure", error, { staleBefore });
    return NextResponse.json({ error: "cleanup_failed" }, { status: 500 });
  }
}
