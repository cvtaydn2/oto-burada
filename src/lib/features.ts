/**
 * Feature Flags Configuration
 * Used to toggle modules that are out of MVP scope or in development.
 */
export const FEATURES = {
  // Core Marketplace (Always ON)
  MARKETPLACE: true,
  LISTING_CREATION: true,
  WHATSAPP_CONTACT: true,

  // Out of MVP Scope (Toggled OFF or for future)
  BILLING: process.env.NEXT_PUBLIC_ENABLE_BILLING === "true",
  AI_INSIGHTS: process.env.NEXT_PUBLIC_ENABLE_AI === "true",
  IN_APP_CHAT: process.env.NEXT_PUBLIC_ENABLE_CHAT === "true",
  COMPARE: process.env.NEXT_PUBLIC_ENABLE_COMPARE === "true",
  DOCUMENT_UPLOADS: process.env.NEXT_PUBLIC_ENABLE_DOCS === "true",
  PWA: process.env.NEXT_PUBLIC_ENABLE_PWA === "true",
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(feature: FeatureKey): boolean {
  return FEATURES[feature];
}
