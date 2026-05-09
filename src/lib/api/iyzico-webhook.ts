import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies Iyzico webhook signature using HMAC-SHA256.
 *
 * NOTE: Iyzico documentation specifies SHA-256 for webhook signatures.
 * If signature verification fails, verify with Iyzico support that SHA-256 is correct.
 * Some payment providers use SHA-512, but Iyzico's SDK and docs indicate SHA-256.
 */
export function verifyIyzicoWebhook(
  body: string,
  signature: string | null,
  secretKey: string
): boolean {
  if (!signature || !secretKey) return false;

  try {
    // Iyzico uses HMAC-SHA256 for webhook signature verification
    const expectedSignature = createHmac("sha256", secretKey).update(body).digest("base64");
    const receivedBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSignature, "base64");

    // Reject invalid or mismatched lengths before constant-time comparison.
    if (receivedBuffer.length === 0 || expectedBuffer.length === 0) {
      return false;
    }

    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    // Use timing-safe comparison to prevent side-channel attacks.
    return timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
