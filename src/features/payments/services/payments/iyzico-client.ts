import "server-only";

import iyzipay from "iyzipay";

/**
 * SOLID: Single Responsibility — sadece Iyzico SDK wrapper.
 * Test ve production ortam seçici. Environment variable ile toggle.
 *
 * ── CRITICAL FIX: Issue Kritik-06 - Server-Only Enforcement ───
 * SECURITY: This function MUST only be called from server-side code.
 * Client-side access would expose API keys.
 */
export function getIyzicoClient() {
  // SECURITY: Prevent client-side access
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY VIOLATION: Iyzico client cannot be accessed from client-side code. " +
        "This function must only be called from API routes or Server Components."
    );
  }

  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const uri = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

  if (!apiKey || !secretKey) {
    throw new Error(
      "[Iyzico] API keys missing. Set IYZICO_API_KEY and IYZICO_SECRET_KEY in environment variables."
    );
  }

  return new iyzipay({
    apiKey: apiKey,
    secretKey: secretKey,
    uri: uri,
  });
}

/**
 * Helper to check if Iyzico is configured
 * Safe to call from anywhere (doesn't expose secrets)
 */
export function isIyzicoConfigured() {
  return !!(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY);
}
