import { API_ROUTES } from "@/lib/constants/api-routes";
import { ApiClient } from "@/lib/utils/api-client";

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
