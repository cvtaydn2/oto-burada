import { NextResponse } from "next/server";

import { withCronOrAdmin } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { expireReservations } from "@/services/reservations/reservation-service";
import { triggerSavedSearchNotifications } from "@/services/system/saved-search-notifier";

/**
 * MASTER CRON HANDLER for Vercel Hobby (Free) Plan.
 * Rule: Hobby plan allows max 1 cron job with 1 day frequency.
 * Execution limit: 10 seconds.
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

    // 2. Expire Reservations
    results.expireReservations = await expireReservations();

    // 3. Expire Listings (BATCH UPDATE - Fixed N+1 performance issue)
    // OLD: Iterated through listings one-by-one with individual UPDATE queries
    // NEW: Single batch UPDATE with optimistic concurrency control
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expireResult, error: expireError } = await admin
      .from("listings")
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "approved")
      .lt("published_at", cutoff)
      .select("id");

    if (expireError) {
      logger.api.error("Failed to expire listings", { error: expireError.message });
      results.expireListings = { processed: 0, error: expireError.message };
    } else {
      results.expireListings = { processed: expireResult?.length || 0 };
    }

    // 4. Cleanup Stale Payments
    const { data: stale } = await admin
      .from("payments")
      .update({ status: "failure" })
      .eq("status", "pending")
      .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .select("id");
    results.cleanupPayments = { count: stale?.length || 0 };

    // 5. Trigger Saved Search Notifications (via shared server function)
    // We do this at the end because it's the most time-consuming
    // ── SECURITY FIX: Issue SEC-CRON-01 - No HTTP Fetch with Cron Secret ──
    // Use shared server function instead of internal HTTP fetch to avoid
    // passing CRON_SECRET in headers (which could be logged).
    if (Date.now() - startTime < 7000) {
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
