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

  // 1. Listings by Brand
  const { data: brandStats } = await admin
    .from("listings")
    .select("brand")
    .returns<{ brand: string }[]>();

  const brandMap: Record<string, number> = {};
  brandStats?.forEach((l) => {
    brandMap[l.brand] = (brandMap[l.brand] ?? 0) + 1;
  });
  const listingsByBrand = Object.entries(brandMap)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 2. Listings by City
  const { data: cityStats } = await admin
    .from("listings")
    .select("city")
    .returns<{ city: string }[]>();

  const cityMap: Record<string, number> = {};
  cityStats?.forEach((l) => {
    cityMap[l.city] = (cityMap[l.city] ?? 0) + 1;
  });
  const listingsByCity = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 3. Listings by Status
  const { data: statusStats } = await admin
    .from("listings")
    .select("status")
    .returns<{ status: string }[]>();

  const statusMap: Record<string, number> = {};
  statusStats?.forEach((l) => {
    statusMap[l.status] = (statusMap[l.status] ?? 0) + 1;
  });
  const listingsByStatus = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
  }));

  // 4. Totals & Revenue
  const { count: userCount } = await admin.from("profiles").select("*", { count: "exact", head: true });
  const { count: listingCount } = await admin.from("listings").select("*", { count: "exact", head: true });
  const { count: reportCount } = await admin.from("reports").select("*", { count: "exact", head: true });
  
  const { data: payments } = await admin.from("payments").select("amount").eq("status", "success");
  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  // 5. Recent Trends (last 7 days) for Chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const { data: trendData } = await admin
    .from("listings")
    .select("created_at")
    .gte("created_at", last7Days[0]);

  const trends = last7Days.map((date) => ({
    date,
    listings: trendData?.filter((l) => l.created_at.startsWith(date)).length ?? 0,
  }));

  // 6. Growth Trends (Last 30 days vs previous 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const { count: newUsersRecent } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo.toISOString());
    
  const { count: newListingsRecent } = await admin
    .from("listings")
    .select("*", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo.toISOString());

  // 7. Market Trends (Brand Average Prices)
  const { data: marketStats } = await admin
    .from("market_stats")
    .select("brand, avg_price");

  const brandPriceMap: Record<string, { total: number; count: number }> = {};
  marketStats?.forEach((s) => {
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
