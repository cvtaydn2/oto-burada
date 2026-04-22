"use client";

import posthog from "posthog-js";

export { posthog };

export const COOKIE_CONSENT_STORAGE_KEY = "cookie-consent";

export function getCookieConsent() {
  if (typeof window === "undefined") {
    return null;
  }

  const consent = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  return consent === "true" || consent === "false" ? consent : null;
}

export function hasCookieConsent() {
  return getCookieConsent() === "true";
}

export function syncPostHogConsent() {
  const consent = getCookieConsent();

  if (consent === "true") {
    if (posthog.has_opted_out_capturing()) {
      posthog.opt_in_capturing();
    }
    return;
  }

  if (consent === "false" && !posthog.has_opted_out_capturing()) {
    posthog.opt_out_capturing();
  }
}

export function setCookieConsent(consentGranted: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    COOKIE_CONSENT_STORAGE_KEY,
    consentGranted ? "true" : "false",
  );
  syncPostHogConsent();
}

export function captureClientEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    posthog.capture(eventName, properties);
  }
}

export function captureClientException(
  error: unknown,
  context: string,
  properties?: Record<string, unknown>,
) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: Record<string, unknown> = {
    context,
    ...properties,
  };

  if (error instanceof Error) {
    posthog.captureException(error, { properties: payload });
    return;
  }

  posthog.capture("$exception", {
    ...payload,
    error_raw: String(error),
  });
}

export function identifyPostHogUser(
  userId: string,
  properties?: Record<string, unknown>,
) {
  posthog.identify(userId, properties);
}

export function resetPostHogUser() {
  posthog.reset();
}

export function capturePostHogPageView(url: string) {
  if (!hasCookieConsent() || posthog.has_opted_out_capturing()) {
    return;
  }

  posthog.capture("$pageview", { $current_url: url });
}
