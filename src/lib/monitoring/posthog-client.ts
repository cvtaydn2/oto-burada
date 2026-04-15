"use client";

import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window === "undefined") return;

  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!token) return;

  // Only init once
  if (posthog.__loaded) return;

  posthog.init(token, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    defaults: "2026-01-30", // recommended settings for new projects
    person_profiles: "identified_only",
    capture_pageview: false, // handled manually in PostHogProvider
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true, // mask passwords, phone numbers etc.
    },
  });
}

export { posthog };
