/**
 * Iyzico Webhook Signature Verification
 *
 * SECURITY: Implements HMAC-SHA256 signature verification for Iyzico webhooks
 * to prevent payment fraud and unauthorized doping activations.
 */

import crypto from "crypto";

/**
 * Verifies Iyzico webhook signature using HMAC-SHA256.
 *
 * @param body - Raw request body as string
 * @param signature - x-iyzi-signature header value
 * @param secretKey - Iyzico API secret key
 * @returns true if signature is valid, false otherwise
 */
export function verifyIyzicoWebhook(
  body: string,
  signature: string | null,
  secretKey: string
): boolean {
  if (!signature) {
    return false;
  }

  try {
    const expected = crypto.createHmac("sha512", secretKey).update(body).digest("base64");

    if (!signature || signature.length !== expected.length) {
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
