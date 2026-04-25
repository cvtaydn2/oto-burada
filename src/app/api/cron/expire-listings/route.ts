/**
 * F05: Listing Auto-Archive Cron
 * Expires listings where published_at < 60 days ago
 * Run via Vercel Cron: vercel.json -> /api/cron/expire-listings
 *
 * NOTE: Uses published_at (migration 0007) - NOT expires_at
 * pg_cron also manages this in migration 0007
 */
import { NextResponse } from "next/server";

import { withCronOrAdmin } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

async function expireListings(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const cutoff = new Date(Date.now() - SIXTY_DAYS_MS).toISOString();

  const { data: expiredListings, error: fetchError } = await admin
    .from("listings")
    .select("id, seller_id, status, version")
    .not("published_at", "is", null)
    .lt("published_at", cutoff)
    .eq("status", "approved");

  if (fetchError) {
    logger.db.error("Failed to fetch expiring listings", fetchError);
    return { processed: 0, errors: 1 };
  }

  if (!expiredListings || expiredListings.length === 0) {
    return { processed: 0, errors: 0 };
  }

  // B11 FIX: OCC-safe individual updates instead of bulk update
  let archived = 0;
  let conflicts = 0;
  const now = new Date().toISOString();

  for (const listing of expiredListings) {
    const { error: updateError } = await admin
      .from("listings")
      .update({
        status: "archived",
        updated_at: now,
        version: (listing.version ?? 0) + 1,
      })
      .eq("id", listing.id)
      .eq("version", listing.version ?? 0)
      .eq("status", "approved");

    if (updateError) {
      conflicts++;
      logger.db.warn("OCC conflict skipping listing", { id: listing.id, error: updateError });
    } else {
      archived++;
    }
  }

  logger.listings.info(`Archived ${archived} listings, ${conflicts} conflicts`);

  return { processed: archived, errors: conflicts };
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
