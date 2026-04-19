"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { logger } from "@/lib/utils/logger";
import { captureServerError } from "@/lib/monitoring/posthog-server";
import { withCache } from "@/lib/utils/cache";

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

export async function getAdminAnalytics(range: string = "30d"): Promise<AdminAnalyticsData | null> {
  if (!hasSupabaseAdminEnv()) return null;

  // PERFORMANCE OPTIMIZATION: Cache analytics for 5 minutes
  // Admin dashboard doesn't need real-time data, 5min delay is acceptable
  const cacheKey = `admin-analytics:${range}`;
  
  return withCache(
    cacheKey,
    async () => {
      const admin = createSupabaseAdminClient();

      const days = range === "7d" ? 7 : range === "90d" ? 90 : range === "1y" ? 365 : 30;
      const now = new Date();
      const rangeDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const rangeStart = rangeDate.toISOString();
      const prevRangeStart = new Date(rangeDate.getTime() - days * 24 * 60 * 1000).toISOString();

      try {
        const [
          brandStatsResult,
          cityStatsResult,
          statusStatsResult,
          { count: userCount },
          { count: listingCount },
          { data: payments },
          { data: trendData },
          { count: newUsersRecent },
          { count: newListingsRecent },
          { data: marketStatsResult },
          { count: prevUserCount },
          { count: prevListingCount },
          { data: prevPayments },
          { count: pendingApprovalCount },
          { count: professionalUserCount },
        ] = await Promise.all([
          // Use DB-level aggregation via RPC to avoid pulling thousands of rows.
          // Falls back to empty array if RPC not available.
          admin.rpc("get_listings_by_brand_count", { p_status: "approved" }).then(
            (r) => r,
            () => ({ data: null, error: null }),
          ),
          admin.rpc("get_listings_by_city_count", { p_status: "approved" }).then(
            (r) => r,
            () => ({ data: null, error: null }),
          ),
          admin.rpc("get_listings_by_status_count").then(
            (r) => r,
            () => ({ data: null, error: null }),
          ),
          admin.from("profiles").select("*", { count: "exact", head: true }),
          admin.from("listings").select("*", { count: "exact", head: true }),
          admin.from("payments").select("amount").eq("status", "success"),
          admin.from("listings").select("created_at").gte("created_at", rangeStart),
          admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", rangeStart),
          admin.from("listings").select("*", { count: "exact", head: true }).gte("created_at", rangeStart),
          admin.from("market_stats").select("brand, avg_price").limit(20),
          admin.from("profiles").select("*", { count: "exact", head: true }).lt("created_at", rangeStart).gte("created_at", prevRangeStart),
          admin.from("listings").select("*", { count: "exact", head: true }).lt("created_at", rangeStart).gte("created_at", prevRangeStart),
          admin.from("payments").select("amount").eq("status", "success").lt("created_at", rangeStart).gte("created_at", prevRangeStart),
          admin.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
          admin.from("profiles").select("*", { count: "exact", head: true }).eq("user_type", "professional"),
        ]);

        // RPC-based aggregation returns { brand, count } / { city, count } / { status, count }
        // If RPC is unavailable (not yet created), fall back to in-memory aggregation
        // using a capped query so we don't pull the entire table.
        let listingsByBrand: { brand: string; count: number }[];
        if (brandStatsResult.data && brandStatsResult.data.length > 0) {
          listingsByBrand = (brandStatsResult.data as { brand: string; count: number }[])
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        } else {
          const { data: brandRaw } = await admin
            .from("listings")
            .select("brand")
            .eq("status", "approved")
            .limit(2000);
          const brandMap: Record<string, number> = {};
          brandRaw?.forEach((l) => { brandMap[l.brand] = (brandMap[l.brand] ?? 0) + 1; });
          listingsByBrand = Object.entries(brandMap)
            .map(([brand, count]) => ({ brand, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        }

        let listingsByCity: { city: string; count: number }[];
        if (cityStatsResult.data && cityStatsResult.data.length > 0) {
          listingsByCity = (cityStatsResult.data as { city: string; count: number }[])
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        } else {
          const { data: cityRaw } = await admin
            .from("listings")
            .select("city")
            .eq("status", "approved")
            .limit(2000);
          const cityMap: Record<string, number> = {};
          cityRaw?.forEach((l) => { cityMap[l.city] = (cityMap[l.city] ?? 0) + 1; });
          listingsByCity = Object.entries(cityMap)
            .map(([city, count]) => ({ city, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        }

        let listingsByStatus: { status: string; count: number }[];
        if (statusStatsResult.data && statusStatsResult.data.length > 0) {
          listingsByStatus = statusStatsResult.data as { status: string; count: number }[];
        } else {
          const { data: statusRaw } = await admin
            .from("listings")
            .select("status")
            .limit(5000);
          const statusMap: Record<string, number> = {};
          statusRaw?.forEach((l) => { statusMap[l.status] = (statusMap[l.status] ?? 0) + 1; });
          listingsByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));
        }

        const totalRevenueBase = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
        const prevRevenueBase = prevPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

        const trendDaysArr = Array.from({ length: Math.min(days, 14) }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          // Yerel timezone offseti hesaba katarak güvenli bir UTC string ayıklaması
          return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
        }).reverse();

        // PERFORMANS OPTİMİZASYONU: O(N*M)'i O(N)'e çeviriyoruz
        const trendMap = new Map<string, number>();
        if (trendData && Array.isArray(trendData)) {
          for (const item of trendData as Array<{ created_at: string }>) {
            const itemDateStr = item.created_at.split("T")[0];
            trendMap.set(itemDateStr, (trendMap.get(itemDateStr) ?? 0) + 1);
          }
        }

        const trends = trendDaysArr.map((date) => ({
          date,
          listings: trendMap.get(date) ?? 0,
        }));

        const marketTrends = (marketStatsResult || [])
          .map((s) => ({
            brand: (s as { brand: string }).brand,
            avgPrice: Math.round(Number((s as { avg_price: number }).avg_price)),
          }))
          .sort((a, b) => b.avgPrice - a.avgPrice)
          .slice(0, 5);

        return {
          kpis: {
            totalListings: listingCount ?? 0,
            previousPeriodListings: prevListingCount ?? 0,
            totalUsers: userCount ?? 0,
            previousPeriodUsers: prevUserCount ?? 0,
            totalRevenue: totalRevenueBase,
            previousPeriodRevenue: prevRevenueBase,
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
            ? Math.round((newListingsRecent / Math.max(1, (listingCount ?? 1) - newListingsRecent)) * 100)
            : 0,
          recentTrends: trends,
          marketTrends,
        };
      } catch (err) {
        logger.admin.error("getAdminAnalytics failed", err);
        captureServerError("getAdminAnalytics failed", "admin", err);
        return null;
      }
    },
    300, // 5 minutes TTL
  );
}
