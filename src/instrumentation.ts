/**
 * Next.js server-side instrumentation.
 * onRequestError captures ALL unhandled server errors to PostHog:
 *   - API route crashes
 *   - Server action failures
 *   - Server component render errors
 *   - Middleware errors
 *
 * Docs: https://posthog.com/docs/error-tracking/installation/nextjs
 */

export function register() {
  // No-op — PostHog server client initializes lazily
}

export const onRequestError = async (
  err: Error,
  request: {
    path: string;
    method: string;
    headers: Record<string, string | string[] | undefined>;
  },
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
  },
) => {
  // Only run in Node.js runtime — PostHog Node SDK doesn't support Edge
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { getPostHogServer } = await import("./lib/monitoring/posthog-server");
    const posthog = getPostHogServer();
    if (!posthog) return;

    // Extract PostHog distinct_id from cookie to link error to a specific user
    let distinctId: string | undefined;
    const cookieHeader = request.headers.cookie;
    if (cookieHeader) {
      const cookieString = Array.isArray(cookieHeader)
        ? cookieHeader.join("; ")
        : cookieHeader;

      // PostHog cookie format: ph_<token>_posthog=<encoded JSON>
      const match = cookieString.match(/ph_phc_.*?_posthog=([^;]+)/);
      if (match?.[1]) {
        try {
          const decoded = decodeURIComponent(match[1]);
          const parsed = JSON.parse(decoded) as { distinct_id?: string };
          distinctId = parsed.distinct_id;
        } catch {
          // Cookie parse failed — fall back to anonymous
        }
      }
    }

    await posthog.captureException(err, distinctId ?? "server", {
      properties: {
        path: request.path,
        method: request.method,
        route_path: context.routePath,
        route_type: context.routeType,
        router_kind: context.routerKind,
        environment: process.env.NODE_ENV,
      },
    });

    await posthog.flush();
  } catch {
    // Never let monitoring crash the app
  }
};
