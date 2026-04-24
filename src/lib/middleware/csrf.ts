import { type NextRequest, NextResponse } from "next/server";

import { isValidRequestOrigin } from "@/lib/security";

/**
 * CSRF Protection Middleware.
 * Rejects cross-origin mutation requests (POST, PUT, PATCH, DELETE) to API routes.
 */
export async function csrfMiddleware(request: NextRequest) {
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
