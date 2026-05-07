import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/features/shared/lib/admin";
import { logger } from "@/features/shared/lib/logger";
import { withCronRoute } from "@/features/shared/lib/security";

/**
 * ── PILL: Issue 9 - Batch View Sync Cron ──────────────────────────────────
 * Periodically flushes buffered listing views to the main 'listings' table.
 * Prevents table bloating and improves disk I/O performance.
 */
export async function GET(request: Request) {
  const security = await withCronRoute(request);
  if (!security.ok) return security.response;

  const admin = createSupabaseAdminClient();

  try {
    const { data: updatedCount, error } = await admin.rpc("sync_listing_views_buffer");

    if (error) {
      logger.system.error("Sync listing views failed", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.system.error("Sync listing views unexpected error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
