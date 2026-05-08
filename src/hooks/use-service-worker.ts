"use client";

import { useEffect, useState } from "react";

export function useServiceWorker() {
  const [registration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Mock service worker registration
  }, []);

  return {
    registration,
    isSupported: typeof window !== "undefined" && "serviceWorker" in navigator,
    isRegistered: registration !== null,
    error: null as Error | null,
  };
}
