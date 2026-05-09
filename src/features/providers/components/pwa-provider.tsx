"use client";

import { useEffect } from "react";

import { useServiceWorker } from "@/hooks/use-service-worker";

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const { isSupported, isRegistered, error } = useServiceWorker();

  useEffect(() => {
    if (isRegistered && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [isRegistered]);

  useEffect(() => {
    // Service worker hatası sessizce ele alınır - PWA özellik optional
  }, [error]);

  if (!isSupported) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
