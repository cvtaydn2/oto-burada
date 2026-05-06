import * as Sentry from "@sentry/nextjs";

import { logger } from "@/lib/logging/logger";

const isSentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
const isTest = process.env.NODE_ENV === "test";

type TelemetryTestEvent = {
  type: "capture" | "identify" | "exception" | "event" | "server_event";
  name: string;
  distinctId?: string;
  properties?: Record<string, unknown>;
};

const telemetryTestSink: TelemetryTestEvent[] = [];

function pushTelemetryTestEvent(event: TelemetryTestEvent) {
  if (isTest) telemetryTestSink.push(event);
}

export function getTelemetryTestEvents() {
  return [...telemetryTestSink];
}

export function clearTelemetryTestEvents() {
  telemetryTestSink.length = 0;
}

export function getTelemetryServer() {
  return {
    capture: (event: string, distinctId?: string, props?: Record<string, unknown>) => {
      pushTelemetryTestEvent({
        type: "capture",
        name: event,
        distinctId,
        properties: props,
      });

      if (process.env.NODE_ENV === "development") {
        logger.system.info(`[Server Event] ${event} (${distinctId || "anon"})`, props);
      }
    },
    identify: (distinctId: string, props?: Record<string, unknown>) => {
      if (isSentryEnabled) {
        Sentry.setUser({ id: distinctId, ...props });
      }

      pushTelemetryTestEvent({ type: "identify", name: "identify", distinctId, properties: props });

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

      if (isSentryEnabled) {
        Sentry.captureException(err, {
          extra: options?.properties,
          user: distinctId ? { id: distinctId } : undefined,
          tags: { source: "server-telemetry" },
        });
      }

      pushTelemetryTestEvent({
        type: "exception",
        name: err.message,
        distinctId,
        properties: options?.properties,
      });

      logger.system.error(
        `[Server Exception] ${err.message} (${distinctId || "anon"})`,
        err,
        options?.properties
      );
    },
    flush: async () => {},
  };
}

export function captureServerError(
  message: string,
  context: string,
  error?: unknown,
  data?: Record<string, unknown>,
  ...args: unknown[]
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logCategory = (logger as Record<string, any>)[context] || logger.system;

  if (error && isSentryEnabled) {
    Sentry.captureException(error, {
      extra: {
        message,
        ...data,
        extraArgs: args,
      },
      tags: { context, source: "server" },
    });
  }

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

  if (isSentryEnabled) {
    Sentry.captureMessage(message, {
      level: "warning",
      extra: { context, ...data, extraArgs: args },
    });
  }

  logCategory.warn(message, { ...data, extraArgs: args });
}

export function identifyServerUser(
  userId: string,
  properties?: Record<string, unknown>,
  ...args: unknown[]
) {
  if (isSentryEnabled) {
    Sentry.setUser({ id: userId, ...properties });
  }

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
  const props = typeof propertiesOrId === "object" ? propertiesOrId : {};
  const id = typeof propertiesOrId === "string" ? propertiesOrId : distinctId || "unknown";

  pushTelemetryTestEvent({ type: "event", name: eventName, distinctId: id, properties: props });

  if (process.env.NODE_ENV === "development") {
    logger.system.info(`[Event] ${eventName} (User: ${id})`, { ...props, extraArgs: args });
  }
}

export function captureServerEvent(
  eventName: string,
  properties?: Record<string, unknown>,
  distinctId?: string,
  ...args: unknown[]
) {
  pushTelemetryTestEvent({
    type: "server_event",
    name: eventName,
    distinctId,
    properties: { ...properties, extraArgs: args },
  });

  if (process.env.NODE_ENV === "development") {
    logger.system.info(`[Server Event] ${eventName} (${distinctId || "anon"})`, {
      ...properties,
      extraArgs: args,
    });
  }
}
