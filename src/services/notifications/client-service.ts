import { API_ROUTES } from "@/lib/constants/api-routes";
import { ApiClient } from "@/lib/utils/api-client";
import { apiResponseSchemas } from "@/lib/validators/api-responses";
import type { Notification } from "@/types";

export const NotificationService = {
  getAll: () =>
    ApiClient.request<{ notifications: Notification[] }>(API_ROUTES.NOTIFICATIONS.BASE, {
      schema: apiResponseSchemas.notifications,
    }),
};
