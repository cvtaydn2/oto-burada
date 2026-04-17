/**
 * Feature flags — env-var-based, no external dependency.
 *
 * A feature is "on" when its required env var(s) are set.
 * This keeps the pattern simple and consistent with the rest of the codebase.
 *
 * Usage:
 *   import { features } from "@/lib/features";
 *   if (!features.payments) return apiError(...);
 *
 * To enable a feature: set the env var in Vercel Project Settings and redeploy.
 * See RUNBOOK.md → Feature Flags for details.
 */

export const features = {
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
} as const;

export type FeatureFlag = keyof typeof features;
