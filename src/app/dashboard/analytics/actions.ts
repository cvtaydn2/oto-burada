"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getDailyAnalyticsSeries,
  getListingPerformanceMetrics,
  getSellerSummaryMetrics,
} from "@/services/analytics/analytics-records";

/**
 * Centralized action to retrieve full analytics payload for the logged-in user.
 */
export async function getDashboardAnalyticsAction() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
  }

  // Execute loading parallelly to respect performance best practices
  const [summary, listings, chartData] = await Promise.all([
    getSellerSummaryMetrics(user.id),
    getListingPerformanceMetrics(user.id),
    getDailyAnalyticsSeries(user.id),
  ]);

  return {
    summary,
    listings,
    chartData,
  };
}
