import posthog from "posthog-js";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (token) {
  posthog.init(token, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    defaults: "2026-01-30",
    // Exception autocapture — catches unhandled JS errors and promise rejections
    autocapture: {
      capture_copied_text: false,
    },
    capture_pageview: false, // handled manually via PostHogProvider
    capture_pageleave: true,
    person_profiles: "identified_only",
    session_recording: {
      maskAllInputs: true,
    },
  });
}
