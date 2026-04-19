/**
 * Cloudflare Turnstile verification for bot protection.
 * 
 * Turnstile is Cloudflare's privacy-friendly CAPTCHA alternative.
 * In "invisible" mode, users don't see a challenge unless suspicious.
 * 
 * Docs: https://developers.cloudflare.com/turnstile/
 */

import { logger } from "@/lib/utils/logger";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify a Turnstile token on the server side.
 * 
 * @param token - The token returned by the Turnstile widget on the client
 * @param ip - The user's IP address (optional but recommended)
 * @returns true if verification passed, false otherwise
 */
export async function verifyTurnstileToken(
  token: string,
  ip?: string,
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If Turnstile is not configured, allow the request (fail-open for development)
  if (!secretKey) {
    logger.security.warn("Turnstile secret key not configured — skipping verification");
    return true;
  }

  if (!token || token.trim().length === 0) {
    logger.security.warn("Turnstile token missing");
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) formData.append("remoteip", ip);

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!response.ok) {
      logger.security.error("Turnstile API request failed", { status: response.status });
      return false;
    }

    const data = (await response.json()) as TurnstileVerifyResponse;

    if (!data.success) {
      logger.security.warn("Turnstile verification failed", {
        errorCodes: data["error-codes"],
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.security.error("Turnstile verification exception", error);
    // Fail-open: if Cloudflare is down, don't block legitimate users
    return true;
  }
}

/**
 * Check if Turnstile is enabled (secret key is configured).
 */
export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}
