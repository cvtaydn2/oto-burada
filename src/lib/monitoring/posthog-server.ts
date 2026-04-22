/**
 * PostHog Sunucu Tarafı İstemcisi (Server-Side Client)
 * ─────────────────────────────────────────────────────
 * Ad-blocker koruması: Kritik business eventler (ilan oluşturma, ödeme, raporlama)
 * doğrudan server → PostHog olarak gönderilir, istemci JS engellenmesinden etkilenmez.
 *
 * Kullanım:
 *   import { trackServerEvent, AnalyticsEvent } from "@/lib/monitoring/posthog-server";
 *   trackServerEvent(AnalyticsEvent.SERVER_LISTING_CREATED, { ... }, userId);
 */

import { PostHog } from "posthog-node";

import {
  AnalyticsEvent,
  type EventPayload,
  type ServerAnalyticsEvent,
} from "@/lib/analytics/events";
import { logger } from "@/lib/utils/logger";

// ─── Singleton PostHog Instance ─────────────────────────────────────────────────

let posthogInstance: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  const token =
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!token) return null;

  if (!posthogInstance) {
    posthogInstance = new PostHog(token, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1, // flush immediately — important for serverless
      flushInterval: 0,
    });
  }

  return posthogInstance;
}

// ─── Type-Safe Server Event Tracking ────────────────────────────────────────────

/**
 * Tip-güvenli sunucu tarafı event takibi.
 *
 * Yeni kod bu fonksiyonu tercih etmelidir. Event Dictionary'de tanımlanan
 * ServerAnalyticsEvent enum değerlerini ve ilgili property'leri zorunlu kılar.
 *
 * @example
 * trackServerEvent(AnalyticsEvent.SERVER_LISTING_CREATED, {
 *   listingId: "abc",
 *   brand: "BMW",
 *   model: "320i",
 *   city: "İstanbul",
 *   price: 1_500_000,
 *   status: "pending_ai_review",
 * }, userId);
 */
export function trackServerEvent<T extends ServerAnalyticsEvent>(
  event: T,
  properties: EventPayload<T>,
  distinctId?: string
) {
  captureServerEvent(event, properties as Record<string, unknown>, distinctId);
}

// ─── Generic Event Capture ──────────────────────────────────────────────────────

/**
 * Generic sunucu tarafı event gönderimi.
 * Tip-güvenli alternatif: `trackServerEvent()`.
 */
export function captureServerEvent(
  event: string,
  properties?: Record<string, unknown>,
  distinctId?: string
) {
  const ph = getPostHogServer();
  if (!ph) return;

  const derivedDistinctId =
    distinctId ??
    (typeof properties?.userId === "string"
      ? properties.userId
      : typeof properties?.user_id === "string"
        ? properties.user_id
        : "server");

  ph.capture({
    distinctId: derivedDistinctId,
    event,
    properties: {
      environment: process.env.NODE_ENV,
      ...properties,
    },
  });

  ph.flush().catch((err) => {
    // Flush failure is non-critical — log at warn level only in dev
    if (process.env.NODE_ENV !== "production") {
      logger.system.warn("PostHog event flush failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

// ─── Error & Warning Capture ────────────────────────────────────────────────────

/**
 * Capture a server-side exception in PostHog.
 * Use in server actions and API routes.
 *
 * @example
 * captureServerError("DB query failed", "database", error, { table: "listings" })
 */
export function captureServerError(
  message: string,
  context: string,
  error?: unknown,
  data?: Record<string, unknown>,
  distinctId?: string
) {
  const ph = getPostHogServer();
  if (!ph) return;

  const derivedDistinctId =
    distinctId ??
    (typeof data?.userId === "string"
      ? data.userId
      : typeof data?.user_id === "string"
        ? data.user_id
        : "server");

  const properties: Record<string, unknown> = {
    context,
    message,
    environment: process.env.NODE_ENV,
    ...data,
  };

  if (error instanceof Error) {
    properties.error_name = error.name;
    properties.error_message = error.message;
    properties.error_stack_first_line = error.stack?.split("\n")[1]?.trim();
  } else if (error) {
    properties.error_raw = String(error);
  }

  if (error instanceof Error) {
    ph.captureException(error, derivedDistinctId, { properties });
  } else {
    ph.capture({
      distinctId: derivedDistinctId,
      event: "$exception",
      properties,
    });
  }

  ph.flush().catch((err) => {
    if (process.env.NODE_ENV !== "production") {
      logger.system.warn("PostHog error flush failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

/**
 * Capture a server-side warning in PostHog.
 */
export function captureServerWarning(
  message: string,
  context: string,
  data?: Record<string, unknown>
) {
  const ph = getPostHogServer();
  if (!ph) return;

  ph.capture({
    distinctId: "server",
    event: "server_warning",
    properties: {
      context,
      message,
      environment: process.env.NODE_ENV,
      ...data,
    },
  });

  ph.flush().catch((err) => {
    if (process.env.NODE_ENV !== "production") {
      logger.system.warn("PostHog warning flush failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

// ─── Server-Side Identify ───────────────────────────────────────────────────────

/**
 * Sunucu tarafından kullanıcı kimliğini PostHog'a bildir.
 * Login/register server action'larında kullanılır.
 */
export function identifyServerUser(
  userId: string,
  properties?: {
    email?: string;
    role?: string;
    trust_score?: number;
    user_type?: string;
  }
) {
  const ph = getPostHogServer();
  if (!ph) return;

  ph.identify({
    distinctId: userId,
    properties: {
      ...properties,
      environment: process.env.NODE_ENV,
    },
  });

  ph.flush().catch((err) => {
    if (process.env.NODE_ENV !== "production") {
      logger.system.warn("PostHog identify flush failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

export { AnalyticsEvent };
