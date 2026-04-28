/**
 * Next.js server-side instrumentation.
 * Handles server-side startup and global error logging.
 */

import { logger } from "@/lib/logging/logger";

export function register() {
  // Validate required environment variables at server startup.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    import("./lib/env-validation")
      .then(({ logEnvValidation }) => {
        logEnvValidation();
      })
      .catch((err) => {
        console.error("[Instrumentation] Env validation failed to load", err);
      });
  }
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
  }
) => {
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
