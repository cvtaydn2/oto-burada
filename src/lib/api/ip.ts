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
 *
 * ── LOGIC FIX: Issue LOGIC-03 - Proper IPv6 Special Address Handling ─────────────
 * Handles special IPv6 addresses correctly before applying /64 subnet normalization.
 */
export function getNormalizedIp(ip: string): string {
  if (!ip || ip === "unknown") return "unknown";

  // IPv6 check
  if (ip.includes(":")) {
    // Special case: IPv4-mapped IPv6 (::ffff:192.168.1.1)
    // Extract and return the IPv4 address
    if (ip.toLowerCase().includes("::ffff:")) {
      const ipv4Match = ip.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/i);
      if (ipv4Match) {
        return ipv4Match[1]; // Return the IPv4 address
      }
    }

    // Special case: Loopback (::1)
    if (ip === "::1" || ip.toLowerCase() === "::1") {
      return "::1"; // Don't normalize localhost
    }

    // Special case: Link-local addresses (fe80::/10)
    if (ip.toLowerCase().startsWith("fe80:")) {
      return "fe80::/10"; // Normalize to link-local range
    }

    // Special case: Unique local addresses (fc00::/7)
    if (ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd")) {
      return "fc00::/7"; // Normalize to unique local range
    }

    // Standard case: Extract /64 subnet (first 4 blocks)
    // Expand compressed notation first
    const blocks = ip.split(":");

    // Handle compressed notation (::)
    if (blocks.includes("")) {
      // This is a compressed address, expand it
      const nonEmptyBlocks = blocks.filter((b) => b !== "");

      // If we have enough blocks, take first 4
      if (nonEmptyBlocks.length >= 4) {
        return nonEmptyBlocks.slice(0, 4).join(":") + "::/64";
      }
    }

    // Normal case: Take first 4 blocks
    if (blocks.length >= 4) {
      return blocks.slice(0, 4).join(":") + "::/64";
    }

    // Fallback: Return as-is if we can't parse
    return ip;
  }

  // IPv4 - return as-is
  return ip;
}
