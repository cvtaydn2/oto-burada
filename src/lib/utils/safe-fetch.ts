import net from "node:net";

import { logger } from "@/lib/utils/logger";

/**
 * World-Class Security: SSRF Protection (Issue 5)
 * Blocks requests to internal networks, metadata IPs, and localhost.
 */

const BLOCKED_IP_RANGES = [
  "0.0.0.0/8",
  "127.0.0.0/8",
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "169.254.169.254", // Metadata Service
  "224.0.0.0/4",
];

export async function isSafeUrl(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;

    // Resolve hostname to IP to check for private ranges
    return new Promise((resolve) => {
      const hostname = parsed.hostname;

      // Fast check for known bad IPs
      if (BLOCKED_IP_RANGES.includes(hostname)) return resolve(false);

      dns.lookup(hostname, (err, address) => {
        if (err || !address) return resolve(false);

        // Check if address is in any blocked range
        const isPrivate =
          net.isIP(address) &&
          (address.startsWith("10.") ||
            address.startsWith("192.168.") ||
            address.startsWith("172.") ||
            address === "127.0.0.1" ||
            address === "169.254.169.254");

        resolve(!isPrivate);
      });
    });
  } catch {
    return false;
  }
}

import dns from "node:dns";

/**
 * Wrapper for fetch that prevents SSRF
 */
export async function safeFetch(url: string, options?: RequestInit) {
  const safe = await isSafeUrl(url);
  if (!safe) {
    logger.security.error("SSRF attempt blocked", { url });
    throw new Error("Erişim reddedildi: Güvenli olmayan bağlantı.");
  }
  return fetch(url, options);
}
