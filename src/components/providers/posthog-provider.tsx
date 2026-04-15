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

// Separate component because useSearchParams needs Suspense boundary
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
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
