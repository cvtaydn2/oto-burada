import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type AnalyticsInsert = Database["public"]["Tables"]["analytics_events"]["Insert"];

/**
 * Insert an analytics event using the admin client to ensure tracking works
 * for both authenticated and anonymous sessions while maintaining data integrity.
 */
export async function insertAnalyticsEvent(event: AnalyticsInsert) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("analytics_events").insert(event);

  if (error) {
    console.error("Error inserting analytics event:", error);
  }
}

/**
 * Fetches overview metrics for the dashboard by reading pre-calculated
 * profile aggregates, honoring our denormalized aggregate architecture.
 */
export async function getSellerSummaryMetrics(sellerId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("total_listing_views, total_contact_clicks, avg_conversion_rate")
    .eq("id", sellerId)
    .single();

  if (error) {
    console.error("Error loading profile summary metrics:", error);
    return {
      total_listing_views: 0,
      total_contact_clicks: 0,
      avg_conversion_rate: 0,
    };
  }

  return data;
}

/**
 * Fetches performance breakdowns per listing, directly reading from denormalized
 * listing counter columns.
 */
export async function getListingPerformanceMetrics(sellerId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("listings")
    .select("id, title, price, view_count, contact_count, status, created_at")
    .eq("seller_id", sellerId)
    .order("view_count", { ascending: false });

  if (error) {
    console.error("Error fetching per-listing metrics:", error);
    return [];
  }

  return data;
}

/**
 * Fetches time-series daily activity for high-level charting over the last 30 days.
 * For MVP, fetches raw aggregated counts from analytics_events grouped by day.
 */
export async function getDailyAnalyticsSeries(sellerId: string) {
  const supabase = await createSupabaseServerClient();

  // Calculate the date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Using native Supabase count & group mechanisms for time-series via RPC is cleaner
  // for large data, but for MVP we select date-truncated grouping or use simple selection.
  // Let's directly use SQL query mapping or write a clean read.

  // Since Supabase client does not natively support DB server-side Group By on Date truncation well
  // without raw SQL, we'll execute a light-weight stored procedure OR fetch raw counts.
  // Let's call an RPC get_seller_daily_activity
  const { data, error } = await supabase.rpc("get_seller_daily_activity", {
    p_seller_id: sellerId,
    p_days: 30,
  });

  if (error) {
    // Fallback: Log and return empty if RPC missing
    console.warn("Daily activity RPC error:", error.message);
    return [];
  }

  return data;
}
