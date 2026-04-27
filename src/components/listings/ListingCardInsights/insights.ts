/**
 * Listing Card Insights - Presentation Logic
 *
 * ── ARCHITECTURE FIX: Issue #13 - Move Presentation Logic to Components ─────
 * Moved from services/listings/listing-card-insights.ts to components layer.
 *
 * This file contains UI-specific logic (badges, colors, highlights) which belongs
 * in the presentation layer, not the service layer.
 *
 * Layer separation:
 * - services/: Business logic, data access, domain rules
 * - components/: UI logic, presentation, user interaction
 */

import { MARKET_THRESHOLDS } from "@/config/market-thresholds";
import { analyzeListingValue } from "@/services/listings/pricing-engine";
import type { Listing } from "@/types";

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

/**
 * Generates UI insights for a listing card.
 *
 * This is presentation logic - it determines what badges, colors, and highlights
 * to show to the user based on business rules from the pricing engine.
 */
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

  // ── UX FIX: Issue #28 - Honest Critical Damage Communication ─────────────
  // Instead of vague "Detaylı İncele", explicitly communicate damage status.
  // Transparency builds trust and prevents misleading buyers.
  if (analysis.hasCriticalDamage) {
    highlights.push("Hasar Kaydı");
  }

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
