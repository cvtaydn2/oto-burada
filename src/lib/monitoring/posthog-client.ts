"use client";

import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false, // handled manually via PostHogProvider
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      maskAllInputs: true, // mask passwords, phone numbers etc.
    },
  });

  initialized = true;
}

export { posthog };
