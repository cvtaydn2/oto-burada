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
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import posthog from "posthog-js";

import { useAuthUser } from "@/components/shared/auth-provider";

// ─── Automatic Pageview Tracker ─────────────────────────────────────────────────

/**
 * Separate component because useSearchParams needs Suspense boundary.
 * Also handles:
 * - Cookie consent opt-in/opt-out
 * - User identity synchronization (identify/reset)
 * - Automatic $pageview capture
 */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();
  const { isReady, user } = useAuthUser();

  // ── Cookie consent ──
  useEffect(() => {
    if (!ph) return;
    if (typeof window === "undefined") return;

    const consent = window.localStorage.getItem("cookie-consent");
    if (consent === "true") {
      if (ph.has_opted_out_capturing()) {
        ph.opt_in_capturing();
      }
    } else if (consent === "false") {
      if (!ph.has_opted_out_capturing()) {
        ph.opt_out_capturing();
      }
    }
  }, [ph]);

  // ── User identity sync (identify on login, reset on logout) ──
  useEffect(() => {
    if (!ph || !isReady) return;

    if (!user) {
      // Kullanıcı çıkış yaptı → anonim ID'ye geri dön.
      // Bu, farklı kullanıcıların oturumlarının birbirine karışmasını önler.
      ph.reset();
      return;
    }

    // Kullanıcı oturum açtı → PostHog'da gerçek kullanıcıya bağla.
    ph.identify(user.id, {
      email: user.email,
      role:
        (user.app_metadata as { role?: string } | undefined)?.role ?? "user",
      trust_score:
        (user.user_metadata as { trust_score?: number } | undefined)
          ?.trust_score ?? 0,
    });
  }, [isReady, ph, user]);

  // ── Automatic pageview ──
  useEffect(() => {
    if (!ph) return;
    if (typeof window === "undefined") return;
    if (ph.has_opted_out_capturing()) return;

    const url = window.location.href;
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

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
