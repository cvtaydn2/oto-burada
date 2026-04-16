"use client";

/**
 * PostHog Provider — App Router pattern.
 * PostHog is initialized in instrumentation-client.ts (Next.js 15.3+).
 * This provider wraps the app to enable usePostHog() hook in all client components.
 *
 * Docs: https://posthog.com/docs/error-tracking/installation/nextjs
 */

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import posthog from "posthog-js";

import { useAuthUser } from "@/components/shared/auth-provider";

// Separate component because useSearchParams needs Suspense boundary
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();
  const { isReady, user } = useAuthUser();

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

  useEffect(() => {
    if (!ph || !isReady) return;

    if (!user) {
      ph.reset();
      return;
    }

    ph.identify(user.id, {
      // Do NOT include email, phone, or name — PII must never be sent to PostHog.
      // Only include non-identifiable attributes for segmentation.
      email_verified: Boolean(user.email_confirmed_at),
      phone_verified: Boolean(user.phone_confirmed_at),
      role: (user.app_metadata as { role?: string } | undefined)?.role ?? "user",
    });
  }, [isReady, ph, user]);

  useEffect(() => {
    if (!ph) return;
    if (typeof window === "undefined") return;
    if (ph.has_opted_out_capturing()) return;

    const url = window.location.href;
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

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
