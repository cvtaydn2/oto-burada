import { NextResponse, type NextRequest } from "next/server";

export function checkApiSecurity(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  if (pathname.startsWith("/api") && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (origin) {
      let originHost: string | null = null;
      try {
        originHost = new URL(origin).host;
      } catch {
        return { 
          isValid: false, 
          response: new NextResponse(
            JSON.stringify({ error: "Invalid origin" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          ) 
        };
      }

      const isLocalhost = originHost.startsWith("localhost") || originHost.startsWith("127.0.0.1");

      if (process.env.NODE_ENV === "production" && appUrl) {
        const allowedHost = new URL(appUrl).host;
        if (originHost !== allowedHost) {
          return { 
            isValid: false, 
            response: new NextResponse(
              JSON.stringify({ error: "Invalid origin" }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            ) 
          };
        }
      } else if (!isLocalhost && host && originHost !== host) {
        return { 
          isValid: false, 
          response: new NextResponse(
            JSON.stringify({ error: "CSRF mismatch" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          ) 
        };
      }
    }
  }
  
  return { isValid: true };
}
