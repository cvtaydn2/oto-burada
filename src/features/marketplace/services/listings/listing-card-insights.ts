/**
 * @deprecated This file has been moved to the components layer.
 *
 * ── ARCHITECTURE FIX: Issue #13 - Presentation Logic Moved to Components ─────
 * This file contained UI-specific logic (badges, colors, highlights) which belongs
 * in the presentation layer, not the service layer.
 *
 * New location: @/features/marketplace/components/ListingCardInsights
 *
 * Please update your imports:
 * ```ts
 * // Old (deprecated)
 * import { getListingCardInsights } from "@/features/marketplace/services/listing-card-insights";
 *
 * // New (correct)
 * import { getListingCardInsights } from "@/features/marketplace/components/ListingCardInsights";
 * ```
 *
 * This file will be removed in a future version.
 */

// Re-export from new location for backward compatibility
export {
  getListingCardInsights,
  type ListingCardInsight,
  type ListingCardInsightTone,
} from "@/features/marketplace/components/ListingCardInsights";
