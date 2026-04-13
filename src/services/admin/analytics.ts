import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export interface AdminAnalyticsData {
  listingsByBrand: { brand: string; count: number }[];
  listingsByCity: { city: string; count: number }[];
  listingsByStatus: { status: string; count: number }[];
  totalUsers: number;
  totalListings: number;
  totalReports: number;
  totalRevenue: number;
  userTrend: number;
  listingTrend: number;
  recentTrends: {
    date: string;
    listings: number;
  }[];
  marketTrends: {
    brand: string;
    avgPrice: number;
  }[];
}

export async function getAdminAnalytics(): Promise<AdminAnalyticsData | null> {
  if (!hasSupabaseAdminEnv()) return null;
  const admin = createSupabaseAdminClient();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7DaysDate = new Date();
  last7DaysDate.setDate(last7DaysDate.getDate() - 7);
  const last7DaysStart = last7DaysDate.toISOString();

  // Optimized parallel fetching
  const [
    { data: brandStats },
    { data: cityStats },
    { data: statusStats },
    { count: userCount },
    { count: listingCount },
    { count: reportCount },
    { data: payments },
    { data: trendData },
    { count: newUsersRecent },
    { count: newListingsRecent },
    { data: marketStatsResult }
  ] = await Promise.all([
    admin.from("listings").select("brand"),
    admin.from("listings").select("city"),
    admin.from("listings").select("status"),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("listings").select("*", { count: "exact", head: true }),
    admin.from("reports").select("*", { count: "exact", head: true }),
    admin.from("payments").select("amount").eq("status", "success"),
    admin.from("listings").select("created_at").gte("created_at", last7DaysStart),
    admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo.toISOString()),
    admin.from("listings").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo.toISOString()),
    admin.from("market_stats").select("brand, avg_price")
  ]);

  // 1. Listings by Brand Mapping
  const brandMap: Record<string, number> = {};
  brandStats?.forEach((l) => {
    brandMap[l.brand] = (brandMap[l.brand] ?? 0) + 1;
  });
  const listingsByBrand = Object.entries(brandMap)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 2. Listings by City Mapping
  const cityMap: Record<string, number> = {};
  cityStats?.forEach((l) => {
    cityMap[l.city] = (cityMap[l.city] ?? 0) + 1;
  });
  const listingsByCity = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 3. Listings by Status Mapping
  const statusMap: Record<string, number> = {};
  statusStats?.forEach((l) => {
    statusMap[l.status] = (statusMap[l.status] ?? 0) + 1;
  });
  const listingsByStatus = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
  }));

  // 4. Totals & Revenue
  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  // 5. Recent Trends (last 7 days)
  const last7DaysArr = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const trends = last7DaysArr.map((date) => ({
    date,
    listings: trendData?.filter((l) => l.created_at.startsWith(date)).length ?? 0,
  }));

  // 6. Market Trends (Brand Average Prices)
  const brandPriceMap: Record<string, { total: number; count: number }> = {};
  marketStatsResult?.forEach((s) => {
    if (!brandPriceMap[s.brand]) brandPriceMap[s.brand] = { total: 0, count: 0 };
    brandPriceMap[s.brand].total += Number(s.avg_price);
    brandPriceMap[s.brand].count += 1;
  });

  const marketTrends = Object.entries(brandPriceMap)
    .map(([brand, stats]) => ({
      brand,
      avgPrice: Math.round(stats.total / stats.count),
    }))
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 5);

  return {
    listingsByBrand,
    listingsByCity,
    listingsByStatus,
    totalUsers: userCount ?? 0,
    totalListings: listingCount ?? 0,
    totalReports: reportCount ?? 0,
    totalRevenue,
    userTrend: newUsersRecent ? Math.round((newUsersRecent / Math.max(1, (userCount ?? 1) - newUsersRecent)) * 100) : 0,
    listingTrend: newListingsRecent ? Math.round((newListingsRecent / Math.max(1, (listingCount ?? 1) - newListingsRecent)) * 100) : 0,
    recentTrends: trends,
    marketTrends,
  };
}

