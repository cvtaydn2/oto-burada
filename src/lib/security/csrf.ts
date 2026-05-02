/**
 * CSRF Token Protection
 *
 * Implements a Secure Synchronizer Token Pattern using Hashed Cookies.
 *
 * 1. Server generates a RAW token.
 * 2. Server stores SHA-256(RAW token) in an HttpOnly, Secure, SameSite=Strict cookie.
 * 3. Server provides the RAW token to the client (via X-CSRF-Token header or metadata).
 * 4. Client sends the RAW token back in the X-CSRF-Token header.
 * 5. Server hashes the incoming header token and compares it with the cookie hash.
 *
 * This prevents XSS from stealing the validation token (cookie is HttpOnly)
 * and prevents CSRF (attacker can't read the header token due to SOP).
 */

import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { getUserFacingError } from "@/config/user-messages";
import { logger } from "@/lib/logging/logger";

const CSRF_COOKIE_HASH_NAME = "__Host-oto_csrf_v2";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32;

/**
 * Validates the request origin and referer.
 */
export function isValidRequestOrigin(request: Request | NextRequest): boolean {
  const url = new URL(request.url);

  // Webhook exclusion: third-party services won't send valid browser origin/referer
  const isIyzico =
    url.pathname.startsWith("/api/payments/webhook") ||
    url.pathname.startsWith("/api/webhooks/iyzico");
  const isPosthog = url.pathname.startsWith("/api/webhooks/posthog");

  if (isIyzico) {
    if (url.pathname === "/api/payments/webhook" || url.pathname === "/api/webhooks/iyzico") {
      return request.headers.has("x-iyzi-signature");
    }
    return false;
  }

  if (isPosthog) {
    const isDev = process.env.NODE_ENV !== "production";
    const posthogSecret = process.env.POSTHOG_WEBHOOK_SECRET;
    const webhookSecret = request.headers.get("x-posthog-webhook-secret");

    if (isDev && !posthogSecret) return true;
    if (!posthogSecret) {
      logger.security.error("PostHog webhook secret not configured in production");
      return false;
    }

    if (!webhookSecret || webhookSecret.length !== posthogSecret.length) return false;

    let match = true;
    for (let i = 0; i < posthogSecret.length; i++) {
      if (webhookSecret.charCodeAt(i) !== posthogSecret.charCodeAt(i)) match = false;
    }
    return match;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const method = request.method.toUpperCase();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (isMutation && !origin && !referer) return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const checkUrl = (target: string) => {
    try {
      const targetUrl = new URL(target);
      if (appUrl) {
        const appUrlObj = new URL(appUrl);
        if (targetUrl.host === appUrlObj.host) return true;
      }
      const host = request.headers.get("host");
      if (host && targetUrl.host === host) return true;

      if (process.env.NODE_ENV !== "production") {
        const allowedDevOrigins = [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001",
        ];
        if (allowedDevOrigins.includes(targetUrl.origin)) return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  if (origin && origin !== "null" && checkUrl(origin)) return true;
  if (referer && checkUrl(referer)) return true;

  return !isMutation;
}

export function generateCsrfToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH / 2);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashCsrfToken(token: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validates CSRF token from request.
 * Compares the hashed header token with the hash stored in the HttpOnly cookie.
 */
export async function validateCsrfToken(request: Request | NextRequest): Promise<boolean> {
  try {
    const method = request.method.toUpperCase();
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (!isMutation) return true;
    if (!isValidRequestOrigin(request)) return false;

    let cookieHash: string | undefined;
    if ("cookies" in request && typeof request.cookies.get === "function") {
      cookieHash = request.cookies.get(CSRF_COOKIE_HASH_NAME)?.value;
    } else {
      const cookieStore = await cookies();
      cookieHash = cookieStore.get(CSRF_COOKIE_HASH_NAME)?.value;
    }

    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    if (!cookieHash || !headerToken) return false;

    // Hash the incoming header token and compare it with the stored hash
    const incomingHash = await hashCsrfToken(headerToken);
    return constantTimeCompare(cookieHash, incomingHash);
  } catch {
    return false;
  }
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Middleware entry point for CSRF protection.
 */
export async function csrfMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect all API routes except public webhooks
  if (pathname.startsWith("/api")) {
    const isValid = await validateCsrfToken(request);

    if (!isValid) {
      const response = new NextResponse(
        JSON.stringify({
          error: "Forbidden",
          message: getUserFacingError("CSRF_ERROR"),
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );

      const { applySecurityHeaders } = await import("@/lib/middleware/headers");
      return applySecurityHeaders(response, undefined, request);
    }
  }

  return null;
}

export async function setCsrfTokenCookie(): Promise<string> {
  const token = generateCsrfToken();
  const hash = await hashCsrfToken(token);
  const cookieStore = await cookies();

  const isProd = process.env.NODE_ENV === "production";

  // Set the HASH in an HttpOnly cookie (Server-side source of truth)
  cookieStore.set(CSRF_COOKIE_HASH_NAME, hash, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}

/**
 * Rotates the CSRF token. Used upon login/logout.
 */
export async function rotateCsrfToken(): Promise<string> {
  return setCsrfTokenCookie();
}

/**
 * Attaches CSRF cookie and header to a response.
 */
export async function applyCsrfCookieToResponse(response: NextResponse, token?: string) {
  const finalToken = token || generateCsrfToken();
  const hash = await hashCsrfToken(finalToken);
  const isProd = process.env.NODE_ENV === "production";

  // Set the HASH in an HttpOnly cookie
  response.cookies.set(CSRF_COOKIE_HASH_NAME, hash, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  // Set raw token in header for the client to pick up
  response.headers.set(CSRF_HEADER_NAME, finalToken);

  return finalToken;
}

/**
 * Gets the current CSRF token hash from cookies.
 * NOTE: This returns the HASH, not the raw token.
 */
export async function getCsrfHashFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_HASH_NAME)?.value;
}

export const CSRF_HEADER_NAME_CLIENT = CSRF_HEADER_NAME;
export const CSRF_COOKIE_HASH_NAME_CLIENT = CSRF_COOKIE_HASH_NAME;
