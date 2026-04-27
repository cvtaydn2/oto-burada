/**
 * @deprecated This file has been moved to the components layer.
 *
 * ── ARCHITECTURE FIX: Issue #13 - Presentation Logic Moved to Components ─────
 * This file contained UI-specific logic (badges, colors, highlights) which belongs
 * in the presentation layer, not the service layer.
 *
 * New location: @/components/listings/ListingCardInsights
 *
 * Please update your imports:
 * ```ts
 * // Old (deprecated)
 * import { getListingCardInsights } from "@/services/listings/listing-card-insights";
 *
 * // New (correct)
 * import { getListingCardInsights } from "@/components/listings/ListingCardInsights";
 * ```
 *
 * This file will be removed in a future version.
 */

// Re-export from new location for backward compatibility
export {
  getListingCardInsights,
  type ListingCardInsight,
  type ListingCardInsightTone,
} from "@/components/listings/ListingCardInsights";
