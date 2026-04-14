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

export async function getAdminAnalytics(range: string = "30d"): Promise<AdminAnalyticsData | null> {
  if (!hasSupabaseAdminEnv()) return null;
  const admin = createSupabaseAdminClient();

  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const now = new Date();
  const rangeDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const rangeStart = rangeDate.toISOString();
  const prevRangeStart = new Date(rangeDate.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  // Optimized parallel fetching using specific selects and counts
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
    { data: marketStatsResult },
    // KPI specific counts
    { count: prevUserCount },
    { count: prevListingCount },
    { data: prevPayments },
    { count: pendingApprovalCount },
    { count: professionalUserCount }
  ] = await Promise.all([
    admin.from("listings").select("brand").limit(1000), 
    admin.from("listings").select("city").limit(1000),
    admin.from("listings").select("status"),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("listings").select("*", { count: "exact", head: true }),
    admin.from("reports").select("*", { count: "exact", head: true }),
    admin.from("payments").select("amount").eq("status", "success"),
    admin.from("listings").select("created_at").gte("created_at", rangeStart),
    admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", rangeStart),
    admin.from("listings").select("*", { count: "exact", head: true }).gte("created_at", rangeStart),
    admin.from("market_stats").select("brand, avg_price").limit(20),
    // Historical counts for change calculation
    admin.from("profiles").select("*", { count: "exact", head: true }).lt("created_at", rangeStart).gte("created_at", prevRangeStart),
    admin.from("listings").select("*", { count: "exact", head: true }).lt("created_at", rangeStart).gte("created_at", prevRangeStart),
    admin.from("payments").select("amount").eq("status", "success").lt("created_at", rangeStart).gte("created_at", prevRangeStart),
    // Segmented counts
    admin.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("user_type", "professional")
  ]);

  // brand/city/status mapping (optimized)
  const brandMap: Record<string, number> = {};
  brandStats?.forEach((l) => { brandMap[l.brand] = (brandMap[l.brand] ?? 0) + 1; });
  const listingsByBrand = Object.entries(brandMap)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const cityMap: Record<string, number> = {};
  cityStats?.forEach((l) => { cityMap[l.city] = (cityMap[l.city] ?? 0) + 1; });
  const listingsByCity = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const statusMap: Record<string, number> = {};
  statusStats?.forEach((l) => { statusMap[l.status] = (statusMap[l.status] ?? 0) + 1; });
  const listingsByStatus = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
  }));

  const totalRevenueBase = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const prevRevenueBase = prevPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  // Trend mapping for the selected range
  const trendDaysArr = Array.from({ length: Math.min(days, 14) }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const trends = trendDaysArr.map((date) => ({
    date,
    listings: (trendData as Array<{ created_at: string }>)?.filter((l) => l.created_at.startsWith(date)).length ?? 0,
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
    totalUsers: userCount ?? 0,
    totalListings: listingCount ?? 0,
    totalReports: reportCount ?? 0,
    totalRevenue: totalRevenueBase,
    userTrend: newUsersRecent ? Math.round((newUsersRecent / Math.max(1, (userCount ?? 1) - newUsersRecent)) * 100) : 0,
    listingTrend: newListingsRecent ? Math.round((newListingsRecent / Math.max(1, (listingCount ?? 1) - newListingsRecent)) * 100) : 0,
    recentTrends: trends,
    marketTrends,
  };
}
