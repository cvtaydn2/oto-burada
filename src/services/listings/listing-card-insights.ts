import type { Listing } from "@/types";
import { analyzeListingValue } from "./pricing-engine";

export type ListingCardInsightTone = "indigo" | "emerald" | "amber" | "rose" | "blue";

export interface ListingCardInsight {
  badgeLabel: string;
  tone: ListingCardInsightTone;
  summary: string;
  highlights: string[];
  buyRecommendation: string;
  fairValue?: number;
}

export function getListingCardInsights(listing: Listing): ListingCardInsight {
  // Base logic uses the engine
  const analysis = analyzeListingValue(listing);

  const highlights: string[] = [];
  
  // Highlight construction
  if (analysis.rating === "opportunity") highlights.push("🔥 FIRSAT ARACI");
  if (analysis.riskScore === "low") highlights.push("✅ Düşük Risk");
  if (analysis.riskScore === "high") highlights.push("⚠️ Detaylı İncele");
  if (listing.mileage < 70000) highlights.push("📍 Düşük KM");
  if (analysis.hasCriticalDamage) highlights.push("⚡ Kritik Parça İşlemli");

  let badgeLabel = "İnceleniyor";
  let tone: ListingCardInsightTone = "blue";

  switch (analysis.rating) {
    case "opportunity":
      badgeLabel = analysis.riskScore === "high" ? "Fiyat Avantajlı" : "Süper Fırsat";
      tone = analysis.riskScore === "high" ? "amber" : "emerald";
      break;
    case "good":
      badgeLabel = "İdeal Fiyat";
      tone = "indigo";
      break;
    case "fair":
      badgeLabel = "Makul";
      tone = "blue";
      break;
    case "overpriced":
      badgeLabel = "Kontrollü Alım";
      tone = "amber";
      break;
  }

  // Handle specific quality indicators
  if (listing.featured && analysis.rating !== "opportunity") {
    badgeLabel = "Vitrindeki İlan";
    tone = "amber";
  }

  return {
    badgeLabel,
    tone,
    summary: analysis.advice,
    highlights: highlights.slice(0, 3),
    buyRecommendation: analysis.advice,
    fairValue: analysis.fairValue
  };
}
