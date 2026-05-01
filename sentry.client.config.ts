import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled:
    process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SENTRY_IN_DEV === "true",
  // Performance monitoring
  tracesSampleRate: 0.1,
  
  // Session replay (free tier limit: 10k sessions)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
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
      if (errObj.name === "ZodError" || errObj.name === "NotFoundError" || errObj.digest === "NEXT_NOT_FOUND") {
        return null;
      }
    }

    // Performance monitoring (free tier includes)
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
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    /Loading chunk \d+ failed/,
    'Network Error',
    'Failed to fetch',
  ],

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

export default Sentry;
