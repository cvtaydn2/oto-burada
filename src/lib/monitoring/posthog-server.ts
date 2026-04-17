import { PostHog } from "posthog-node";

let posthogInstance: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!token) return null;

  if (!posthogInstance) {
    posthogInstance = new PostHog(token, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,       // flush immediately — important for serverless
      flushInterval: 0,
    });
  }

  return posthogInstance;
}

/**
 * Capture a server-side exception in PostHog.
 * Use in server actions and API routes.
 *
 * @example
 * captureServerError("DB query failed", "database", error, { table: "listings" })
 */
export function captureServerError(
  message: string,
  context: string,
  error?: unknown,
  data?: Record<string, unknown>,
  distinctId?: string,
) {
  const ph = getPostHogServer();
  if (!ph) return;

  const derivedDistinctId =
    distinctId ??
    (typeof data?.userId === "string"
      ? data.userId
      : typeof data?.user_id === "string"
        ? data.user_id
        : "server");

  const properties: Record<string, unknown> = {
    context,
    message,
    environment: process.env.NODE_ENV,
    ...data,
  };

  if (error instanceof Error) {
    properties.error_name = error.name;
    properties.error_message = error.message;
    properties.error_stack_first_line = error.stack?.split("\n")[1]?.trim();
  } else if (error) {
    properties.error_raw = String(error);
  }

  if (error instanceof Error) {
    ph.captureException(error, derivedDistinctId, { properties });
  } else {
    ph.capture({
      distinctId: derivedDistinctId,
      event: "$exception",
      properties,
    });
  }

  ph.flush().catch(() => {});
}

/**
 * Capture a server-side warning in PostHog.
 */
export function captureServerWarning(
  message: string,
  context: string,
  data?: Record<string, unknown>,
) {
  const ph = getPostHogServer();
  if (!ph) return;

  ph.capture({
    distinctId: "server",
    event: "server_warning",
    properties: {
      context,
      message,
      environment: process.env.NODE_ENV,
      ...data,
    },
  });

  ph.flush().catch(() => {});
}

export function captureServerEvent(
  event: string,
  properties?: Record<string, unknown>,
  distinctId?: string,
) {
  const ph = getPostHogServer();
  if (!ph) return;

  const derivedDistinctId =
    distinctId ??
    (typeof properties?.userId === "string"
      ? properties.userId
      : typeof properties?.user_id === "string"
        ? properties.user_id
        : "server");

  ph.capture({
    distinctId: derivedDistinctId,
    event,
    properties: {
      environment: process.env.NODE_ENV,
      ...properties,
    },
  });

  ph.flush().catch(() => {});
}

/**
 * Type-safe server event tracking using the Event Dictionary.
 * Use this for new code; the untyped `captureServerEvent` above is kept
 * for backward compatibility with existing call sites.
 */
import { AnalyticsEvent, type EventPayload } from "@/lib/analytics/events";

export function trackServerEvent<T extends AnalyticsEvent>(
  event: T,
  properties: EventPayload<T>,
  distinctId?: string,
) {
  captureServerEvent(event, properties as Record<string, unknown>, distinctId);
}

export { AnalyticsEvent };

