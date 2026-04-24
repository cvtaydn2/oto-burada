import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { withCronOrAdmin } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";
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

    // 3. Expire Listings (with OCC safety)
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const { data: toExpire } = await admin
      .from("listings")
      .select("id, version")
      .eq("status", "approved")
      .lt("published_at", cutoff);

    let archivedCount = 0;
    if (toExpire) {
      for (const listing of toExpire) {
        // Stop if we are close to 10s limit
        if (Date.now() - startTime > 8000) break;

        const { error } = await admin
          .from("listings")
          .update({
            status: "archived",
            version: (listing.version || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", listing.id)
          .eq("version", listing.version || 0);

        if (!error) archivedCount++;
      }
    }
    results.expireListings = { processed: archivedCount };

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
      } catch (_error) {
        results.notificationsTriggered = false;
      }
    }

    const duration = Date.now() - startTime;
    return NextResponse.json({ success: true, duration: `${duration}ms`, results });
  } catch (error) {
    logger.system.error("Master cron failed", error);
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}
