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
export async function isRequestContext(): Promise<boolean> {
  // Build-time/SSG context should never be treated as live request context.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return false;
  }

  try {
    // next/headers request store is only available during an active request.
    const { cookies } = await import("next/headers");
    await cookies();
    return true;
  } catch {
    return false;
  }
}
