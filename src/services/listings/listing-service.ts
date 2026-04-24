import { API_ROUTES } from "@/lib/constants/api-routes";
import { apiResponseSchemas } from "@/lib/validators/api-responses";
import type { Listing } from "@/types";

import { ApiClient } from "../api-client";

export class ListingService {
  static async createListing(data: Record<string, unknown>) {
    return ApiClient.request(API_ROUTES.LISTINGS.BASE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async deleteListing(id: string) {
    return ApiClient.request(API_ROUTES.LISTINGS.DETAIL(id), {
      method: "DELETE",
    });
  }

  static async archiveListing(id: string) {
    return ApiClient.request(API_ROUTES.LISTINGS.ARCHIVE(id), {
      method: "POST",
    });
  }

  static async bumpListing(id: string) {
    return ApiClient.request(API_ROUTES.LISTINGS.BUMP(id), {
      method: "POST",
      schema: apiResponseSchemas.genericMessage,
    });
  }

  static async bulkArchive(ids: string[]) {
    return ApiClient.request(API_ROUTES.LISTINGS.BULK_ARCHIVE, {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  static async bulkDelete(ids: string[]) {
    return ApiClient.request(API_ROUTES.LISTINGS.BULK_DELETE, {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  static async bulkDraft(ids: string[]) {
    return ApiClient.request(API_ROUTES.LISTINGS.BULK_DRAFT, {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  static async getMyListings() {
    return ApiClient.request<Listing[]>(API_ROUTES.LISTINGS.BASE + "?view=my", {
      schema: apiResponseSchemas.listingsList,
    });
  }

  static async getListingById(id: string) {
    return ApiClient.request<Listing>(API_ROUTES.LISTINGS.DETAIL(id), {
      schema: apiResponseSchemas.listingDetail,
    });
  }

  /**
   * Apply a doping package to a listing after successful payment.
   * Calls the activate_doping RPC via the doping API route.
   */
  static async applyDoping(params: { listingId: string; packageId: string; paymentId: string }) {
    return ApiClient.request(API_ROUTES.LISTINGS.DOPING(params.listingId), {
      method: "POST",
      body: JSON.stringify({
        packageId: params.packageId,
        paymentId: params.paymentId,
      }),
    });
  }
}
