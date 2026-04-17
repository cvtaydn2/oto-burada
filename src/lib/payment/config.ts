import { features } from "@/lib/features";

/**
 * Helper to check if payment processing is globally enabled.
 * Uses the centralized feature flag system.
 */
export function isPaymentEnabled() {
  return features.payments;
}
