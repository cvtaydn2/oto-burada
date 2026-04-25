import { checkRateLimit } from "@/lib/rate-limiting/rate-limit";

/**
 * ── PILL: Issue 3 - SMS Pumping (Toll Fraud) Protection ──────────
 * Hardens OTP/SMS endpoints against high-cost automated attacks.
 * Features: Device Fingerprinting, Target Number Limiting, and Geo-Restriction.
 */
export async function protectSmsEndpoint(
  request: Request,
  phoneNumber: string,
  config: {
    deviceFingerprint?: string;
    limitPerNumber?: number;
    allowInternational?: boolean;
  } = {}
) {
  // 1. Geo-Restriction: Block non-Turkish numbers by default
  // Turkish numbers start with +90 or 05... (normalized to +90)
  const isTurkish =
    phoneNumber.startsWith("+90") || phoneNumber.startsWith("90") || phoneNumber.startsWith("05");

  if (!config.allowInternational && !isTurkish) {
    return {
      allowed: false,
      reason: "Uluslararası numaralara SMS gönderimi kapalıdır.",
      status: 403,
    };
  }

  // 2. Rate Limit by Target Phone Number
  // Prevents attacking a single person.
  const numberLimit = await checkRateLimit(`sms:number:${phoneNumber}`, {
    limit: config.limitPerNumber ?? 3, // 3 SMS per hour per number
    windowMs: 60 * 60 * 1000, // 1h
  });

  if (!numberLimit.allowed) {
    return {
      allowed: false,
      reason: "Bu numara için SMS limiti doldu. Lütfen 1 saat sonra tekrar deneyin.",
      status: 429,
    };
  }

  // 3. Rate Limit by Device Fingerprint
  // Prevents a single device from pumping different numbers.
  if (config.deviceFingerprint) {
    const deviceLimit = await checkRateLimit(`sms:device:${config.deviceFingerprint}`, {
      limit: 10, // 10 SMS per day per device
      windowMs: 24 * 60 * 60 * 1000, // 24h
    });

    if (!deviceLimit.allowed) {
      return {
        allowed: false,
        reason: "Günlük SMS gönderme limitiniz doldu.",
        status: 429,
      };
    }
  }

  return { allowed: true };
}
