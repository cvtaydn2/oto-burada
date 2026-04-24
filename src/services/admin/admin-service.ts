import { API_ROUTES } from "@/lib/constants/api-routes";
import { ApiClient } from "@/lib/utils/api-client";

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
