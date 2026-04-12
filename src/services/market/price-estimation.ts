import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export interface PriceEstimationResult {
  min: number;
  max: number;
  avg: number;
  confidence: "low" | "medium" | "high";
  listingCount: number;
}

/**
 * Estimates the market price for a vehicle based on available data.
 * Uses the market_stats table and applies KM/Condition adjustments.
 */
export async function estimateVehiclePrice(params: {
  brand: string;
  model: string;
  year: number;
  mileage: number;
}): Promise<PriceEstimationResult | null> {
  if (!hasSupabaseAdminEnv()) return null;
  const admin = createSupabaseAdminClient();

  // 1. Get the base average for the segment
  const { data: stats, error } = await admin
    .from("market_stats")
    .select("avg_price, listing_count")
    .eq("brand", params.brand)
    .eq("model", params.model)
    .eq("year", params.year)
    .single();

  if (error || !stats) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      confidence: "low",
      listingCount: 0,
    };
  }

  const baseAvg = Number(stats.avg_price);
  const count = Number(stats.listing_count);

  // 2. Simple mileage adjustment (example: -5% for every 50k km above a threshold)
  // This is a naive model for the MVP.
  const expectedMileage = (new Date().getFullYear() - params.year) * 15000;
  const mileageDiff = params.mileage - expectedMileage;
  
  // -1% for every 10,000 km over expected
  const mileageAdjustment = (mileageDiff / 10000) * 0.01;
  const adjustedAvg = baseAvg * (1 - mileageAdjustment);

  const confidence = count > 15 ? "high" : count > 5 ? "medium" : "low";

  return {
    min: adjustedAvg * 0.9,
    max: adjustedAvg * 1.1,
    avg: adjustedAvg,
    confidence,
    listingCount: count,
  };
}
