import { Listing } from "@/types";

/**
 * OtoBurada Smart Pricing Engine
 * Calculates the Adjusted Fair Value of a vehicle based on its specific condition
 * relative to a clean market baseline.
 */

const RISK_FACTORS = {
  CRITICAL: ["tavan", "kaput", "bagaj"],
  SIDE: [
    "sol_on_camurluk",
    "sol_arka_camurluk",
    "sag_on_camurluk",
    "sag_arka_camurluk",
    "sol_on_kapi",
    "sol_arka_kapi",
    "sag_on_kapi",
    "sag_arka_kapi",
  ],
  PLASTIC: ["on_tampon", "arka_tampon"],
};

// Turkish Market Standards for Value Loss (Estimated)
const PENALTY_MAP: Record<string, Record<string, number>> = {
  degisen: { critical: 0.1, side: 0.05, plastic: 0.01 },
  boyali: { critical: 0.04, side: 0.025, plastic: 0.0 },
  lokal_boyali: { critical: 0.02, side: 0.015, plastic: 0.0 },
};

export interface PricingAnalysis {
  fairValue: number;
  rating: "opportunity" | "good" | "fair" | "overpriced";
  riskScore: "low" | "medium" | "high";
  hasCriticalDamage: boolean;
  totalPenaltyPercentage: number;
  damageCount: number;
  priceDifference: number;
  priceRatio: number;
  advice: string;
}

export function analyzeListingValue(listing: Listing, baseMarketPrice?: number): PricingAnalysis {
  // If no base price provided, we estimate one from the listing itself or use a placeholder
  // In production, baseMarketPrice comes from `market_stats` aggregation
  const cleanMarketPrice = baseMarketPrice || listing.price * (listing.marketPriceIndex || 1.0);

  let totalPenalty = 0;
  let hasCriticalDamage = false;
  let damageCount = 0;
  let criticalDamageCount = 0;

  if (listing.damageStatusJson) {
    Object.entries(listing.damageStatusJson).forEach(([part, status]) => {
      if (!status || status === "orijinal" || status === "bilinmiyor") return;

      damageCount++;
      const isCritical = RISK_FACTORS.CRITICAL.includes(part);
      const isPlastic = RISK_FACTORS.PLASTIC.includes(part);
      const type = isCritical ? "critical" : isPlastic ? "plastic" : "side";

      const penalty = PENALTY_MAP[status]?.[type] || 0;
      totalPenalty += penalty;

      if (isCritical) {
        criticalDamageCount++;
        if (status === "degisen") hasCriticalDamage = true;
      }
    });
  }

  // KM Adjustment: Standard 20k km/year
  // (currentYear - year) * 20000 = expectedMileage
  const currentYear = new Date().getFullYear();
  const age = Math.max(1, currentYear - listing.year);
  const expectedMileage = age * 22000;
  const kmDifference = listing.mileage - expectedMileage;

  // Every 20k km distance from expectancy adds/removes 1.5% value
  const kmPenaltyLine = (kmDifference / 20000) * 0.015;
  totalPenalty += kmPenaltyLine;

  const fairValue = Math.round(cleanMarketPrice * (1 - totalPenalty));
  const priceRatio = fairValue > 0 ? listing.price / fairValue : 0;
  const priceDifference = listing.price - fairValue;

  // Decision Logic
  let rating: PricingAnalysis["rating"] = "fair";
  if (priceRatio < 0.96) rating = "opportunity";
  else if (priceRatio < 1.03) rating = "good";
  else if (priceRatio < 1.09) rating = "fair";
  else rating = "overpriced";

  // Risk Logic
  let riskScore: PricingAnalysis["riskScore"] = "low";
  if (hasCriticalDamage || criticalDamageCount >= 2 || totalPenalty > 0.25) riskScore = "high";
  else if (damageCount > 3 || criticalDamageCount === 1 || totalPenalty > 0.12)
    riskScore = "medium";

  // Human Advice
  let advice = "";
  if (rating === "opportunity" && riskScore !== "high") {
    advice =
      "Kondisyonuna göre piyasa fiyatının oldukça altında. Kaçırılmayacak bir fırsat olabilir.";
  } else if (rating === "opportunity" && riskScore === "high") {
    advice = "Fiyat düşük ancak araçta kritik hasarlar mevcut. Detaylı ekspertiz ile alınabilir.";
  } else if (rating === "good") {
    advice = "Piyasa değerinde bir ilan. Güvenli bir tercih olarak değerlendirilebilir.";
  } else if (rating === "overpriced") {
    advice =
      "Fiyatı mevcut kondisyonuna göre bir miktar yüksek görünüyor. Pazarlık payı sorgulanmalı.";
  } else {
    advice = "Makul bir ilan. Benzer ilanlarla kıyaslanarak karar verilebilir.";
  }

  return {
    fairValue,
    rating,
    riskScore,
    hasCriticalDamage,
    totalPenaltyPercentage: Math.round(totalPenalty * 100),
    damageCount,
    priceDifference,
    priceRatio,
    advice,
  };
}
