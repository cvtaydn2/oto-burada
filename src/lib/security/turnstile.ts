/**
 * Cloudflare Turnstile verification for bot protection.
 *
 * Turnstile is Cloudflare's privacy-friendly CAPTCHA alternative.
 * In "invisible" mode, users don't see a challenge unless suspicious.
 *
 * Docs: https://developers.cloudflare.com/turnstile/
 */

import { logger } from "@/lib/logging/logger";
import { redis } from "@/lib/redis";

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
export async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  const isProd = process.env.NODE_ENV === "production";
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // 1. If Turnstile is not configured
  if (!secretKey) {
    if (isProd) {
      logger.security.error("CRITICAL: Turnstile secret key missing in production. REJECTING.");
      return false; // Fail-closed in production
    }
    logger.security.warn("Turnstile secret key missing (development/test) — skipping verification");
    return true; // Fail-open in dev/test for DX
  }

  if (!token || token.trim().length === 0) {
    logger.security.warn("Turnstile token missing");
    return false;
  }

  // 2. Token Deduplication (Replay Attack Prevention)
  // ── SECURITY FIX: Issue #22 - Atomic Token Deduplication ─────────────
  // Use atomic SET NX (SET if Not eXists) to prevent TOCTOU race conditions.
  // Two concurrent requests with the same token cannot both pass because SET NX
  // is atomic - only one will succeed in setting the key.
  if (!redis) {
    if (isProd) {
      logger.security.error(
        "CRITICAL: Redis unavailable for Turnstile deduplication in production"
      );
      return false; // Fail-closed in production - bot protection is mandatory
    }
    logger.security.warn("Turnstile deduplication skipped (no Redis in dev/test)");
  } else {
    try {
      const redisKey = `turnstile:used:${token}`;

      // Atomic SET NX: Only succeeds if key doesn't exist
      // Returns null if key already exists (token was already used)
      const wasSet = await redis.set(redisKey, "1", {
        ex: 15 * 60, // TTL matches Turnstile's own window
        nx: true, // Only set if key doesn't exist (atomic check-and-set)
      });

      if (!wasSet) {
        logger.security.warn("Turnstile token replay detected (atomic check)", {
          token: `${token.slice(0, 10)}...`,
        });
        return false;
      }

      // Token successfully marked as used - continue to verification
    } catch (error) {
      logger.security.error("Redis token deduplication failed", error);
      if (isProd) {
        logger.security.error(
          "CRITICAL: Redis token dedup failed in production - rejecting request"
        );
        return false; // Fail-closed in production
      }
      // Fail-open in dev/test for better DX
    }
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
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      logger.security.error("Turnstile API request failed", { status: response.status });
      return isProd ? false : true; // Fail-closed in prod
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
    // In production, we fail-closed to be safe.
    // If bot protection is down, we prefer downtime/rejection over being scraped/botted.
    return isProd ? false : true;
  }
}

/**
 * Check if Turnstile is enabled (secret key is configured).
 */
export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}
