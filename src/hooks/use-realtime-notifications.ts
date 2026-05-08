"use client";

import { useEffect, useState } from "react";

interface UseRealtimeNotificationsOptions {
  userId: string;
  onNotification?: (notification: {
    id: string;
    title: string;
    message: string;
    href?: string | null;
    created_at: string;
    type: string;
  }) => void;
}

export function useRealtimeNotifications(_options?: UseRealtimeNotificationsOptions) {
  const [notifications] = useState([]);

  useEffect(() => {
    if (_options) {
      // options handled externally or in mock
    }
  }, [_options]);

  return { notifications };
}
