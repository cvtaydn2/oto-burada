/**
 * Centralized API Client following the Service Pattern.
 * Decouples UI components from fetch implementation and endpoint strings.
 */

export class ApiClient {
  private static async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<{ data?: T; error?: string; success: boolean }> {
    try {
      const res = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers || {}),
        },
      });

      const json = await res.json();

      if (!res.ok) {
        return { success: false, error: json.error || "Bir hata oluştu." };
      }

      return { success: true, data: json.data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Beklenmedik bir ağ hatası.",
      };
    }
  }

  static admin = {
    users: {
      grantCredits: (userId: string, credits: number, note: string) =>
        ApiClient.request(`/api/admin/users/${userId}`, {
          method: "POST",
          body: JSON.stringify({ action: "grant_credits", credits, note }),
        }),

      grantDoping: (userId: string, listingId: string, dopingTypes: string[]) =>
        ApiClient.request(`/api/admin/users/${userId}`, {
          method: "POST",
          body: JSON.stringify({ action: "grant_doping", listingId, dopingTypes, durationDays: 7 }),
        }),

      toggleBan: (userId: string, currentStatus: boolean) =>
        ApiClient.request(`/api/admin/users/${userId}`, {
          method: "POST",
          body: JSON.stringify({ action: "toggle_ban", currentStatus }),
        }),
    },
    listings: {
      moderate: (listingId: string, action: "approve" | "reject", note?: string) =>
        ApiClient.request(`/api/admin/listings/${listingId}/moderate`, {
          method: "POST",
          body: JSON.stringify({ action, note }),
        }),
    },
  };

  static listings = {
    create: (data: Record<string, unknown>) =>
      ApiClient.request("/api/listings", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      ApiClient.request(`/api/listings/${id}`, {
        method: "DELETE",
      }),
  };
}
