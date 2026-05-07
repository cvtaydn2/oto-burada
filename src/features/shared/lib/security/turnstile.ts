/**
 * Cloudflare Turnstile verification for bot protection.
 *
 * Turnstile is Cloudflare's privacy-friendly CAPTCHA alternative.
 * In "invisible" mode, users don't see a challenge unless suspicious.
 *
 * Docs: https://developers.cloudflare.com/turnstile/
 */

import { redis } from "@/features/shared/lib";
import { logger } from "@/features/shared/lib/logger";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

const inMemoryTurnstileTokenStore = new Map<string, number>();

function getInMemoryTurnstileStore() {
  return inMemoryTurnstileTokenStore;
}

function checkAndSetInMemoryToken(store: Map<string, number>, token: string, ttlSeconds: number) {
  const now = Date.now();

  for (const [key, expiresAt] of store.entries()) {
    if (expiresAt <= now) {
      store.delete(key);
    }
  }

  const existingExpiry = store.get(token);
  if (existingExpiry && existingExpiry > now) {
    return false;
  }

  store.set(token, now + ttlSeconds * 1000);
  return true;
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
  // Redis is best-effort. Cloudflare Turnstile already has server-side replay protection.
  // We keep a short-lived in-memory fallback to avoid total outage during Redis issues.
  const inMemoryDedupTtlSeconds = 60;
  const memoryStore = getInMemoryTurnstileStore();

  try {
    const redisKey = `turnstile:used:${token}`;

    if (redis) {
      const wasSet = await redis.set(redisKey, "1", {
        ex: 15 * 60,
        nx: true,
      });

      if (!wasSet) {
        logger.security.warn("Turnstile token replay detected (redis)", {
          token: `${token.slice(0, 10)}...`,
        });
        return false;
      }
    } else {
      const added = checkAndSetInMemoryToken(memoryStore, token, inMemoryDedupTtlSeconds);
      if (!added) {
        logger.security.warn("Turnstile token replay detected (in-memory)", {
          token: `${token.slice(0, 10)}...`,
        });
        return false;
      }
      if (isProd) {
        logger.security.error(
          "Redis unavailable for Turnstile deduplication in production, using in-memory fallback"
        );
      }
    }
  } catch (error) {
    logger.security.error("Redis token deduplication failed, using in-memory fallback", error);

    const added = checkAndSetInMemoryToken(memoryStore, token, inMemoryDedupTtlSeconds);
    if (!added) {
      logger.security.warn("Turnstile token replay detected (in-memory fallback)", {
        token: `${token.slice(0, 10)}...`,
      });
      return false;
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
