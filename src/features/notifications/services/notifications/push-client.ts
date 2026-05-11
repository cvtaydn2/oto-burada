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
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    const isExpired = error.statusCode === 410 || error.statusCode === 404;

    if (isExpired) {
      logger.notifications.info(
        `Push subscription has expired (HTTP ${error.statusCode}). Marking as stale.`
      );
    } else {
      logger.notifications.error(
        `Critical failure dispatching web push to endpoint: ${error.message}`,
        err
      );
    }

    return {
      success: false,
      error: error.message || "Delivery failed",
      gone: isExpired,
    };
  }
}
