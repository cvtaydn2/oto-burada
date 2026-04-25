import { NextResponse } from "next/server";

import { withCronOrAdmin } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * ── PILL: Issue 9 - Batch View Sync Cron ──────────────────────────────────
 * Periodically flushes buffered listing views to the main 'listings' table.
 * Prevents table bloating and improves disk I/O performance.
 */
export async function GET(request: Request) {
  const security = await withCronOrAdmin(request);
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
