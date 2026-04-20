import { headers } from "next/headers";

export async function getClientIp() {
  const headersList = await headers();
  
  // ── PILL: Issue 4 - Anti-Spoofing IP Resolution ──────────────────
  // We prioritize headers set by the trusted edge proxy (Vercel, Cloudflare).
  // x-real-ip is set by Vercel and cannot be easily spoofed by the client 
  // if you verify it comes from the edge.
  const vercelIp = headersList.get("x-real-ip");
  if (vercelIp) return vercelIp;

  const cloudflareIp = headersList.get("cf-connecting-ip");
  if (cloudflareIp) return cloudflareIp;

  // x-forwarded-for should be the last resort and we take the LAST element
  // if we are behind multiple proxies, but usually the first is the client.
  // SECURITY: Never rely on user-sent x-forwarded-for alone.
  const forwarded = headersList.get("x-forwarded-for");
  return (forwarded?.split(",")[0]?.trim() || "unknown");
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
