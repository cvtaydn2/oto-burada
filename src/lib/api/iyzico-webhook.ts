import "server-only";

import crypto from "crypto";

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
    const expectedSignature = crypto.createHmac("sha256", secretKey).update(body).digest("base64");

    // Use timing-safe comparison to prevent side-channel attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, "base64"),
      Buffer.from(expectedSignature, "base64")
    );
  } catch {
    return false;
  }
}
