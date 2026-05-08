/**
 * POST /api/notifications/publish
 *
 * Internal endpoint to publish a notification to a user's Redis-based real-time stream.
 *
 * SECURITY: Requires either:
 *   a) A valid INTERNAL_API_SECRET header (for server-to-server calls), OR
 *   b) An authenticated admin user session.
 *
 * Regular authenticated users are explicitly NOT allowed to call this endpoint —
 * they could otherwise send fake system notifications to any userId.
 */

import { Redis } from "@upstash/redis";

import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/response";
import { withAdminRoute } from "@/lib/security";

export const dynamic = "force-dynamic";

/** Constant-time string comparison to prevent timing attacks on the secret. */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function getRedisClient() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function POST(request: Request) {
  // ── Authorization ────────────────────────────────────────────────────────
  // Path A: Internal service-to-service call with a shared secret.
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const providedSecret = request.headers.get("x-internal-secret");

  const isInternalCall =
    internalSecret && providedSecret && safeCompare(internalSecret, providedSecret);

  if (!isInternalCall) {
    // Path B: Admin session (CSRF + admin role check via withAdminRoute).
    const security = await withAdminRoute(request);
    if (!security.ok) return security.response;
  }

  // ── Payload ──────────────────────────────────────────────────────────────
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "İstek gövdesi okunamadı.", 400);
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("userId" in payload) ||
    !("message" in payload)
  ) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "userId ve message alanları zorunludur.", 400);
  }

  const { userId, message, title, link } = payload as {
    userId: string;
    message: string;
    title?: string;
    link?: string;
  };

  if (typeof userId !== "string" || userId.trim() === "") {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz userId.", 400);
  }
  if (typeof message !== "string" || message.trim() === "") {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz message.", 400);
  }

  // ── Redis publish ─────────────────────────────────────────────────────────
  const redis = getRedisClient();
  if (!redis) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Redis yapılandırılmamış.", 503);
  }

  const notification = {
    id: Date.now().toString(),
    message: message.trim(),
    title: typeof title === "string" && title.trim() ? title.trim() : "Yeni Bildirim",
    link: typeof link === "string" ? link : undefined,
    createdAt: new Date().toISOString(),
  };

  const key = `notifications:${userId}`;
  await redis.zadd(key, { score: Date.now(), member: JSON.stringify(notification) });
  // Keep only the last 50 notifications per user
  await redis.zremrangebyrank(key, 0, -51);

  return apiSuccess({ published: true, notification });
}
