"use client";

import { useCallback } from "react";
import posthog from "posthog-js";

/**
 * Client-side error capture hook.
 * Sends errors to PostHog and returns them for local handling.
 *
 * Usage:
 *   const { captureError } = useErrorCapture("brands-manager");
 *   try { ... } catch (err) { captureError(err, "handleAddBrand"); throw err; }
 */
export function useErrorCapture(context: string) {
  const captureError = useCallback(
    (error: unknown, action?: string) => {
      const properties: Record<string, string> = { context };
      if (action) properties.action = action;

      if (error instanceof Error) {
        posthog.captureException(error, { properties });
      } else {
        posthog.capture("$exception", {
          error_raw: String(error),
          ...properties,
        });
      }
    },
    [context],
  );

  return { captureError };
}
