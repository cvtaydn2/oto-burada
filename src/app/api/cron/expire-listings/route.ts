/**
 * F05: Listing Auto-Archive Cron
 * Expires listings where expires_at < now
 * Run via Vercel Cron: vercel.json -> /api/cron/expire-listings
 */
import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { withCronOrAdmin } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

async function expireListings(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const now = new Date().toISOString();

  const { data: expiredListings, error: fetchError } = await admin
    .from("listings")
    .select("id, seller_id, status")
    .is("expires_at", false)
    .lt("expires_at", now)
    .eq("status", "approved");

  if (fetchError) {
    logger.db.error("Failed to fetch expiring listings", fetchError);
    return { processed: 0, errors: 1 };
  }

  if (!expiredListings || expiredListings.length === 0) {
    return { processed: 0, errors: 0 };
  }

  const listingIds = expiredListings.map((l) => l.id);
  const { error: updateError } = await admin
    .from("listings")
    .update({ status: "archived", updated_at: now })
    .in("id", listingIds)
    .eq("status", "approved");

  if (updateError) {
    logger.db.error("Failed to archive expired listings", updateError);
    return { processed: 0, errors: 1 };
  }

  logger.listings.info(`Archived ${listingIds.length} expired listings`);

  return { processed: listingIds.length, errors: 0 };
}

export async function GET(request: Request) {
  const security = await withCronOrAdmin(request);
  if (!security.ok) return security.response;

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const result = await expireListings(admin);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.system.error("Listing expiry cron failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
