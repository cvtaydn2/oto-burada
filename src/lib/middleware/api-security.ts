import { type NextRequest, NextResponse } from "next/server";

import { isValidRequestOrigin } from "@/lib/security";

/**
 * Middleware-layer CSRF check for Next.js Edge Runtime.
 *
 * This runs in the global middleware (proxy.ts → updateSession) and operates
 * on NextRequest. It is intentionally separate from the route-handler security
 * helpers in `@/lib/api/security`, which operate on the Web API Request
 * object and run inside individual API routes.
 *
 * Responsibility: Reject cross-origin mutation requests before they reach any
 * route handler.
 */
export function checkApiSecurity(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);

    if (isMutation && !isValidRequestOrigin(request)) {
      return new NextResponse(
        JSON.stringify({
          error: "Forbidden",
          message: "Geçersiz istek kaynağı (CSRF koruması).",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return null;
}
