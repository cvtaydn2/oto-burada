import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

/**
 * Record a listing view with deduplication.
 *
 * For authenticated users: one view per listing per user per day.
 * For anonymous users: one view per listing per IP per day.
 * Silently ignores duplicate constraint violations.
 */
export async function recordListingView(
  listingId: string,
  options: { viewerId?: string; viewerIp?: string }
) {
  if (!hasSupabaseAdminEnv()) {
    return;
  }

  const admin = createSupabaseAdminClient();
  const viewedOn = new Date().toISOString().slice(0, 10);

  if (options.viewerId) {
    // Authenticated user: use daily dedup backed by a composite unique index.
    const { error } = await admin.from("listing_views").upsert(
      {
        listing_id: listingId,
        viewer_id: options.viewerId,
        viewer_ip: options.viewerIp ?? null,
        viewed_on: viewedOn,
      },
      { onConflict: "listing_id,viewer_id,viewed_on", ignoreDuplicates: true }
    );

    if (error) {
      // Silently ignore — not critical
      return;
    }
  } else if (options.viewerIp) {
    // Anonymous user: check IP + daily dedup via viewed_on
    const { data: existing } = await admin
      .from("listing_views")
      .select("id")
      .eq("listing_id", listingId)
      .eq("viewer_ip", options.viewerIp)
      .is("viewer_id", null)
      .eq("viewed_on", viewedOn)
      .limit(1);

    if (existing && existing.length > 0) {
      return; // Already viewed today — skip
    }

    await admin.from("listing_views").insert({
      listing_id: listingId,
      viewer_id: null,
      viewer_ip: options.viewerIp,
      viewed_on: viewedOn,
    });
  }

  // ── PILL: Issue 9 - Batch View Updates (MVCC Fix) ──────────────────────────
  // Instead of doing expensive SELECT count + UPDATE on every page load,
  // we record the intent in a buffer table via RPC.
  // A background cron syncs this to the main 'listings' table later.
  await admin.rpc("increment_listing_view_buffered", { p_listing_id: listingId });
}

/**
 * Get total view count for a listing.
 */
export async function getListingViewCount(listingId: string): Promise<number> {
  if (!hasSupabaseAdminEnv()) {
    return 0;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("listings")
    .select("view_count")
    .eq("id", listingId)
    .single();

  if (error || !data) {
    return 0;
  }

  return (data.view_count as number) ?? 0;
}

/**
 * Get view counts for multiple listings at once.
 */
export async function getListingViewCounts(listingIds: string[]): Promise<Record<string, number>> {
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
