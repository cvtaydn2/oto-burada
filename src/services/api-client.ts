import { z } from "zod";

import { API_ROUTES } from "@/lib/constants/api-routes";
import { apiResponseSchemas, createApiResponseSchema } from "@/lib/validators/api-responses";
import type { Notification } from "@/types";
import type { ApiResponse } from "@/types/errors";

/**
 * Internal API Client.
 * Use specialized Service classes instead of calling this directly.
 * @internal
 */
class ApiClient {
  static async request<T>(
    path: string,
    options?: RequestInit & { schema?: z.ZodTypeAny }
  ): Promise<ApiResponse<T>> {
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

      // Runtime Validation
      if (options?.schema) {
        const wrappedSchema = createApiResponseSchema(options.schema);
        const result = wrappedSchema.safeParse({ success: true, data: json.data });
        if (!result.success) {
          console.error("[ApiClient] Validation Error:", result.error);
          return {
            success: false,
            error: {
              message: "Sunucudan geçersiz veri geldi (Validation Error).",
              code: "VALIDATION_ERROR",
            },
          };
        }
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
}

/**
 * Specialized services that use the internal ApiClient.
 */

export const AdminService = {
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

export const FavoriteService = {
  add: (listingId: string) =>
    ApiClient.request<{ favoriteIds: string[] }>(API_ROUTES.FAVORITES.BASE, {
      method: "POST",
      body: JSON.stringify({ listingId }),
    }),

  remove: (listingId: string) =>
    ApiClient.request<{ favoriteIds: string[] }>(API_ROUTES.FAVORITES.BASE, {
      method: "DELETE",
      body: JSON.stringify({ listingId }),
    }),
};

export const NotificationService = {
  getAll: () =>
    ApiClient.request<{ notifications: Notification[] }>(API_ROUTES.NOTIFICATIONS.BASE, {
      schema: apiResponseSchemas.notifications,
    }),
};

export const SupportService = {
  createTicket: (data: Record<string, unknown>) =>
    ApiClient.request(API_ROUTES.SUPPORT.TICKETS, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const PaymentService = {
  initialize: (listingId: string, packageId: string) =>
    ApiClient.request<{ paymentPageUrl: string; token: string }>(API_ROUTES.PAYMENTS.INITIALIZE, {
      method: "POST",
      body: JSON.stringify({ listingId, packageId }),
    }),

  retrieve: (token: string) =>
    ApiClient.request<{ status: string; paymentId: string }>(API_ROUTES.PAYMENTS.RETRIEVE(token)),
};

// Re-export ApiClient logic for the ListingService to use
export { ApiClient };
