/**
 * Market Thresholds Configuration
 *
 * ── BUSINESS LOGIC FIX: Issue #12 - Parametrized Market Thresholds ─────
 * Centralized configuration for market-based thresholds that change over time
 * due to inflation, market conditions, and business strategy.
 *
 * These values should be reviewed quarterly and can be moved to database
 * or environment variables for dynamic updates without code deployment.
 */

export const MARKET_THRESHOLDS = {
  /**
   * Maximum price (TRY) for a vehicle to be considered "budget-friendly"
   * Current: 1,500,000 TRY (updated Q2 2026)
   */
  budgetFriendlyMaxPrice: 1_500_000,

  /**
   * Maximum mileage (km) for a vehicle to be considered "low mileage"
   * Current: 80,000 km
   */
  lowMileageMaxKm: 80_000,

  /**
   * Number of years from current year to consider a vehicle as "recent model"
   * Current: 5 years (e.g., 2026 - 5 = 2021 and newer)
   */
  recentModelYears: 5,

  /**
   * Minimum price difference (TRY) to show "opportunity" badge
   * Used when fair value is significantly higher than listing price
   */
  opportunityPriceDifferenceMin: 50_000,
} as const;

/**
 * Helper to check if thresholds need review based on last update date
 */
export function shouldReviewThresholds(): boolean {
  const lastUpdate = new Date("2026-04-01"); // Q2 2026 update
  const now = new Date();
  const monthsSinceUpdate =
    (now.getFullYear() - lastUpdate.getFullYear()) * 12 + (now.getMonth() - lastUpdate.getMonth());

  return monthsSinceUpdate >= 3; // Review every 3 months
}
