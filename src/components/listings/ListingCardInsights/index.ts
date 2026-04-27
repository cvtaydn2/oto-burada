/**
 * Listing Card Insights - Public API
 *
 * ── ARCHITECTURE FIX: Issue #13 - Presentation Layer Organization ─────
 * Centralized export for listing card insights.
 */

export type { ListingCardInsight, ListingCardInsightTone } from "./insights";
export { getListingCardInsights } from "./insights";
