import { NextResponse } from "next/server";

export function generateNonce() {
  return crypto.randomUUID();
}

const STATIC_CSP_PARTS = [
  "default-src 'self'",
  "font-src 'self' https://fonts.gstatic.com https://unpkg.com https://vercel.live data:",
  `img-src 'self' data: blob: ${process.env.NEXT_PUBLIC_SUPABASE_URL} https://images.unsplash.com https://plus.unsplash.com https://*.pexels.com https://placehold.co https://*.tile.openstreetmap.org https://unpkg.com https://vercel.live https://*.vercel.live https://*.public.blob.vercel-storage.com`,
  `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL} wss://${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "")} https://nominatim.openstreetmap.org https://*.upstash.io https://vercel.live wss://ws-us3.pusher.com https://challenges.cloudflare.com https://*.vercel-analytics.com https://*.vercel-insights.com`,
  "worker-src 'self' blob:",
  `media-src 'self' blob: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src https://vercel.live https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

export function getSecurityHeaders(nonce: string) {
  const isProduction = process.env.NODE_ENV === "production";
  const scriptSrc = [
    "'self'",
    "https://va.vercel-scripts.com",
    "https://cdn.vercel-insights.com",
    "https://vercel.live",
    "https://*.vercel.live",
    "https://challenges.cloudflare.com",
  ];
  const styleSrc = [
    "'self'",
    "https://fonts.googleapis.com",
    "https://unpkg.com",
    "'unsafe-inline'",
  ];

  if (isProduction) {
    // Only use nonces in production for maximum security on scripts
    scriptSrc.push(`'nonce-${nonce}'`);
    // We intentionally DO NOT add nonce to styleSrc.
    // Adding nonce to styleSrc causes modern browsers to ignore 'unsafe-inline',
    // which breaks Next.js App Router, Radix UI, and inline React styles.
  }

  // ── PERFORMANCE FIX: Issue PERF-04 - Strict CSP in Development ─────────────
  // Development should also use strict CSP to catch XSS issues early.
  // Only add unsafe-eval for HMR (Hot Module Replacement) in development.
  // unsafe-inline is never needed with nonce-based CSP.
  if (!isProduction) {
    // HMR and dev-tools require unsafe-eval and unsafe-inline
    scriptSrc.push("'unsafe-eval'");
    scriptSrc.push("'unsafe-inline'");
    // Note: In dev, we omit the nonce from style-src so that 'unsafe-inline' is NOT ignored by the browser.
  }

  const csp = [
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    STATIC_CSP_PARTS,
  ].join("; ");

  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": csp,
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Resource-Policy": "same-origin",
    "x-nonce": nonce,
  };
}

export function applySecurityHeaders(response: NextResponse, nonce?: string, request?: Request) {
  const activeNonce = nonce || generateNonce();
  const headers = getSecurityHeaders(activeNonce);

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  // ── RATE-LIMIT HEADERS: Forward stored rate-limit info if request is provided ──
  if (request) {
    const rlLimit = request.headers.get("x-ratelimit-limit");
    const rlRemaining = request.headers.get("x-ratelimit-remaining");
    const rlReset = request.headers.get("x-ratelimit-reset");

    if (rlLimit) {
      response.headers.set("X-RateLimit-Limit", rlLimit);
      response.headers.set("X-RateLimit-Remaining", rlRemaining ?? "0");

      // Convert reset timestamp from ms to seconds for standard compliance
      if (rlReset) {
        const resetSeconds = Math.ceil(parseInt(rlReset) / 1000);
        response.headers.set("X-RateLimit-Reset", resetSeconds.toString());
      }
    }
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
