import * as Sentry from "@sentry/nextjs";

import { logger } from "@/features/shared/lib/logger";

export const COOKIE_CONSENT_STORAGE_KEY = "cookie-consent";

const isSentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

export const telemetry = {
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

    if (isSentryEnabled) {
      Sentry.captureException(error, {
        extra: options?.properties,
        tags: { source: "client-telemetry-shim" },
      });
    }

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

export function syncTelemetryConsent() {}

export function identifyTelemetryUser(id: string, props?: Record<string, unknown>) {
  if (isSentryEnabled) {
    Sentry.setUser({ id, ...props });
  }

  telemetry.identify(id, props);
}

export function resetTelemetryUser() {
  if (isSentryEnabled) {
    Sentry.setUser(null);
  }

  telemetry.reset();
}

export function captureTelemetryPageView(url: string) {
  if (process.env.NODE_ENV === "development") {
    logger.ui.info(`[Page View] ${url}`);
  }
}

export function captureClientEvent(event: string, props?: Record<string, unknown>) {
  telemetry.capture(event, props);
}

export function captureClientException(
  err: unknown,
  context: string,
  props?: Record<string, unknown>
) {
  const error = err instanceof Error ? err : new Error(String(err));

  if (isSentryEnabled) {
    Sentry.captureException(error, {
      extra: props,
      tags: { context, source: "client" },
    });
  }

  logger.ui.error(`[${context}] Client error`, error, props);
}
