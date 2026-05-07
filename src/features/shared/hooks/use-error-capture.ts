"use client";

import { useCallback } from "react";

import { logger } from "@/features/shared/lib/logger";

/**
 * Client-side error capture hook.
 * Logs errors to our internal logger.
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

      logger.ui.error(
        `[${context}]${action ? ` ${action}` : ""} failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
        properties
      );
    },
    [context]
  );

  const captureFailure = useCallback(
    (event: string, message: string, extra?: Record<string, unknown>) => {
      logger.ui.warn(`[${context}] ${event} failed: ${message}`, {
        ...extra,
        status: "failed",
      });
    },
    [context]
  );

  const captureSuccess = useCallback(
    (event: string, extra?: Record<string, unknown>) => {
      logger.ui.info(`[${context}] ${event} succeeded`, {
        ...extra,
        status: "succeeded",
      });
    },
    [context]
  );

  return { captureError, captureFailure, captureSuccess };
}
