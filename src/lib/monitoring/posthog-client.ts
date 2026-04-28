/**
 * PostHog Client Shim.
 * Routes all client-side monitoring to internal logger.
 */

import { logger } from "@/lib/logging/logger";

export const COOKIE_CONSENT_STORAGE_KEY = "cookie-consent";

export const posthog = {
  capture: (event: string, props?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      logger.ui.info(`[Client Event] ${event}`, props);
    }
  },
  identify: (id: string, props?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      logger.ui.info(`[Client Identify] ${id}`, props);
    }
  },
  reset: () => {},
  opt_in_capturing: () => {},
  opt_out_capturing: () => {},
  has_opted_out_capturing: () => false,
  captureException: (err: unknown, options?: { properties?: Record<string, unknown> }) => {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.ui.error(`[Client Exception] ${error.message}`, error, options?.properties);
  },
};

export function getCookieConsent() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
}

export function setCookieConsent(accepted: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, String(accepted));
}

export function syncPostHogConsent() {}
export function identifyPostHogUser(id: string, props?: Record<string, unknown>) {
  posthog.identify(id, props);
}
export function resetPostHogUser() {
  posthog.reset();
}
export function capturePostHogPageView(url: string) {
  if (process.env.NODE_ENV === "development") {
    logger.ui.info(`[Page View] ${url}`);
  }
}
export function captureClientEvent(event: string, props?: Record<string, unknown>) {
  posthog.capture(event, props);
}
export function captureClientException(
  err: unknown,
  context: string,
  props?: Record<string, unknown>
) {
  const error = err instanceof Error ? err : new Error(String(err));
  logger.ui.error(`[${context}] Client error`, error, props);
}
