/**
 * Sentry Error Tracking Integration
 *
 * Free Tier: 5,000 errors/month
 * Setup: https://sentry.io (create project, get DSN)
 *
 * Environment variables required:
 * - NEXT_PUBLIC_SENTRY_DSN (public key - safe for client)
 * - SENTRY_AUTH_TOKEN (server-side, in Vercel env)
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isEnabled = !!SENTRY_DSN && process.env.NODE_ENV === "production";

export function initSentry() {
  if (!isEnabled) {
    console.log("[Sentry] Disabled - DSN not configured");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    // Performance monitoring (free tier includes)
    tracesSampleRate: 0.1, // 10% sample rate - ücretsiz plan limit
    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA || "development",
    // Environment
    environment: process.env.NODE_ENV,
    // Filter out non-errors in logs
    beforeSend(event) {
      // Only send errors and transactions
      if (event.type === "transaction") {
        // Skip transactions shorter than 100ms (noise)
        if (event.spans && event.spans.length < 3) {
          return null;
        }
      }
      return event;
    },
    // Ignore common non-critical errors
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      /Loading chunk \d+ failed/,
    ],
  });

  console.log("[Sentry] Initialized for production");
}

export function captureError(
  error: unknown,
  context: {
    source?: string;
    userId?: string;
    extra?: Record<string, unknown>;
  }
) {
  if (!isEnabled) {
    return;
  }

  Sentry.captureException(error, {
    extra: {
      source: context.source,
      ...context.extra,
    },
    user: context.userId ? { id: context.userId } : undefined,
  });
}

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, unknown>
) {
  if (!isEnabled) {
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

// Type exports for components
export const SentryIntegration = {
  init: initSentry,
  captureError,
  captureMessage,
};

export default Sentry;
