/**
 * Pure utility functions for IP address manipulation.
 * These are safe to use in Edge Runtime, Server Components, and Client Components.
 */

/**
 * Normalizes IP addresses for rate limiting.
 * For IPv6, it extracts the /64 subnet to prevent "Subnet Rotation" attacks.
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
    const blocks = ip.split(":");

    // Handle compressed notation (::)
    if (blocks.includes("")) {
      const nonEmptyBlocks = blocks.filter((b) => b !== "");
      if (nonEmptyBlocks.length >= 4) {
        return nonEmptyBlocks.slice(0, 4).join(":") + "::/64";
      }
    }

    // Normal case: Take first 4 blocks
    if (blocks.length >= 4) {
      return blocks.slice(0, 4).join(":") + "::/64";
    }

    return ip;
  }

  // IPv4 - return as-is
  return ip;
}
