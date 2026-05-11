"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  deleteNotificationAction,
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/api/notifications/actions";
import { queryKeys } from "@/lib/query-keys";

export function useNotifications(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...queryKeys.notifications, userId ?? "guest"] as const,
    queryFn: () => getNotificationsAction(),
    enabled: Boolean(userId),
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationReadAction(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsReadAction(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) => deleteNotificationAction(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
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
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
  };
}
