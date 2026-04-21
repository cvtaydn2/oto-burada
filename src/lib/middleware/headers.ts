import { NextResponse } from "next/server";

export function generateNonce() {
  return crypto.randomUUID();
}

export function getSecurityHeaders(nonce: string) {
  const isProduction = process.env.NODE_ENV === "production";
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "https://va.vercel-scripts.com",
    "https://cdn.vercel-insights.com",
    "https://vercel.live",
    "https://*.posthog.com",
    "https://us-assets.i.posthog.com",
  ];
  const styleSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "https://fonts.googleapis.com",
    "https://unpkg.com",
  ];

  if (!isProduction) {
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'");
    styleSrc.push("'unsafe-inline'");
  }

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    "font-src 'self' https://fonts.gstatic.com https://unpkg.com https://vercel.live",
    "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.tile.openstreetmap.org https://unpkg.com https://vercel.live",
    "connect-src 'self' https://*.supabase.co https://*.posthog.com https://us-assets.i.posthog.com wss://*.supabase.co https://nominatim.openstreetmap.org https://*.upstash.io https://vercel.live wss://ws-us3.pusher.com",
    "worker-src 'self' blob:",
    "media-src 'self' blob: https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src https://vercel.live",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": csp,
    "x-nonce": nonce,
  };
}

export function applySecurityHeaders(response: NextResponse, nonce?: string) {
  const activeNonce = nonce || generateNonce();
  const headers = getSecurityHeaders(activeNonce);

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  
  return response;
}

export function applyRequestMetadata(request: Request, response: NextResponse, pathname: string) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  response.headers.set("x-request-id", requestId);
  response.headers.set("Cache-Control", "private, max-age=0, no-cache");
  response.headers.set("x-pathname", pathname);
  return response;
}
