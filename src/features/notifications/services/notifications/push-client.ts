import webpush from "web-push";

import { logger } from "@/lib/logger";

import { getWebPushEnv, hasWebPushEnv } from "./push-env";

/**
 * Configures and executes physical delivery to external browser endpoints.
 * Automatically suppresses calls when secrets are unavailable preserving continuous availability.
 */
export async function sendPushNotification(
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: {
      url?: string;
    };
  }
): Promise<{ success: boolean; error?: string; gone?: boolean }> {
  if (!hasWebPushEnv()) {
    logger.notifications.warn(
      "Attempted to dispatch push notification but VAPID config is missing. Aborting."
    );
    return { success: false, error: "CONFIG_MISSING" };
  }

  const config = getWebPushEnv();

  try {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);

    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      // Standard options ensuring efficient free-tier delivery
      TTL: 60 * 60 * 24, // 24 hours
      urgency: "normal",
    });

    return { success: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    // HTTP 410 (Gone) or 404 means the client revoked consent or subscription expired.
    // System should delete this stale subscription record.
    const isExpired = err.statusCode === 410 || err.statusCode === 404;

    if (isExpired) {
      logger.notifications.info(
        `Push subscription has expired (HTTP ${err.statusCode}). Marking as stale.`
      );
    } else {
      logger.notifications.error(
        `Critical failure dispatching web push to endpoint: ${err.message}`,
        err
      );
    }

    return {
      success: false,
      error: err.message || "Delivery failed",
      gone: isExpired,
    };
  }
}
