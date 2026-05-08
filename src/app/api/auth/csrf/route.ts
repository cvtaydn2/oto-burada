import { NextResponse } from "next/server";

import { setCsrfTokenCookie } from "@/lib/csrf";

/**
 * GET /api/auth/csrf
 * Returns a valid CSRF token.
 * Double Submit Cookie pattern requires the client to fetch the token
 * via this endpoint and include it in the X-CSRF-Token header for mutations.
 */
export async function GET() {
  const token = await setCsrfTokenCookie();

  const response = NextResponse.json({
    success: true,
    data: {
      token,
    },
  });

  // Apply security headers to this sensitive endpoint
  const { applySecurityHeaders } = await import("@/lib/headers");
  applySecurityHeaders(response);

  // Also return token in header as requested for improved security pattern
  const { CSRF_HEADER_NAME_CLIENT } = await import("@/lib/csrf");
  response.headers.set(CSRF_HEADER_NAME_CLIENT, token);

  return response;
}
