import { NextResponse, type NextRequest } from "next/server";
import { isValidRequestOrigin } from "@/lib/security";

/**
 * Standardized API Security Middleware.
 * Enforces CSRF protection for all mutations.
 */
export function checkApiSecurity(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Only apply to direct /api calls (not Next.js internal /api/auth etc)
  if (pathname.startsWith("/api")) {
    // 1. Force CSRF for all Mutations
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
    
    if (isMutation && !isValidRequestOrigin(request)) {
      return { 
        isValid: false, 
        response: new NextResponse(
          JSON.stringify({ 
            error: "Forbidden", 
            message: "Gecersiz istek kaynagi (CSRF Protection)." 
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        ) 
      };
    }
  }
  
  return { isValid: true };
}
