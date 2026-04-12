import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export interface MarketStatUpdateResult {
  avgPrice: number;
  count: number;
  updatedListings: number;
}

/**
 * Recalculates market statistics for a specific car segment and updates all relevant listings.
 * This ensures the 'Market Price Index' remains accurate relative to active inventory.
 */
export async function updateMarketStats(brand: string, model: string, year: number): Promise<MarketStatUpdateResult | null> {
  if (!hasSupabaseAdminEnv()) return null;
  const admin = createSupabaseAdminClient();

  // 1. Fetch all approved listings for this segment to calculate real average
  const { data: listings, error: fetchError } = await admin
    .from("listings")
    .select("price")
    .eq("brand", brand)
    .eq("model", model)
    .eq("year", year)
    .eq("status", "approved");

  if (fetchError || !listings) return null;

  const count = listings.length;
  if (count === 0) return { avgPrice: 0, count: 0, updatedListings: 0 };

  const total = listings.reduce((sum, item) => sum + Number(item.price), 0);
  const avgPrice = total / count;

  // 2. Update or Insert into market_stats table for historical tracking
  const { error: statsError } = await admin
    .from("market_stats")
    .upsert({
      brand,
      model,
      year,
      avg_price: avgPrice,
      listing_count: count,
      calculated_at: new Date().toISOString(),
    }, { onConflict: "brand,model,year" });

  if (statsError) {
    console.error("Failed to update market_stats:", statsError);
  }

  // 3. Update the 'market_price_index' for ALL approved listings in this segment
  // Formula: (Current Price / Market Average)
  const { error } = await admin
    .from("listings")
    .update({
      market_price_index: 0, // Reset first or calculate via RPC for better accuracy
    })
    .eq("brand", brand)
    .eq("model", model)
    .eq("year", year)
    .eq("status", "approved");

  // Since Supabase/PostgREST doesn't support relative updates easily in .update(), 
  // we'll fetch then batch update or use an RPC if this becomes common.
  // For MVP, we'll iterate through the listings we already have IDs for.
  const { data: activeListings } = await admin
    .from("listings")
    .select("id, price")
    .eq("brand", brand)
    .eq("model", model)
    .eq("year", year)
    .eq("status", "approved");

  let updatedCount = 0;
  if (activeListings) {
    for (const listing of activeListings) {
      const index = Number(listing.price) / avgPrice;
      await admin
        .from("listings")
        .update({ market_price_index: index })
        .eq("id", listing.id);
      updatedCount++;
    }
  }

  return {
    avgPrice,
    count,
    updatedListings: updatedCount
  };
}

/**
 * Utility to batch update market stats for common car types
 * Usually run as a CRON job.
 */
export async function refreshTopMarketSegments() {
  if (!hasSupabaseAdminEnv()) return;
  const admin = createSupabaseAdminClient();

  // Get top brand/model/year combinations
  const { data } = await admin
    .from("listings")
    .select("brand, model, year")
    .eq("status", "approved");

  if (!data) return;

  const segments = new Set(data.map(i => `${i.brand}|${i.model}|${i.year}`));
  
  for (const segment of segments) {
    const [brand, model, year] = segment.split("|");
    await updateMarketStats(brand, model, Number(year));
  }
}
