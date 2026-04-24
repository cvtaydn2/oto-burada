import { ApiClient } from "../api-client";

export class FavoriteService {
  static async addFavorite(listingId: string) {
    return ApiClient.favorites.add(listingId);
  }

  static async removeFavorite(listingId: string) {
    return ApiClient.favorites.remove(listingId);
  }
}
