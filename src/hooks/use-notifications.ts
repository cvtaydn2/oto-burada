"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { ApiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { queryKeys } from "@/lib/query-keys";
import { apiResponseSchemas } from "@/lib/validators/api-responses";
import type { Notification } from "@/types";

function getErrorMessage(error: { message?: string } | undefined, fallback: string) {
  return error?.message?.trim() ? error.message : fallback;
}

export function useNotifications(userId?: string) {
  const query = useQuery({
    queryKey: [...queryKeys.notifications, userId ?? "guest"] as const,
    queryFn: async (): Promise<Notification[]> => {
      const response = await ApiClient.request<{ notifications: Notification[] }>(
        API_ROUTES.NOTIFICATIONS.BASE,
        {
          schema: apiResponseSchemas.notifications,
        }
      );

      if (!response.success) {
        throw new Error(getErrorMessage(response.error, "Bildirimler alınamadı."));
      }

      return response.data?.notifications ?? [];
    },
    enabled: Boolean(userId),
  });

  const unreadCount = useMemo(
    () => (query.data ?? []).filter((notification) => !notification.read).length,
    [query.data]
  );

  return {
    notifications: query.data ?? [],
    unreadCount,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
