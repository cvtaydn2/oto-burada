import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

/**
 * Record a listing view with deduplication.
 *
 * For authenticated users: one view per listing per user (unique index handles this).
 * For anonymous users: one view per listing per IP per day.
 * Silently ignores duplicate constraint violations.
 */
export async function recordListingView(
  listingId: string,
  options: { viewerId?: string; viewerIp?: string },
) {
  if (!hasSupabaseAdminEnv()) {
    return;
  }

  const admin = createSupabaseAdminClient();

  if (options.viewerId) {
    // Authenticated user: use upsert with unique constraint
    const { error } = await admin.from("listing_views").upsert(
      {
        listing_id: listingId,
        viewer_id: options.viewerId,
        viewer_ip: options.viewerIp ?? null,
      },
      { onConflict: "listing_id,viewer_id", ignoreDuplicates: true },
    );

    if (error) {
      // Silently ignore — not critical
      return;
    }
  } else if (options.viewerIp) {
    // Anonymous user: check IP + 24 hour window
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: existing } = await admin
      .from("listing_views")
      .select("id")
      .eq("listing_id", listingId)
      .eq("viewer_ip", options.viewerIp)
      .is("viewer_id", null)
      .gte("created_at", oneDayAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      return; // Already viewed within 24 hours
    }

    await admin.from("listing_views").insert({
      listing_id: listingId,
      viewer_id: null,
      viewer_ip: options.viewerIp,
    });
  }

  // Update denormalized view_count on the listing
  const { count: totalViews } = await admin
    .from("listing_views")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId);

  if (totalViews !== null) {
    await admin
      .from("listings")
      .update({ view_count: totalViews })
      .eq("id", listingId);
  }
}

/**
 * Get total view count for a listing.
 */
export async function getListingViewCount(listingId: string): Promise<number> {
  if (!hasSupabaseAdminEnv()) {
    return 0;
  }

  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("listing_views")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

/**
 * Get view counts for multiple listings at once.
 */
export async function getListingViewCounts(
  listingIds: string[],
): Promise<Record<string, number>> {
  if (!hasSupabaseAdminEnv() || listingIds.length === 0) {
    return {};
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("listings")
    .select("id, view_count")
    .in("id", listingIds);

  if (error || !data) {
    return {};
  }

  return data.reduce<Record<string, number>>((counts, row) => {
    counts[row.id as string] = (row.view_count as number) ?? 0;
    return counts;
  }, {});
}
