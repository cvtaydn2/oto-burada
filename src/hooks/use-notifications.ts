"use client";

import { useEffect, useState } from "react";

export function useNotifications(_userId?: string) {
  const [notifications] = useState<
    {
      id: string;
      title: string;
      message: string;
      read: boolean;
      href?: string;
      createdAt: string;
    }[]
  >([]);
  const [unreadCount] = useState(0);
  const [isLoading] = useState(false);
  const [isError] = useState(false);

  useEffect(() => {
    // Mock implementation
  }, [_userId]);

  return { notifications, unreadCount, isLoading, isError };
}
