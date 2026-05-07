/**
 * F05: Listing Auto-Archive Cron
 * Expires listings where published_at < 60 days ago
 * Run via Vercel Cron: vercel.json -> /api/cron/expire-listings
 *
 * NOTE: Uses published_at (migration 0007) - NOT expires_at
 * pg_cron also manages this in migration 0007
 */
import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/features/shared/lib/admin";
import { hasSupabaseAdminEnv } from "@/features/shared/lib/env";
import { logger } from "@/features/shared/lib/logger";
import { withCronRoute } from "@/features/shared/lib/security";

export const runtime = "nodejs";

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

export async function expireListings(admin: ReturnType<typeof createSupabaseAdminClient>) {
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

  // OCC-safe batch update with concurrency control
  const CONCURRENCY_LIMIT = 10;
  const now = new Date().toISOString();
  let archived = 0;
  let conflicts = 0;

  for (let i = 0; i < expiredListings.length; i += CONCURRENCY_LIMIT) {
    const batch = expiredListings.slice(i, i + CONCURRENCY_LIMIT);

    const results = await Promise.allSettled(
      batch.map(async (listing) => {
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
          throw { id: listing.id, error: updateError };
        }
        return listing.id;
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        archived++;
      } else {
        conflicts++;
        const err = result.reason as { id: string; error: { message: string } };
        logger.db.warn("OCC conflict skipping listing", { id: err.id, error: err.error.message });
      }
    }
  }

  logger.listings.info(`Archived ${archived} listings, ${conflicts} conflicts`);

  return { processed: archived, errors: conflicts };
}

export async function GET(request: Request) {
  const security = await withCronRoute(request);
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
