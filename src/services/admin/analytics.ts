"use server";

import { withCache } from "@/lib/caching/cache";
import { logger } from "@/lib/logging/logger";
import { captureServerError } from "@/lib/monitoring/telemetry-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export interface AdminAnalyticsData {
  kpis: {
    totalListings: number;
    previousPeriodListings: number;
    totalUsers: number;
    previousPeriodUsers: number;
    totalRevenue: number;
    previousPeriodRevenue: number;
    pendingApproval: number;
    professionalUsers: number;
  };
  listingsByBrand: { brand: string; count: number }[];
  listingsByCity: { city: string; count: number }[];
  listingsByStatus: { status: string; count: number }[];
  userTrend: number;
  listingTrend: number;
  recentTrends: { date: string; listings: number }[];
  marketTrends: { brand: string; avgPrice: number }[];
}

import { SupabaseClient } from "@supabase/supabase-js";

async function getBrandStats(admin: SupabaseClient) {
  const { data, error } = await admin.rpc("get_listings_by_brand_count", { p_status: "approved" });
  if (error || !data) return [];
  return (data as { brand: string; count: number }[]).sort((a, b) => b.count - a.count).slice(0, 5);
}

async function getCityStats(admin: SupabaseClient) {
  const { data, error } = await admin.rpc("get_listings_by_city_count", { p_status: "approved" });
  if (error || !data) return [];
  return (data as { city: string; count: number }[]).sort((a, b) => b.count - a.count).slice(0, 5);
}

async function getStatusStats(admin: SupabaseClient) {
  const { data, error } = await admin.rpc("get_listings_by_status_count");
  if (error || !data) return [];
  return data as { status: string; count: number }[];
}

export async function getAdminAnalytics(range: string = "30d"): Promise<AdminAnalyticsData | null> {
  if (!hasSupabaseAdminEnv()) return null;
  const cacheKey = `admin-analytics:${range}`;

  return withCache(
    cacheKey,
    async () => {
      const admin = createSupabaseAdminClient();
      const days = range === "7d" ? 7 : range === "90d" ? 90 : range === "1y" ? 365 : 30;
      const now = new Date();
      const rangeStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
      const prevRangeStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000).toISOString();

      try {
        const [
          listingsByBrand,
          listingsByCity,
          listingsByStatus,
          { count: userCount },
          { count: listingCount },
          { data: revenueData },
          { data: prevRevenueData },
          { data: trendData },
          { count: newUsersRecent },
          { count: newListingsRecent },
          { data: marketStatsResult },
          { count: prevUserCount },
          { count: prevListingCount },
          { count: pendingApprovalCount },
          { count: professionalUserCount },
        ] = await Promise.all([
          getBrandStats(admin),
          getCityStats(admin),
          getStatusStats(admin),
          admin.from("profiles").select("*", { count: "exact", head: true }),
          admin.from("listings").select("*", { count: "exact", head: true }),
          admin.rpc("get_revenue_stats", {
            p_start_date: rangeStart,
            p_end_date: now.toISOString(),
          }),
          admin.rpc("get_revenue_stats", { p_start_date: prevRangeStart, p_end_date: rangeStart }),
          admin.rpc("get_daily_listing_trend", { p_days: days }),
          admin
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", rangeStart),
          admin
            .from("listings")
            .select("*", { count: "exact", head: true })
            .gte("created_at", rangeStart),
          admin.from("market_stats").select("brand, avg_price").limit(20),
          admin
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .lt("created_at", rangeStart)
            .gte("created_at", prevRangeStart),
          admin
            .from("listings")
            .select("*", { count: "exact", head: true })
            .lt("created_at", rangeStart)
            .gte("created_at", prevRangeStart),
          admin
            .from("listings")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          admin
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("user_type", "professional"),
        ]);

        const revenueDataTyped = revenueData as unknown as { total_amount: number }[];
        const prevRevenueDataTyped = prevRevenueData as unknown as { total_amount: number }[];
        const trendDataTyped = trendData as unknown as { day: string; count: number }[];

        const totalRevenue = revenueDataTyped?.[0]?.total_amount ?? 0;
        const prevRevenue = prevRevenueDataTyped?.[0]?.total_amount ?? 0;

        // Process daily trend from DB-aggregated results
        const trendCount = Math.min(days, 30);
        const dailyCounts = new Map(trendDataTyped?.map((d) => [d.day, Number(d.count)]));

        const trends = Array.from({ length: trendCount }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const ds = d.toISOString().split("T")[0];
          return { date: ds, listings: dailyCounts.get(ds) ?? 0 };
        }).reverse();

        return {
          kpis: {
            totalListings: listingCount ?? 0,
            previousPeriodListings: prevListingCount ?? 0,
            totalUsers: userCount ?? 0,
            previousPeriodUsers: prevUserCount ?? 0,
            totalRevenue,
            previousPeriodRevenue: prevRevenue,
            pendingApproval: pendingApprovalCount ?? 0,
            professionalUsers: professionalUserCount ?? 0,
          },
          listingsByBrand,
          listingsByCity,
          listingsByStatus,
          userTrend: newUsersRecent
            ? Math.round((newUsersRecent / Math.max(1, (userCount ?? 1) - newUsersRecent)) * 100)
            : 0,
          listingTrend: newListingsRecent
            ? Math.round(
                (newListingsRecent / Math.max(1, (listingCount ?? 1) - newListingsRecent)) * 100
              )
            : 0,
          recentTrends: trends,
          marketTrends: (marketStatsResult || [])
            .map((s) => ({
              brand: (s as unknown as { brand: string }).brand,
              avgPrice: Math.round(Number((s as unknown as { avg_price: number }).avg_price)),
            }))
            .sort((a, b) => b.avgPrice - a.avgPrice)
            .slice(0, 5),
        };
      } catch (err) {
        logger.admin.error("getAdminAnalytics failed", err);
        captureServerError("getAdminAnalytics failed", "admin", err);
        return null;
      }
    },
    300
  );
}
