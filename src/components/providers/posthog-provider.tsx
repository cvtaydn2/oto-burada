"use client";

/**
 * PostHog Provider — App Router pattern.
 * PostHog is initialized in instrumentation-client.ts (Next.js 15.3+).
 * This provider wraps the app to enable usePostHog() hook in all client components.
 *
 * Features:
 * - Automatic pageview tracking (with Suspense boundary for useSearchParams)
 * - Cookie consent integration
 * - User identity sync (identify on login, reset on logout)
 * - URL PII sanitization (emails, sensitive query params)
 *
 * Session Replay & autocapture are enabled via `defaults: "2026-01-30"`
 * in instrumentation-client.ts.
 *
 * Docs: https://posthog.com/docs/error-tracking/installation/nextjs
 */

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PostHogProvider as PHProvider } from "posthog-js/react";

import { useAuthUser } from "@/components/shared/auth-provider";
import {
  capturePostHogPageView,
  identifyPostHogUser,
  posthog,
  resetPostHogUser,
  syncPostHogConsent,
} from "@/lib/monitoring/posthog-client";

// ─── Automatic Pageview Tracker ─────────────────────────────────────────────────

/**
 * Separate component because useSearchParams needs Suspense boundary.
 * Handles consent sync, user identity synchronization, and pageview capture.
 */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isReady, user } = useAuthUser();

  useEffect(() => {
    syncPostHogConsent();
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      resetPostHogUser();
      return;
    }

    identifyPostHogUser(user.id, {
      email: user.email,
      role:
        (user.app_metadata as { role?: string } | undefined)?.role ?? "user",
      trust_score:
        (user.user_metadata as { trust_score?: number } | undefined)
          ?.trust_score ?? 0,
    });
  }, [isReady, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    capturePostHogPageView(window.location.href);
  }, [pathname, searchParams]);

  return null;
}

// ─── Provider Component ─────────────────────────────────────────────────────────

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
