import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { logger } from "@/lib/utils/logger";

export interface MarketStatUpdateResult {
  avgPrice: number;
  count: number;
  updatedListings: number;
}

/**
 * Recalculates market statistics for a specific car segment and updates all relevant listings.
 * This ensures the 'Market Price Index' remains accurate relative to active inventory.
 */
export async function updateMarketStats(
  brand: string,
  model: string,
  year: number
): Promise<MarketStatUpdateResult | null> {
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
  const { error: statsError } = await admin.from("market_stats").upsert(
    {
      brand,
      model,
      year,
      avg_price: avgPrice,
      listing_count: count,
      calculated_at: new Date().toISOString(),
    },
    { onConflict: "brand,model,year" }
  );

  if (statsError) {
    logger.market.error("Failed to update market_stats", statsError, { brand, model, year });
  }

  // 3. Update the 'market_price_index' for ALL approved listings in this segment
  // Formula: (Current Price / Market Average)
  // Use high-performance RPC to update all listings in a single transaction
  const { error: rpcError } = await admin.rpc("update_listing_price_indices", {
    p_brand: brand,
    p_model: model,
    p_year: year,
    p_avg_price: avgPrice,
  });

  if (rpcError) {
    logger.market.error("Failed to update listing indices via RPC", rpcError, {
      brand,
      model,
      year,
    });
    return null;
  }

  return {
    avgPrice,
    count,
    updatedListings: count, // Representing the whole batch
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

  const segments = new Set(data.map((i) => `${i.brand}|${i.model}|${i.year}`));

  for (const segment of segments) {
    const [brand, model, year] = segment.split("|");
    await updateMarketStats(brand, model, Number(year));
  }
}
