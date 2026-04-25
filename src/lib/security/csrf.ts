/**
 * CSRF Token Protection
 *
 * Implements Double Submit Cookie pattern and Origin/Referer validation.
 */

import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32;

/**
 * Returns true when the request origin is acceptable.
 */
export function isValidRequestOrigin(request: Request | NextRequest): boolean {
  // Webhook exclusion: third-party services won't send valid browser origin/referer
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/webhooks/") || url.pathname === "/api/payments/webhook") {
    return true;
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
        const allowedDevHosts = ["localhost", "127.0.0.1", "[::1]", "::1"];
        const allowedDevPorts = ["3000", "3001"];

        const targetHost = targetUrl.hostname;
        const targetPort = targetUrl.port || (targetUrl.protocol === "https:" ? "443" : "80");

        if (allowedDevHosts.includes(targetHost) && allowedDevPorts.includes(targetPort)) {
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
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (!cookieToken || !headerToken) return false;

    const [hashedCookie, hashedHeader] = await Promise.all([
      hashCsrfToken(cookieToken),
      hashCsrfToken(headerToken),
    ]);

    return constantTimeCompare(hashedCookie, hashedHeader);
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
          message: "Geçersiz istek kaynağı veya CSRF token (CSRF koruması).",
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

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return token;
}

export async function getCsrfTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

export const CSRF_HEADER_NAME_CLIENT = CSRF_HEADER_NAME;
export const CSRF_COOKIE_NAME_CLIENT = CSRF_COOKIE_NAME;
