/**
 * Centralized API Client following the Service Pattern.
 * Decouples UI components from fetch implementation and endpoint strings.
 */

import { API_ROUTES } from "@/lib/constants/api-routes";
import type { Notification } from "@/types";
import type { ApiResponse } from "@/types/errors";

export class ApiClient {
  private static async request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers || {}),
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: {
            message: json.error?.message || json.error || "Bir hata oluştu.",
            code: json.error?.code,
          },
        };
      }

      return { success: true, data: json.data };
    } catch (err) {
      return {
        success: false,
        error: {
          message: err instanceof Error ? err.message : "Beklenmedik bir ağ hatası.",
        },
      };
    }
  }

  static admin = {
    users: {
      grantCredits: (userId: string, credits: number, note: string) =>
        ApiClient.request(API_ROUTES.ADMIN.USERS.DETAIL(userId), {
          method: "POST",
          body: JSON.stringify({ action: "grant_credits", credits, note }),
        }),

      grantDoping: (userId: string, listingId: string, dopingTypes: string[]) =>
        ApiClient.request(API_ROUTES.ADMIN.USERS.DETAIL(userId), {
          method: "POST",
          body: JSON.stringify({ action: "grant_doping", listingId, dopingTypes, durationDays: 7 }),
        }),

      toggleBan: (userId: string, currentStatus: boolean) =>
        ApiClient.request(API_ROUTES.ADMIN.USERS.DETAIL(userId), {
          method: "POST",
          body: JSON.stringify({ action: "toggle_ban", currentStatus }),
        }),
    },
    listings: {
      moderate: (listingId: string, action: "approve" | "reject", note?: string) =>
        ApiClient.request(API_ROUTES.ADMIN.LISTINGS.MODERATE(listingId), {
          method: "POST",
          body: JSON.stringify({ action, note }),
        }),
    },
  };

  static listings = {
    create: (data: Record<string, unknown>) =>
      ApiClient.request(API_ROUTES.LISTINGS.BASE, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      ApiClient.request(API_ROUTES.LISTINGS.DETAIL(id), {
        method: "DELETE",
      }),

    archive: (id: string) =>
      ApiClient.request(API_ROUTES.LISTINGS.ARCHIVE(id), {
        method: "POST",
      }),

    bump: (id: string) =>
      ApiClient.request<{ message: string }>(API_ROUTES.LISTINGS.BUMP(id), {
        method: "POST",
      }),

    bulkArchive: (ids: string[]) =>
      ApiClient.request(API_ROUTES.LISTINGS.BULK_ARCHIVE, {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),

    bulkDelete: (ids: string[]) =>
      ApiClient.request(API_ROUTES.LISTINGS.BULK_DELETE, {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),

    bulkDraft: (ids: string[]) =>
      ApiClient.request(API_ROUTES.LISTINGS.BULK_DRAFT, {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),
  };

  static notifications = {
    getAll: () =>
      ApiClient.request<{ notifications: Notification[] }>(API_ROUTES.NOTIFICATIONS.BASE),
  };

  static favorites = {
    add: (listingId: string) =>
      ApiClient.request<{ favoriteIds: string[] }>(API_ROUTES.FAVORITES, {
        method: "POST",
        body: JSON.stringify({ listingId }),
      }),

    remove: (listingId: string) =>
      ApiClient.request<{ favoriteIds: string[] }>(API_ROUTES.FAVORITES, {
        method: "DELETE",
        body: JSON.stringify({ listingId }),
      }),
  };

  static support = {
    createTicket: (data: Record<string, unknown>) =>
      ApiClient.request(API_ROUTES.SUPPORT.TICKETS, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  };
}
