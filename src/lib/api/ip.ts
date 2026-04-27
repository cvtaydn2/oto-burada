import { headers } from "next/headers";

export async function getClientIp() {
  const headersList = await headers();

  // ── SECURITY FIX: Issue #24 - Secure IP Header Priority ──────────────────
  // Prioritizes trusted headers over user-controllable ones to prevent IP spoofing.
  //
  // Header priority (most trusted first):
  // 1. x-real-ip (Vercel/Cloudflare, single IP, most trusted)
  // 2. x-vercel-forwarded-for (Vercel-specific, comma-separated)
  // 3. cf-connecting-ip (Cloudflare-specific)
  // 4. x-forwarded-for (Standard but user-controllable, least trusted)
  //
  // SECURITY: Never rely solely on x-forwarded-for as it can be spoofed by clients.
  // On Vercel/Cloudflare, the platform sets trusted headers that override user input.

  // 1. x-real-ip: Single IP, set by reverse proxy (most trusted)
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp.trim();

  // 2. x-vercel-forwarded-for: Vercel-specific, first IP is client
  const vercelForwarded = headersList.get("x-vercel-forwarded-for");
  if (vercelForwarded) {
    const firstIp = vercelForwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  // 3. cf-connecting-ip: Cloudflare-specific
  const cloudflareIp = headersList.get("cf-connecting-ip");
  if (cloudflareIp) return cloudflareIp.trim();

  // 4. x-forwarded-for: Standard but user-controllable (least trusted)
  // Take first IP as it should be the client, but be aware this can be spoofed
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  return "unknown";
}

/**
 * Normalizes IP addresses for rate limiting.
 * For IPv6, it extracts the /64 subnet to prevent "Subnet Rotation" attacks.
 */
export function getNormalizedIp(ip: string): string {
  if (!ip || ip === "unknown") return "unknown";

  // IPv6 check
  if (ip.includes(":")) {
    // IPv6 addresses can be complex (compressed, IPv4-mapped, etc.)
    // We strictly take the first 4 blocks (the /64 prefix)
    const blocks = ip.split(":");
    if (blocks.length >= 4) {
      return blocks.slice(0, 4).join(":") + "::/64";
    }
  }

  return ip;
}
