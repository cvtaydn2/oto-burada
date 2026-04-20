import { headers } from "next/headers";

export async function getClientIp() {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  return (forwarded?.split(",")[0]?.trim() || realIp || "unknown");
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
