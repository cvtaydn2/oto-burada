import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export interface PriceHistoryPoint {
  price: number;
  date: string;
}

export async function getListingPriceHistory(listingId: string): Promise<PriceHistoryPoint[]> {
  // Admin client kullan — RLS politikası sadece owner/admin'e izin veriyor
  // ama fiyat geçmişi public listing detail sayfasında herkese gösterilmeli
  if (!hasSupabaseAdminEnv()) return [];

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("listing_price_history")
    .select("price, created_at")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return data.map((item) => ({
    price: Number(item.price),
    date: item.created_at as string,
  }));
}

/**
 * Record initial price when a listing is created.
 * Called from createDatabaseListing.
 */
export async function recordInitialPrice(listingId: string, price: number): Promise<void> {
  if (!hasSupabaseAdminEnv()) return;
  const admin = createSupabaseAdminClient();
  await admin
    .from("listing_price_history")
    .insert({
      listing_id: listingId,
      price,
    })
    .then(() => undefined);
}

/**
 * Get price change summary for a listing.
 * Returns null if no history or only one data point.
 */
export async function getPriceChangeSummary(listingId: string): Promise<{
  originalPrice: number;
  currentPrice: number;
  changeAmount: number;
  changePercent: number;
  changeCount: number;
  direction: "up" | "down" | "stable";
} | null> {
  const history = await getListingPriceHistory(listingId);
  if (history.length < 2) return null;

  const first = history[0]!;
  const last = history[history.length - 1]!;
  const changeAmount = last.price - first.price;
  const changePercent = (changeAmount / first.price) * 100;

  return {
    originalPrice: first.price,
    currentPrice: last.price,
    changeAmount,
    changePercent,
    changeCount: history.length - 1,
    direction: changeAmount > 0 ? "up" : changeAmount < 0 ? "down" : "stable",
  };
}

/**
 * Compares a listing's current price against the market average.
 * Returns a score and a recommendation label.
 */
export async function getMarketValuation(params: {
  price: number;
  brand: string;
  model: string;
  year: number;
}) {
  if (!hasSupabaseAdminEnv()) return { status: "unknown" as const, diff: 0 };
  const admin = createSupabaseAdminClient();

  const { data: stats } = await admin
    .from("market_stats")
    .select("avg_price, listing_count, min_price, max_price")
    .eq("brand", params.brand)
    .eq("model", params.model)
    .eq("year", params.year)
    .is("car_trim", null)
    .maybeSingle();

  if (!stats || !stats.avg_price) {
    return { status: "unknown" as const, diff: 0 };
  }

  const avgPrice = Number(stats.avg_price);
  const minPrice = stats.min_price ? Number(stats.min_price) : avgPrice * 0.8;
  const maxPrice = stats.max_price ? Number(stats.max_price) : avgPrice * 1.2;
  const diffPercent = ((params.price - avgPrice) / avgPrice) * 100;

  let status: "good" | "fair" | "high" = "fair";
  if (diffPercent < -5) status = "good";
  if (diffPercent > 5) status = "high";

  return {
    status,
    diff: Math.abs(Math.round(diffPercent)),
    avgPrice,
    minPrice,
    maxPrice,
    listingCount: stats.listing_count,
  };
}
