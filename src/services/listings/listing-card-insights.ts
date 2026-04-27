import { MARKET_THRESHOLDS } from "@/config/market-thresholds";
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

// ── PERFORMANCE FIX: Issue #19 - Cache Current Year at Module Level ─────
// Compute current year once at module load instead of on every card render.
// In a page with 50 listings, this saves 49 Date object allocations.
const CURRENT_YEAR = new Date().getFullYear();

export function getListingCardInsights(listing: Listing): ListingCardInsight {
  const analysis = analyzeListingValue(listing);

  // ── BUSINESS LOGIC FIX: Issue #12 - Use Centralized Thresholds ─────
  const isBudgetFriendly = listing.price <= MARKET_THRESHOLDS.budgetFriendlyMaxPrice;
  const isLowMileage = listing.mileage <= MARKET_THRESHOLDS.lowMileageMaxKm;
  const isCurrentModel = listing.year >= CURRENT_YEAR - MARKET_THRESHOLDS.recentModelYears;
  const isAutomatic = listing.transmission === "otomatik";

  const highlights: string[] = [];
  if (isBudgetFriendly) highlights.push("Bütçe Dostu");
  if (isLowMileage) highlights.push("Düşük KM");
  if (isCurrentModel) highlights.push("Güncel Model");
  if (isAutomatic) highlights.push("Otomatik Sürüş");
  if (listing.expertInspection) highlights.push("Ekspertizli");
  if (analysis.riskScore === "low") highlights.push("Düşük Risk");
  if (analysis.hasCriticalDamage) highlights.push("Detaylı İncele");

  let badgeLabel = "İncelenebilir";
  let tone: ListingCardInsightTone = "indigo";

  if (listing.featured) {
    badgeLabel = "Öne Çıkan";
    tone = "amber";
  } else if (isBudgetFriendly && isLowMileage) {
    badgeLabel = "Akıllı Seçim";
    tone = "emerald";
  } else if (isAutomatic && isCurrentModel) {
    badgeLabel = "Kolay Karar";
    tone = "indigo";
  } else if (analysis.rating === "opportunity" && analysis.riskScore !== "high" && isLowMileage) {
    badgeLabel = "Fırsat";
    tone = "emerald";
  }

  return {
    badgeLabel,
    tone,
    summary: analysis.advice,
    highlights: highlights.slice(0, 4),
    buyRecommendation: analysis.advice,
    fairValue: analysis.fairValue,
  };
}
