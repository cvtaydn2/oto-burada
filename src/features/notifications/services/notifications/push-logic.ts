import { createSupabaseAdminClient } from "@/lib/admin";
import { logger } from "@/lib/logger";

import { sendPushNotification } from "./push-client";

/**
 * Fetches ALL active device subscriptions belonging to a target user
 * and securely triggers individual push dispatches.
 * Invalidates and deletes 'Gone' subscriptions instantly to keep the DB clean.
 */
export async function triggerPushNotificationForUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    url?: string;
  }
) {
  if (!userId) return { success: false, reason: "Missing userId" };

  const admin = createSupabaseAdminClient();

  try {
    const { data, error } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, auth_token, p256dh")
      .eq("user_id", userId);

    const subscriptions = data ?? [];

    if (error) {
      logger.notifications.error(
        `Failed to query push subscriptions for ${userId}: ${error.message}`
      );
      return { success: false, error: error.message };
    }

    if (!subscriptions || subscriptions.length === 0) {
      // No registered devices - silent skip
      return { success: true, dispatchedCount: 0 };
    }

    logger.notifications.info(
      `Found ${subscriptions.length} endpoints for user ${userId}. Initiating parallel dispatch.`
    );

    const staleSubscriptionIds: string[] = [];
    let successCount = 0;

    // 2. Broadcast payload in parallel across all distinct device registrations
    const promises = subscriptions.map(async (sub) => {
      const result = await sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth_token,
            p256dh: sub.p256dh,
          },
        },
        {
          title: payload.title,
          body: payload.body,
          icon: "/icons/icon-192x192.png", // Ensure static standard exists or falls back to default
          badge: "/icons/badge-72x72.png",
          data: {
            url: payload.url,
          },
        }
      );

      if (result.success) {
        successCount++;
      } else if (result.gone) {
        staleSubscriptionIds.push(sub.id);
      }
    });

    await Promise.allSettled(promises);

    // 3. Prune disconnected/revoked devices asynchronously maintaining quota integrity
    if (staleSubscriptionIds.length > 0) {
      logger.notifications.info(
        `Pruning ${staleSubscriptionIds.length} invalid/expired push subscription endpoints.`
      );
      await admin.from("push_subscriptions").delete().in("id", staleSubscriptionIds);
    }

    return {
      success: true,
      dispatchedCount: subscriptions.length,
      deliveredCount: successCount,
      prunedCount: staleSubscriptionIds.length,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.notifications.error(
      `Fatal error during push processing cascade for user ${userId}: ${errorMessage}`
    );
    return { success: false, error: "Processing exception" };
  }
}

/**
 * Enqueues a standard persistent background job which the main cron runner fulfills out-of-band.
 * Used primarily within heavy loops to maximize response latency for the initial actor.
 */
export async function enqueuePushNotification(
  userId: string,
  title: string,
  message: string,
  href?: string | null
) {
  const admin = createSupabaseAdminClient();

  try {
    // Insert into pre-architected fulfillment queue
    const { error } = await admin.from("fulfillment_jobs").insert({
      job_type: "notification_send",
      metadata: {
        userId,
        title,
        body: message,
        url: href || undefined,
      },
    });

    if (error) {
      logger.notifications.error(`Failed to enqueue push fulfillment job: ${error.message}`);
      return false;
    }

    return true;
  } catch (err) {
    logger.notifications.error(
      "Failed to write push event to job pipeline due to runtime exception",
      err
    );
    return false;
  }
}

/**
 * Batched variant of the job enqueue logic preventing performance decay in bulk cycles.
 */
export async function enqueuePushNotificationsBulk(
  inputs: {
    userId: string;
    title: string;
    message: string;
    href?: string | null;
  }[]
) {
  if (inputs.length === 0) return true;

  const admin = createSupabaseAdminClient();

  try {
    const jobInserts = inputs.map((input) => ({
      job_type: "notification_send",
      metadata: {
        userId: input.userId,
        title: input.title,
        body: input.message,
        url: input.href || undefined,
      },
    }));

    const { error } = await admin.from("fulfillment_jobs").insert(jobInserts);

    if (error) {
      logger.notifications.error(`Failed to bulk enqueue push fulfillment jobs: ${error.message}`);
      return false;
    }

    return true;
  } catch (err) {
    logger.notifications.error("Failed bulk push write routine due to runtime exception", err);
    return false;
  }
}
