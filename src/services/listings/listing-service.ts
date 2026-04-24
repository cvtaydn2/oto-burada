import { ApiClient } from "../api-client";

export class ListingService {
  static async createListing(data: Record<string, unknown>) {
    return ApiClient.listings.create(data);
  }

  static async deleteListing(id: string) {
    return ApiClient.listings.delete(id);
  }

  static async archiveListing(id: string) {
    return ApiClient.listings.archive(id);
  }

  static async bumpListing(id: string) {
    return ApiClient.listings.bump(id);
  }

  static async bulkArchive(ids: string[]) {
    return ApiClient.listings.bulkArchive(ids);
  }

  static async bulkDelete(ids: string[]) {
    return ApiClient.listings.bulkDelete(ids);
  }

  static async bulkDraft(ids: string[]) {
    return ApiClient.listings.bulkDraft(ids);
  }
}
