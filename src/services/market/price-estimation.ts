import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export interface PriceEstimationResult {
  min: number;
  max: number;
  avg: number;
  confidence: "low" | "medium" | "high";
  listingCount: number;
}

export async function estimateVehiclePrice(params: {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  carTrim?: string | null;
  tramerAmount?: number | null;
  damageStatusJson?: Record<string, string> | null;
}): Promise<PriceEstimationResult | null> {
  if (!hasSupabaseAdminEnv()) return null;
  const admin = createSupabaseAdminClient();

  // 1. Get the base average for the segment (optionally by trim)
  let query = admin
    .from("market_stats")
    .select("avg_price, listing_count")
    .eq("brand", params.brand)
    .eq("model", params.model)
    .eq("year", params.year);

  if (params.carTrim) {
    // Attempt trim matching if available, otherwise fallback to model-only in a retry
    query = query.eq("car_trim", params.carTrim);
  }

  const { data: stats } = await query.maybeSingle();

  let baseAvg = stats ? Number(stats.avg_price) : 0;
  let count = stats ? Number(stats.listing_count) : 0;

  // Fallback if trim-specific stats don't exist
  if (!stats && params.carTrim) {
    const { data: fallbackStats } = await admin
      .from("market_stats")
      .select("avg_price, listing_count")
      .eq("brand", params.brand)
      .eq("model", params.model)
      .eq("year", params.year)
      .is("car_trim", null)
      .maybeSingle();
    
    if (fallbackStats) {
      baseAvg = Number(fallbackStats.avg_price);
      count = Number(fallbackStats.listing_count);
    }
  }

  if (baseAvg === 0) {
    return { min: 0, max: 0, avg: 0, confidence: "low", listingCount: 0 };
  }

  const finalAvg = calculateValuation(baseAvg, params);
  const confidence = count > 15 ? "high" : count > 5 ? "medium" : "low";

  return {
    min: finalAvg * 0.92, // Narrower range for more "expert" feel
    max: finalAvg * 1.08,
    avg: finalAvg,
    confidence,
    listingCount: count,
  };
}

/**
 * Pure function to calculate valuation based on adjustments.
 * Isolated for unit testing.
 */
export function calculateValuation(
  baseAvg: number,
  params: {
    year: number;
    mileage: number;
    tramerAmount?: number | null;
    damageStatusJson?: Record<string, string> | null;
  },
) {
  // 1. Mileage adjustment
  const currentYear = new Date().getFullYear();
  const expectedMileage = (currentYear - params.year) * 15000;
  const mileageDiff = params.mileage - expectedMileage;
  const mileageAdjustment = (mileageDiff / 10000) * 0.012;
  const adjustedAvg = baseAvg * (1 - mileageAdjustment);

  // 2. Tramer adjustment (up to -20%)
  let tramerAdjustment = 0;
  if (params.tramerAmount && params.tramerAmount > 0) {
    tramerAdjustment = Math.min((params.tramerAmount / 10000) * 0.015, 0.2);
  }

  // 3. Damage (Painted/Changed) adjustment (up to -25%)
  let damageAdjustment = 0;
  if (params.damageStatusJson) {
    const nonOriginalParts = Object.values(params.damageStatusJson).filter(
      (v) => v !== "original" && v !== "var",
    ).length;
    damageAdjustment = Math.min(nonOriginalParts * 0.018, 0.25);
  }

  return adjustedAvg * (1 - tramerAdjustment - damageAdjustment);
}
