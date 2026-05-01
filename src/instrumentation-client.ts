// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    "https://be1df2a196e1565d42a5e648819dbc0e@o4511202895790080.ingest.us.sentry.io/4511202899787776",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Performance monitoring
  tracesSampleRate: 0.1,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Filter out non-errors in logs
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Do not capture validation errors or 4xx errors
    if (error && typeof error === "object") {
      const errObj = error as Record<string, unknown>;
      const status = errObj.status || errObj.statusCode;
      if (typeof status === "number" && status >= 400 && status < 500) {
        return null;
      }

      // Specifically filter Zod errors and Next.js Not Found
      if (
        errObj.name === "ZodError" ||
        errObj.name === "NotFoundError" ||
        errObj.digest === "NEXT_NOT_FOUND"
      ) {
        return null;
      }
    }

    return event;
  },

  // Session replay settings
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
