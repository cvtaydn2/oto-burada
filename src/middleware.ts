import { type NextRequest } from "next/server";

import { runMiddlewarePipeline } from "@/lib/middleware/pipeline";
import { rateLimitMiddleware } from "@/lib/middleware/rate-limit";
import { csrfMiddleware } from "@/lib/security/csrf";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Global Middleware for OtoBurada.
 * Order of operations:
 * 1. Global Rate Limiting (Edge/Redis)
 * 2. CSRF Protection for API Mutations
 * 3. Auth Session Management & Route Guards
 *
 * Next.js requires this file to be named `middleware.ts` and export `middleware` function.
 */
export async function middleware(request: NextRequest) {
  return await runMiddlewarePipeline(request, [rateLimitMiddleware, csrfMiddleware, updateSession]);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
