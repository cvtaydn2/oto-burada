import crypto from "crypto";

/**
 * Verifies Iyzico webhook signature using HMAC-SHA512.
 */
export function verifyIyzicoWebhook(
  body: string,
  signature: string | null,
  secretKey: string
): boolean {
  if (!signature || !secretKey) return false;

  try {
    const expectedSignature = crypto.createHmac("sha512", secretKey).update(body).digest("base64");

    // Use timing-safe comparison to prevent side-channel attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, "base64"),
      Buffer.from(expectedSignature, "base64")
    );
  } catch (_error) {
    return false;
  }
}
