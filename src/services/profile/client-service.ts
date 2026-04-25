import { ApiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/api-routes";

export const ProfileService = {
  get: () => ApiClient.request(API_ROUTES.PROFILE.BASE),
  update: (data: Record<string, unknown>) =>
    ApiClient.request(API_ROUTES.PROFILE.BASE, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
