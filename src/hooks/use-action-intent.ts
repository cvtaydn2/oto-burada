"use client";

import { useCallback } from "react";
import { useAuthUser } from "@/components/shared/auth-provider";
import { useRouter } from "next/navigation";

/**
 * World-Class UX: Action Intent Tracking (Issue 5 - "The Seam")
 * Captures user intent (e.g. favorite, message) before login wall.
 * Automatically executes the action after successful login.
 */

export function useActionIntent() {
  const { isAuthenticated } = useAuthUser();
  const router = useRouter();

  const runWithAuth = useCallback(
    (intent: string, action: () => void) => {
      if (isAuthenticated) {
        action();
      } else {
        // Store intent in session storage
        sessionStorage.setItem("pending_intent", intent);
        // Redirect to login (or open modal if implemented)
        router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      }
    },
    [isAuthenticated, router]
  );

  return { runWithAuth };
}
