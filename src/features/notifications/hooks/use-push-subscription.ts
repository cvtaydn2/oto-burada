"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Must match what will be inserted into user's environmental runtime
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPending, setIsPending] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !PUBLIC_KEY) {
      setIsSupported(false);
      setPermission("unsupported");
      setIsPending(false);
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error("[Push] Failed status validation:", err);
    } finally {
      setIsPending(false);
    }
  }, []);

  useEffect(() => {
    // Delay initial check slightly ensuring hydration is finalized
    const timeout = setTimeout(() => {
      checkSubscription();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [checkSubscription]);

  const subscribe = async () => {
    if (!isSupported) return;
    setIsPending(true);

    try {
      const permResult = await Notification.requestPermission();
      setPermission(permResult);

      if (permResult !== "granted") {
        throw new Error("Bildirim izni kullanıcı tarafından reddedildi.");
      }

      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY as string),
      });

      const response = await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) throw new Error("Abonelik sunucuya kaydedilemedi.");

      setIsSubscribed(true);
      toast.success("Web bildirimleri başarıyla aktif edildi!");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("[Push] Subscription error:", err);
      toast.error(err.message || "Bildirim kaydı sırasında hata.");
    } finally {
      setIsPending(false);
    }
  };

  const unsubscribe = async () => {
    setIsPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch(
          `/api/notifications/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`,
          {
            method: "DELETE",
          }
        ).catch(() =>
          console.warn("Server-side unregistration failed, clearing local state anyways.")
        );

        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast.success("Web bildirimleri devre dışı bırakıldı.");
    } catch (err) {
      console.error("[Push] Unsubscribe error:", err);
      toast.error("İptal sırasında bir sorun oluştu.");
    } finally {
      setIsPending(false);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isPending,
    subscribe,
    unsubscribe,
  };
}
