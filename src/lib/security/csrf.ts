/**
 * CSRF Token Protection
 *
 * Implements Double Submit Cookie pattern for CSRF protection.
 *
 * Usage:
 * 1. Server generates a CSRF token and sets it as a cookie
 * 2. Client reads the cookie and sends it back in X-CSRF-Token header
 * 3. Server validates that both values match
 */

import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32;

/**
 * Generates a cryptographically secure random CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(TOKEN_LENGTH).toString("hex").slice(0, TOKEN_LENGTH);
}

/**
 * Creates a CSRF token hash for storage
 */
export function hashCsrfToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Validates CSRF token from request
 *
 * @param request - The incoming request
 * @returns true if valid, false otherwise
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  try {
    // Only validate mutation methods
    const method = request.method.toUpperCase();
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (!isMutation) {
      return true;
    }

    // Get token from cookie
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

    if (!cookieToken) {
      return false;
    }

    // Get token from header
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (!headerToken) {
      return false;
    }

    // Compare tokens using constant-time comparison
    const cookieHash = hashCsrfToken(cookieToken);
    const headerHash = hashCsrfToken(headerToken);

    return constantTimeCompare(cookieHash, headerHash);
  } catch {
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Sets CSRF token cookie on response
 *
 * Note: This function cannot be used in API routes directly as they don't have
 * access to the cookies() API. Instead, use the cookieStore from request context.
 */
export async function setCsrfTokenCookie(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by client-side JS
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}

/**
 * Gets CSRF token from cookie
 */
export async function getCsrfTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * CSRF token header name for client-side reference
 */
export const CSRF_HEADER_NAME_CLIENT = CSRF_HEADER_NAME;
export const CSRF_COOKIE_NAME_CLIENT = CSRF_COOKIE_NAME;
