import { API_ROUTES } from "@/lib/constants/api-routes";
import { apiResponseSchemas } from "@/lib/validators/api-responses";

import { ApiClient } from "../api-client";

export class FavoriteService {
  static async addFavorite(listingId: string) {
    return ApiClient.request<{ favoriteIds: string[] }>(API_ROUTES.FAVORITES.BASE, {
      method: "POST",
      body: JSON.stringify({ listingId }),
      schema: apiResponseSchemas.favoriteIds,
    });
  }

  static async removeFavorite(listingId: string) {
    return ApiClient.request<{ favoriteIds: string[] }>(API_ROUTES.FAVORITES.BASE, {
      method: "DELETE",
      body: JSON.stringify({ listingId }),
      schema: apiResponseSchemas.favoriteIds,
    });
  }
}
