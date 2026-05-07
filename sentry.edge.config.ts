// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production" || process.env.ENABLE_SENTRY_IN_DEV === "true",

  // Performance monitoring
  tracesSampleRate: 0.1,

  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,

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
      if (errObj.name === "ZodError" || errObj.name === "NotFoundError" || errObj.digest === "NEXT_NOT_FOUND") {
        return null;
      }
    }

    return event;
  },

  // Enable sending user PII (Personally Identifiable Information)
  sendDefaultPii: true,
});

