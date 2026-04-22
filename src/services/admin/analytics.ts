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

import { SupabaseClient } from "@supabase/supabase-js";

async function getBrandStats(admin: SupabaseClient) {
  const { data } = await admin.rpc("get_listings_by_brand_count", { p_status: "approved" });
  if (data && data.length > 0) return (data as { brand: string; count: number }[]).sort((a, b) => b.count - a.count).slice(0, 5);
  
  const { data: raw } = await admin.from("listings").select("brand").eq("status", "approved").limit(2000);
  const map: Record<string, number> = {};
  raw?.forEach((l: { brand: string }) => { map[l.brand] = (map[l.brand] ?? 0) + 1; });
  return Object.entries(map).map(([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count).slice(0, 5);
}

async function getCityStats(admin: SupabaseClient) {
  const { data } = await admin.rpc("get_listings_by_city_count", { p_status: "approved" });
  if (data && data.length > 0) return (data as { city: string; count: number }[]).sort((a, b) => b.count - a.count).slice(0, 5);
  
  const { data: raw } = await admin.from("listings").select("city").eq("status", "approved").limit(2000);
  const map: Record<string, number> = {};
  raw?.forEach((l: { city: string }) => { map[l.city] = (map[l.city] ?? 0) + 1; });
  return Object.entries(map).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 5);
}

async function getStatusStats(admin: SupabaseClient) {
  const { data } = await admin.rpc("get_listings_by_status_count");
  if (data && data.length > 0) return data as { status: string; count: number }[];
  
  const { data: raw } = await admin.from("listings").select("status").limit(5000);
  const map: Record<string, number> = {};
  raw?.forEach((l: { status: string }) => { map[l.status] = (map[l.status] ?? 0) + 1; });
  return Object.entries(map).map(([status, count]) => ({ status, count }));
}

export async function getAdminAnalytics(range: string = "30d"): Promise<AdminAnalyticsData | null> {
  if (!hasSupabaseAdminEnv()) return null;
  const cacheKey = `admin-analytics:${range}`;
  
  return withCache(cacheKey, async () => {
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
        getBrandStats(admin),
        getCityStats(admin),
        getStatusStats(admin),
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

      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
      const prevRevenue = prevPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

      const trendMap = new Map<string, number>();
      (trendData as { created_at: string }[])?.forEach(item => {
        const d = item.created_at.split("T")[0];
        trendMap.set(d, (trendMap.get(d) ?? 0) + 1);
      });

      const trends = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        return { date: ds, listings: trendMap.get(ds) ?? 0 };
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
        userTrend: newUsersRecent ? Math.round((newUsersRecent / Math.max(1, (userCount ?? 1) - newUsersRecent)) * 100) : 0,
        listingTrend: newListingsRecent ? Math.round((newListingsRecent / Math.max(1, (listingCount ?? 1) - newListingsRecent)) * 100) : 0,
        recentTrends: trends,
        marketTrends: (marketStatsResult || []).map(s => ({ brand: (s as unknown as { brand: string }).brand, avgPrice: Math.round(Number((s as unknown as { avg_price: number }).avg_price)) })).sort((a, b) => b.avgPrice - a.avgPrice).slice(0, 5),
      };
    } catch (err) {
      logger.admin.error("getAdminAnalytics failed", err);
      captureServerError("getAdminAnalytics failed", "admin", err);
      return null;
    }
  }, 300);
}
