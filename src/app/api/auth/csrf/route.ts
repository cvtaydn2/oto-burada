import { NextResponse } from "next/server";

import { setCsrfTokenCookie } from "@/lib/security/csrf";

/**
 * GET /api/auth/csrf
 * Returns a valid CSRF token.
 * Since the cookie is now httpOnly (security hardening), the client must fetch the token
 * via this endpoint and include it in the X-CSRF-Token header for mutations.
 */
export async function GET() {
  const token = await setCsrfTokenCookie();

  return NextResponse.json({
    success: true,
    data: {
      token,
    },
  });
}
