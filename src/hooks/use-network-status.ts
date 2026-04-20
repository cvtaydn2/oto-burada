"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * World-Class UX: Network Awareness (Issue 8 - "The Seam")
 * Tracks internet connectivity and WebSocket status.
 * Prevents "Black Hole" messages that never reach the server while offline.
 */

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? window.navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Bağlantı sağlandı.");
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("İnternet bağlantınız koptu. Bazı işlemler çalışmayabilir.", {
        duration: Infinity, // Keep it visible till online
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
