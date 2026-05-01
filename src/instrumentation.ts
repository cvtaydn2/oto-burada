/**
 * Next.js server-side instrumentation.
 * Handles server-side startup and global error logging.
 */

import * as Sentry from "@sentry/nextjs";

import { logger } from "@/lib/logging/logger";

export async function register() {
  // Validate required environment variables at server startup.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");

    import("./lib/env-validation")
      .then(({ logEnvValidation }) => {
        logEnvValidation();
      })
      .catch((err) => {
        console.error("[Instrumentation] Env validation failed to load", err);
      });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = (
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
  }
) => {
  // Capture error in Sentry
  Sentry.captureRequestError(err, request, context);

  // Log all unhandled server errors to our local logging service
  logger.system.error(`Server Error: ${err.message}`, err, {
    path: request.path,
    method: request.method,
    route_path: context.routePath,
    route_type: context.routeType,
    router_kind: context.routerKind,
    runtime: process.env.NEXT_RUNTIME,
  });
};
