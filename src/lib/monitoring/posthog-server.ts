/**
 * PostHog Server Shim.
 * Replaces PostHog with internal logger to maintain compatibility
 * with existing code without requiring a massive refactor.
 */

import { logger } from "@/lib/logging/logger";

export function getPostHogServer() {
  return {
    capture: (event: string, distinctId?: string, props?: Record<string, unknown>) => {
      if (process.env.NODE_ENV === "development") {
        logger.system.info(`[Server Event] ${event} (${distinctId || "anon"})`, props);
      }
    },
    identify: (distinctId: string, props?: Record<string, unknown>) => {
      if (process.env.NODE_ENV === "development") {
        logger.system.info(`[Server Identify] ${distinctId}`, props);
      }
    },
    captureException: (
      error: unknown,
      distinctId?: string,
      options?: { properties?: Record<string, unknown> }
    ) => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.system.error(
        `[Server Exception] ${err.message} (${distinctId || "anon"})`,
        err,
        options?.properties
      );
    },
    flush: async () => {},
  };
}

/**
 * Capture server-side errors using internal logger.
 * Supports flexible arguments to match various call sites.
 */
export function captureServerError(
  message: string,
  context: string,
  error?: unknown,
  data?: Record<string, unknown>,
  ...args: unknown[]
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logCategory = (logger as Record<string, any>)[context] || logger.system;
  logCategory.error(message, error, { ...data, extraArgs: args });
}

export function captureServerWarning(
  message: string,
  context: string,
  data?: Record<string, unknown>,
  ...args: unknown[]
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logCategory = (logger as Record<string, any>)[context] || logger.system;
  logCategory.warn(message, { ...data, extraArgs: args });
}

export function identifyServerUser(
  userId: string,
  properties?: Record<string, unknown>,
  ...args: unknown[]
) {
  if (process.env.NODE_ENV === "development") {
    logger.auth.info(`[Identify] ${userId}`, { ...properties, extraArgs: args });
  }
}

export function trackServerEvent(
  eventName: string,
  propertiesOrId?: string | Record<string, unknown>,
  distinctId?: string,
  ...args: unknown[]
) {
  if (process.env.NODE_ENV === "development") {
    const props = typeof propertiesOrId === "object" ? propertiesOrId : {};
    const id = typeof propertiesOrId === "string" ? propertiesOrId : distinctId || "unknown";
    logger.system.info(`[Event] ${eventName} (User: ${id})`, { ...props, extraArgs: args });
  }
}

/**
 * Capture server-side events using internal logger.
 */
export function captureServerEvent(
  eventName: string,
  properties?: Record<string, unknown>,
  distinctId?: string,
  ...args: unknown[]
) {
  if (process.env.NODE_ENV === "development") {
    logger.system.info(`[Server Event] ${eventName} (${distinctId || "anon"})`, {
      ...properties,
      extraArgs: args,
    });
  }
}
