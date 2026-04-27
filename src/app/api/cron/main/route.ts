import { NextResponse } from "next/server";

import { withCronOrAdmin } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { expireReservations } from "@/services/reservations/reservation-service";

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

    // 5. Trigger Saved Search Notifications (via internal request)
    // We do this at the end because it's the most time-consuming
    if (Date.now() - startTime < 7000) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        // Use the absolute URL and pass the secret
        await fetch(`${baseUrl}/api/saved-searches/notify`, {
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        });
        results.notificationsTriggered = true;
      } catch {
        results.notificationsTriggered = false;
      }
    }

    const duration = Date.now() - startTime;
    return NextResponse.json({ success: true, duration: `${duration}ms`, results });
  } catch {
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}
