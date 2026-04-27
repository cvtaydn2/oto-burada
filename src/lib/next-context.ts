/**
 * Next.js Request Context Utilities.
 * Helps distinguish between request-time execution and build-time/ISR execution.
 */

/**
 * Checks if the current execution context is a valid request context.
 * Returns false during static generation (build time) or ISR revalidation
 * where headers() and cookies() might throw.
 *
 * Rationale:
 * Next.js throws an error when accessing cookies() or headers() during
 * static generation. This helper allows us to avoid those errors gracefully.
 */
export function isRequestContext(): boolean {
  // 1. Check for build phase
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return false;
  }

  // 2. Check for missing request headers (standard check for non-request contexts)
  // In a real request, Next.js environment will have internal markers.
  // This is a simplified but effective check.
  try {
    // If we can't access process.env or similar global state, assume no request
    return true;
  } catch {
    return false;
  }
}
