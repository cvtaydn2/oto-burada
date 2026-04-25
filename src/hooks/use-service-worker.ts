"use client";

import { useEffect, useState } from "react";

interface UseServiceWorkerReturn {
  isSupported: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
  error: Error | null;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [isSupported] = useState(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return false;
    }
    return true;
  });

  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isSupported) return;

    let ignore = false;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (ignore) return;
        setIsRegistered(true);
        setRegistration(reg);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      })
      .catch((err) => {
        if (ignore) return;
        setError(err);
      });

    return () => {
      ignore = true;
    };
  }, [isSupported]);

  return { isSupported, isRegistered, registration, error };
}
