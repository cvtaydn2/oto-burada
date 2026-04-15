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
    ph.captureException(error, distinctId ?? "server", { properties });
  } else {
    ph.capture({
      distinctId: distinctId ?? "server",
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
