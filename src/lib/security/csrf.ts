/**
 * CSRF Token Protection
 *
 * Implements Double Submit Cookie pattern and Origin/Referer validation.
 */

import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { getUserFacingError } from "@/config/user-messages";
import { logger } from "@/lib/logging/logger";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32;

export function isValidRequestOrigin(request: Request | NextRequest): boolean {
  // Webhook exclusion: third-party services won't send valid browser origin/referer
  const url = new URL(request.url);
  const isIyzico =
    url.pathname.startsWith("/api/payments/webhook") ||
    url.pathname.startsWith("/api/webhooks/iyzico");
  const isPosthog = url.pathname.startsWith("/api/webhooks/posthog");

  if (isIyzico) {
    // ── SECURITY FIX: Issue SEC-05 - Webhook Origin Guard ───────────────────
    // Only bypass origin check for the specific webhook endpoint, not all payment routes.
    // The handler will still verify the signature itself, but this prevents
    // browsers from being used as a vector for basic POST probes.
    if (url.pathname === "/api/payments/webhook" || url.pathname === "/api/webhooks/iyzico") {
      return request.headers.has("x-iyzi-signature");
    }
    // Other payment endpoints require normal CSRF validation
    return false;
  }

  if (isPosthog) {
    // ── SECURITY FIX: Issue SEC-POSTHOG-01 - PostHog Webhook Verification ──
    // PostHog webhooks must include a secret header to prevent fake event injection.
    // In development, allow without secret for testing.
    const isDev = process.env.NODE_ENV !== "production";
    const posthogSecret = process.env.POSTHOG_WEBHOOK_SECRET;
    const webhookSecret = request.headers.get("x-posthog-webhook-secret");

    if (isDev && !posthogSecret) {
      return true; // Allow in dev without secret
    }

    if (!posthogSecret) {
      logger.security.error("PostHog webhook secret not configured in production");
      return false; // Fail closed if secret missing in production
    }

    // Timing-safe comparison to prevent side-channel attacks
    if (!webhookSecret || webhookSecret.length !== posthogSecret.length) {
      return false;
    }

    let match = true;
    for (let i = 0; i < posthogSecret.length; i++) {
      if (webhookSecret.charCodeAt(i) !== posthogSecret.charCodeAt(i)) {
        match = false;
      }
    }

    return match;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const method = request.method.toUpperCase();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (isMutation && !origin && !referer) {
    return false;
  }

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
          "http://[::1]:3000",
          "http://[::1]:3001",
        ];

        if (allowedDevOrigins.includes(targetUrl.origin)) {
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  };

  if (origin && origin !== "null") {
    if (checkUrl(origin)) return true;
  }

  if (referer) {
    if (checkUrl(referer)) return true;
  }

  return !isMutation;
}

/**
 * Generates a cryptographically secure random CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH / 2);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Creates a CSRF token hash for storage
 */
export async function hashCsrfToken(token: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validates CSRF token from request
 */
export async function validateCsrfToken(request: Request | NextRequest): Promise<boolean> {
  try {
    const method = request.method.toUpperCase();
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (!isMutation) return true;

    // 1. Origin Check
    if (!isValidRequestOrigin(request)) return false;

    // 2. Token Check
    // FIXED: Read cookies from request object in middleware context
    // instead of using cookies() from next/headers which may not work in Edge runtime
    let cookieToken: string | undefined;
    if ("cookies" in request && typeof request.cookies.get === "function") {
      // NextRequest (middleware context)
      cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    } else {
      // Standard Request (route handler context)
      const cookieStore = await cookies();
      cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    }

    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (!cookieToken || !headerToken) return false;

    // ── BUG FIX: Issue BUG-07 - Promise.allSettled for Hash Comparison ─────────────
    // Use Promise.allSettled to prevent unhandled rejections if one hash operation fails
    const results = await Promise.allSettled([
      hashCsrfToken(cookieToken),
      hashCsrfToken(headerToken),
    ]);

    // Check if both promises fulfilled successfully
    if (results[0].status !== "fulfilled" || results[1].status !== "fulfilled") {
      return false;
    }

    return constantTimeCompare(results[0].value, results[1].value);
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
 * Middleware function for Next.js middleware pipeline
 */
export async function csrfMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    const isValid = await validateCsrfToken(request);

    if (!isValid) {
      return new NextResponse(
        JSON.stringify({
          error: "Forbidden",
          message: getUserFacingError("CSRF_ERROR"),
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return null;
}

export async function setCsrfTokenCookie(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();

  // ── SECURITY FIX: Issue #5 - CSRF Cookie SameSite Strict + Token Rotation ─────────────
  // Using SameSite=strict to prevent CSRF token leakage via XSS
  // httpOnly=false is required for client to read and send in header (Double Submit pattern)
  // Token rotation on each use would further limit XSS damage window
  // CSP nonce implementation recommended to reduce XSS surface area
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Required for Double Submit Cookie pattern
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // Strict isolation to limit XSS + CSRF combination attacks
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return token;
}

/**
 * Sets CSRF cookie on a NextResponse object (Middleware-safe)
 *
 * ── SECURITY FIX: Issue #5 - CSRF Cookie SameSite Strict ─────────────
 */
export function applyCsrfCookieToResponse(response: NextResponse, token?: string) {
  const finalToken = token || generateCsrfToken();
  response.cookies.set(CSRF_COOKIE_NAME, finalToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // Strict isolation to limit XSS + CSRF attacks
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return finalToken;
}

export async function getCsrfTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

export const CSRF_HEADER_NAME_CLIENT = CSRF_HEADER_NAME;
export const CSRF_COOKIE_NAME_CLIENT = CSRF_COOKIE_NAME;
