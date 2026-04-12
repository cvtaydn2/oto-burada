"use client";

import { useState, useEffect, useCallback } from "react";

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
  const [state, setState] = useState<PushNotificationState>({
    permission: null,
    token: null,
    isSupported: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(prev => ({
        ...prev,
        isSupported: "Notification" in window,
        permission: Notification?.permission || null,
      }));
    }
  }, []);

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

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (!base64String) return new Uint8Array();
  
  const len = base64String.length;
  const modulo = len % 4;
  const padding = modulo === 0 ? 0 : 4 - modulo;
  const pads = "=".repeat(padding);
  const base64 = (base64String + pads).replace(/-/g, "+").replace(/_/g, "/");
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}