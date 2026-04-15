"use client";

/**
 * Analytics utility — PostHog tabanlı event tracking.
 * GA4 kaldırıldı. Tüm eventler PostHog'a gidiyor.
 * Kullanım: usePostHog() hook'u veya posthog.capture() direkt çağrısı.
 */

export { posthog } from "@/lib/monitoring/posthog-client";
