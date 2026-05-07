"use server";

import { createSupabaseAdminClient } from "@/features/shared/lib/admin";
import { logger } from "@/features/shared/lib/logger";

export async function aggregateMarketStats() {
  const supabaseAdmin = createSupabaseAdminClient();
  try {
    // 1. Fetch all approved listings with basic data
    const { data: rawListings, error: fetchError } = await supabaseAdmin
      .from("listings")
      .select("brand, model, year, price, market_price_index")
      .eq("status", "approved");

    if (fetchError) throw fetchError;
    if (!rawListings || rawListings.length === 0)
      return { success: true, message: "No approved listings to aggregate." };

    interface SimpleListing {
      brand: string;
      model: string;
      year: number;
      price: number;
      market_price_index: number | null;
    }

    const listings = rawListings as unknown as SimpleListing[];

    // 2. Group by Brand/Model/Year
    const groups: Record<string, { brand: string; model: string; year: number; prices: number[] }> =
      {};

    listings.forEach((l) => {
      const key = `${l.brand}-${l.model}-${l.year}`.toLowerCase();
      if (!groups[key]) {
        groups[key] = { brand: l.brand, model: l.model, year: l.year, prices: [] };
      }
      groups[key].prices.push(l.price);
    });

    // 3. Calculate Averages and Prep Upsert
    const statsToUpsert = Object.values(groups).map((g) => {
      const avgPrice = Math.round(g.prices.reduce((a, b) => a + b, 0) / g.prices.length);
      return {
        brand: g.brand,
        model: g.model,
        year: g.year,
        avg_price: avgPrice,
        listing_count: g.prices.length,
        calculated_at: new Date().toISOString(),
      };
    });

    // 4. Upsert into market_stats
    // We use brand, model, year as a unique combination for upserting
    // (We might need a unique constraint on these columns in DB, but for now we'll do manual cleanup or just upsert)
    // For simplicity, let's clear and re-insert if no unique constraint
    await supabaseAdmin
      .from("market_stats")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Clear all

    const { error: upsertError } = await supabaseAdmin.from("market_stats").insert(statsToUpsert);

    if (upsertError) throw upsertError;

    // 5. Update market_price_index for each listing
    for (const l of listings) {
      const key = `${l.brand}-${l.model}-${l.year}`.toLowerCase();
      const stat = statsToUpsert.find(
        (s) => `${s.brand}-${s.model}-${s.year}`.toLowerCase() === key
      );
      if (stat) {
        const index = parseFloat((l.price / stat.avg_price).toFixed(3));
        await supabaseAdmin
          .from("listings")
          .update({ market_price_index: index })
          .eq("brand", l.brand)
          .eq("model", l.model)
          .eq("year", l.year)
          .eq("price", l.price); // Rough match to avoid complex IDs here
      }
    }

    return {
      success: true,
      message: `${statsToUpsert.length} pazar segmenti güncellendi.`,
      count: statsToUpsert.length,
    };
  } catch (error: unknown) {
    logger.market.error("Market aggregation failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Bilinmeyen hata" };
  }
}
