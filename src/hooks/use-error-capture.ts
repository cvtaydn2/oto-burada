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
    (error: unknown, action?: string, extra?: Record<string, unknown>) => {
      const properties: Record<string, unknown> = { context, ...extra };
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

  const captureFailure = useCallback(
    (event: string, message: string, extra?: Record<string, unknown>) => {
      posthog.capture(event, {
        context,
        message,
        status: "failed",
        ...extra,
      });
    },
    [context],
  );

  const captureSuccess = useCallback(
    (event: string, extra?: Record<string, unknown>) => {
      posthog.capture(event, {
        context,
        status: "succeeded",
        ...extra,
      });
    },
    [context],
  );

  return { captureError, captureFailure, captureSuccess };
}
