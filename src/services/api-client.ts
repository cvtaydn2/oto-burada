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

// Guard against multiple concurrent 401 responses causing a redirect storm.
let _isRedirecting = false;

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
        // Handle 401 Unauthorized globally - redirect to login (deduplicated)
        if (
          res.status === 401 &&
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login") &&
          !_isRedirecting
        ) {
          _isRedirecting = true;
          window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
          // Reset after navigation completes or fails
          setTimeout(() => {
            _isRedirecting = false;
          }, 3000);
        }

        return {
          success: false,
          error: {
            message: json.error?.message || json.error || "Bir hata oluştu.",
            code: json.error?.code || (res.status === 401 ? "UNAUTHORIZED" : "UNKNOWN_ERROR"),
            details: json.error?.details,
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
    ApiClient.request<{ favoriteIds: string[] }>(API_ROUTES.FAVORITES.DETAIL(listingId), {
      method: "DELETE",
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

export const ReportService = {
  create: (data: { listingId: string; reason: string; description?: string }) =>
    ApiClient.request(API_ROUTES.REPORTS.BASE, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const AuthService = {
  signOut: () =>
    ApiClient.request(API_ROUTES.AUTH.SIGN_OUT, {
      method: "POST",
    }),
};

export const ProfileService = {
  get: () => ApiClient.request(API_ROUTES.PROFILE.BASE),
  update: (data: Record<string, unknown>) =>
    ApiClient.request(API_ROUTES.PROFILE.BASE, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Re-export ApiClient logic for the ListingService to use
export { ApiClient };
