import { ApiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/api-routes";

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
