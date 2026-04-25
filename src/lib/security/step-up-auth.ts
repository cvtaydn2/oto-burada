import { getClientIp } from "@/lib/api/ip";
import { redis } from "@/lib/redis/client";

/**
 * Hyper-Scale Step-up Authentication (Item 4 - ATO Prevention)
 * Forces extra verification for critical actions if context is suspicious.
 */

export async function checkStepUpRequired(userId: string, request: Request): Promise<boolean> {
  const currentIp = await getClientIp();
  const userAgent = request.headers.get("user-agent") || "unknown";

  if (!redis) return false;

  // 1. Simple heuristic: Check if IP has changed recently for this user
  const stateKey = `auth_context:${userId}`;
  const lastContext = await redis.get<{ ip: string; ua: string }>(stateKey);

  if (!lastContext) {
    await redis.set(stateKey, { ip: currentIp, ua: userAgent }, { ex: 86400 * 30 });
    return false;
  }

  // 2. If IP or UserAgent is different, require step-up for critical actions
  if (lastContext.ip !== currentIp || lastContext.ua !== userAgent) {
    return true;
  }

  return false;
}

export async function isSecuritySessionActive(userId: string): Promise<boolean> {
  if (!redis) return false;
  const activeKey = `security_session:${userId}`;
  return (await redis.exists(activeKey)) === 1;
}

export async function activateSecuritySession(userId: string) {
  if (!redis) return;
  const activeKey = `security_session:${userId}`;
  await redis.set(activeKey, "true", { ex: 3600 });
}
