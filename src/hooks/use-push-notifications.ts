"use client";

import { useState, useCallback } from "react";

interface PushNotificationState {
  permission: NotificationPermission | null;
  token: string | null;
  isSupported: boolean;
}

interface PushNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>(() => {
    if (typeof window === "undefined") {
      return { permission: null, token: null, isSupported: false };
    }
    const supported = "Notification" in window;
    return {
      permission: supported ? Notification.permission : null,
      token: null,
      isSupported: supported,
    };
  });

  // No useEffect needed — permission is read synchronously on mount via lazy init

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission === "granted";
    } catch {
      return false;
    }
  }, []);

  const showNotification = useCallback(async (options: PushNotificationOptions): Promise<boolean> => {
    if (!("Notification" in window)) return false;
    if (Notification.permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/icons/icon-192x192.png",
        badge: options.badge || "/icons/icon-72x72.png",
        tag: options.tag,
        data: options.data,
      });
      return true;
    } catch {
      return false;
    }
  }, [requestPermission]);

  const subscribeToPush = useCallback(async (userId: string): Promise<string | null> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: null,
      });

      const token = JSON.stringify(subscription);
      setState(prev => ({ ...prev, token }));

      // Save token to server
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userId }),
      });

      return token;
    } catch {
      return null;
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator)) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        setState(prev => ({ ...prev, token: null }));
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    ...state,
    requestPermission,
    showNotification,
    subscribeToPush,
    unsubscribe,
  };
}