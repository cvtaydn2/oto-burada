/**
 * Fraud detection thresholds and configuration.
 * Centralized configuration for fraud score calculation and trust guard rules.
 *
 * These values can be adjusted based on market conditions and fraud patterns
 * without modifying business logic code.
 */

/**
 * Price anomaly detection thresholds.
 * Used to identify listings with suspicious pricing compared to market averages.
 */
export const PRICE_ANOMALY_THRESHOLDS = {
  /** Low outlier threshold for fraud score calculation (70% of average) */
  FRAUD_SCORE_LOW: 0.7,

  /** High outlier threshold for fraud score calculation (150% of average) */
  FRAUD_SCORE_HIGH: 1.5,

  /** Extreme low threshold for trust guard rejection (45% of average) */
  TRUST_GUARD_LOW: 0.45,

  /** Extreme high threshold for trust guard rejection (220% of average) */
  TRUST_GUARD_HIGH: 2.2,
} as const;

/**
 * Fraud score weights and penalties.
 * Higher values indicate more severe fraud indicators.
 */
export const FRAUD_SCORE_WEIGHTS = {
  /** Penalty for price significantly below market average */
  PRICE_TOO_LOW: 70,

  /** Penalty for price significantly above market average */
  PRICE_TOO_HIGH: 50,

  /** Penalty for missing VIN number */
  MISSING_VIN: 30,

  /** Penalty for suspicious description patterns */
  SUSPICIOUS_DESCRIPTION: 40,

  /** Penalty for insufficient images */
  INSUFFICIENT_IMAGES: 20,

  /** Penalty for low-quality images */
  LOW_QUALITY_IMAGES: 15,
} as const;

/**
 * Trust guard rejection thresholds.
 * Listings exceeding these thresholds are automatically rejected.
 */
export const TRUST_GUARD_THRESHOLDS = {
  /** Maximum fraud score before automatic rejection */
  MAX_FRAUD_SCORE: 100,

  /** Minimum number of images required */
  MIN_IMAGES: 3,

  /** Maximum number of listings per user per day */
  MAX_DAILY_LISTINGS: 5,

  /** Minimum description length (characters) */
  MIN_DESCRIPTION_LENGTH: 50,
} as const;

/**
 * Suspicious pattern detection.
 * Regular expressions and keywords for fraud detection.
 */
export const SUSPICIOUS_PATTERNS = {
  /** Keywords indicating potential scam */
  SCAM_KEYWORDS: [
    "acil",
    "hemen",
    "kaçmaz",
    "son fiyat",
    "pazarlık yok",
    "yurtdışından",
    "hasarsız garantili",
  ],

  /** Phone number patterns in description (should use whatsapp field) */
  PHONE_IN_DESCRIPTION: /\b0?\d{3}[-.\s]?\d{3}[-.\s]?\d{2}[-.\s]?\d{2}\b/g,

  /** External URL patterns (potential phishing) */
  EXTERNAL_URL: /https?:\/\/(?!otoburada\.com)/gi,
} as const;

/**
 * Get fraud thresholds with environment variable overrides.
 * Allows runtime configuration without code changes.
 */
export function getFraudThresholds() {
  return {
    priceAnomalyLow: Number(
      process.env.FRAUD_PRICE_LOW_THRESHOLD ?? PRICE_ANOMALY_THRESHOLDS.FRAUD_SCORE_LOW
    ),
    priceAnomalyHigh: Number(
      process.env.FRAUD_PRICE_HIGH_THRESHOLD ?? PRICE_ANOMALY_THRESHOLDS.FRAUD_SCORE_HIGH
    ),
    trustGuardLow: Number(
      process.env.TRUST_GUARD_PRICE_LOW ?? PRICE_ANOMALY_THRESHOLDS.TRUST_GUARD_LOW
    ),
    trustGuardHigh: Number(
      process.env.TRUST_GUARD_PRICE_HIGH ?? PRICE_ANOMALY_THRESHOLDS.TRUST_GUARD_HIGH
    ),
    maxFraudScore: Number(process.env.MAX_FRAUD_SCORE ?? TRUST_GUARD_THRESHOLDS.MAX_FRAUD_SCORE),
  };
}

/**
 * Validate fraud threshold configuration.
 * Ensures thresholds are logically consistent.
 */
export function validateFraudThresholds(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const thresholds = getFraudThresholds();

  if (thresholds.priceAnomalyLow >= thresholds.priceAnomalyHigh) {
    errors.push("Price anomaly low threshold must be less than high threshold");
  }

  if (thresholds.trustGuardLow >= thresholds.trustGuardHigh) {
    errors.push("Trust guard low threshold must be less than high threshold");
  }

  if (thresholds.maxFraudScore <= 0) {
    errors.push("Max fraud score must be positive");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
