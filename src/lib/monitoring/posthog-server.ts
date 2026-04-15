import { PostHog } from "posthog-node";

let client: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;

  if (!client) {
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,   // flush immediately in serverless
      flushInterval: 0,
    });
  }

  return client;
}

/**
 * Capture a server-side error event in PostHog.
 * Automatically called by logger.ts on error/warn level.
 */
export function captureServerError(
  message: string,
  context: string,
  error?: unknown,
  data?: Record<string, unknown>,
) {
  const ph = getPostHogClient();
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
    // Don't send full stack to PostHog — too noisy
    properties.error_stack_first_line = error.stack?.split("\n")[1]?.trim();
  } else if (error) {
    properties.error_raw = String(error);
  }

  // Use a system user ID for server-side events
  ph.capture({
    distinctId: "server",
    event: "$exception",
    properties,
  });

  // Don't await — fire and forget in serverless
  ph.flush().catch(() => {});
}

export function captureServerWarning(
  message: string,
  context: string,
  data?: Record<string, unknown>,
) {
  const ph = getPostHogClient();
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
