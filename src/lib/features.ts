/**
 * Feature flags — env-var-based, no external dependency.
 *
 * A feature is "on" when its required env var(s) are set OR its explicit 
 * NEXT_PUBLIC_FEATURE_X flag is set to 'true'.
 *
 * This keeps the pattern simple and consistent with the rest of the codebase.
 *
 * Usage:
 *   import { features } from "@/lib/features";
 *   if (!features.payments) return apiError(...);
 *
 * To enable a feature: set the env var in Vercel Project Settings and redeploy.
 */

export const features = {
  // --- Infrastructure Flags (Hard dependency on Env Vars) ---
  
  /** Payment processing via Iyzico. Requires IYZICO_API_KEY + IYZICO_SECRET_KEY. */
  payments: Boolean(
    process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY,
  ),

  /** Transactional emails via Resend. Requires RESEND_API_KEY. */
  email: Boolean(process.env.RESEND_API_KEY),

  /**
   * Distributed rate limiting via Upstash Redis.
   * When off, falls back to Supabase RPC → in-memory (resets on cold start).
   */
  distributedRateLimit: Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  ),

  /** Image uploads to Supabase Storage. */
  imageUploads: Boolean(
    process.env.SUPABASE_STORAGE_BUCKET_LISTINGS &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  ),

  /** Document uploads (expert inspection PDFs) to private Supabase Storage. */
  documentUploads: Boolean(
    process.env.SUPABASE_STORAGE_BUCKET_DOCUMENTS &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  ),

  /** Analytics and error tracking via PostHog. */
  analytics: Boolean(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN),

  // --- Module Gates (Configurable toggles) ---

  /** In-app messaging system. AGENTS.md: WhatsApp is primary contact method. */
  chat: process.env.NEXT_PUBLIC_FEATURE_CHAT === 'true',

  /** Public contact form and ticket submission. */
  tickets: process.env.NEXT_PUBLIC_FEATURE_TICKETS !== 'false', // Enabled by default

  /** User-to-seller reviews and ratings. */
  reviews: process.env.NEXT_PUBLIC_FEATURE_REVIEWS === 'true',

  /** Vehicle comparison UX. */
  compare: process.env.NEXT_PUBLIC_FEATURE_COMPARE === 'true',

  /** Progressive Web App capabilities (manifest, standalone mode guidance). */
  pwa: process.env.NEXT_PUBLIC_FEATURE_PWA === 'true',

  /** Internal advanced analytics for admins. */
  adminAnalytics: process.env.NEXT_PUBLIC_FEATURE_ADMIN_ANALYTICS !== 'false', // Enabled by default
} as const;

export type FeatureFlag = keyof typeof features;
