import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Performance monitoring
  tracesSampleRate: 0.1,
  
  // Session replay (free tier limit: 10k sessions)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Ignore common non-critical errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    /Loading chunk \d+ failed/,
  ],
});

export default Sentry;