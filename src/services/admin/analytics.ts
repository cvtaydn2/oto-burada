import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export interface AdminAnalyticsData {
  listingsByBrand: { brand: string; count: number }[];
  listingsByCity: { city: string; count: number }[];
  listingsByStatus: { status: string; count: number }[];
  totalUsers: number;
  totalListings: number;
  totalReports: number;
  recentTrends: {
    date: string;
    listings: number;
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

  // 4. Totals
  const { count: userCount } = await admin.from("profiles").select("*", { count: "exact", head: true });
  const { count: listingCount } = await admin.from("listings").select("*", { count: "exact", head: true });
  const { count: reportCount } = await admin.from("reports").select("*", { count: "exact", head: true });

  // 5. Recent Trends (last 7 days)
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

  return {
    listingsByBrand,
    listingsByCity,
    listingsByStatus,
    totalUsers: userCount ?? 0,
    totalListings: listingCount ?? 0,
    totalReports: reportCount ?? 0,
    recentTrends: trends,
  };
}
