import { ApiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { apiResponseSchemas } from "@/lib/validators/api-responses";
import type { Listing } from "@/types";

export class ListingService {
  static async createListing(data: Record<string, unknown>) {
    return ApiClient.request<{
      message: string;
      listing: { id: string; slug: string; status: string };
    }>(API_ROUTES.LISTINGS.BASE, {
      method: "POST",
      body: JSON.stringify(data),
      schema: apiResponseSchemas.listingCreate,
    });
  }

  static async updateListing(id: string, data: Record<string, unknown>) {
    return ApiClient.request<{
      listing: { id: string; slug: string; status: string; title: string };
    }>(API_ROUTES.LISTINGS.DETAIL(id), {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  static async deleteListing(id: string) {
    return ApiClient.request<{ message: string }>(API_ROUTES.LISTINGS.DETAIL(id), {
      method: "DELETE",
      schema: apiResponseSchemas.genericMessage,
    });
  }

  static async archiveListing(id: string) {
    return ApiClient.request<{ message: string }>(API_ROUTES.LISTINGS.ARCHIVE(id), {
      method: "POST",
      schema: apiResponseSchemas.genericMessage,
    });
  }

  static async bumpListing(id: string) {
    return ApiClient.request<{ message: string }>(API_ROUTES.LISTINGS.BUMP(id), {
      method: "POST",
      schema: apiResponseSchemas.genericMessage,
    });
  }

  static async bulkArchive(ids: string[]) {
    return ApiClient.request<{ message: string }>(API_ROUTES.LISTINGS.BULK_ARCHIVE, {
      method: "POST",
      body: JSON.stringify({ ids }),
      schema: apiResponseSchemas.genericMessage,
    });
  }

  static async bulkDelete(ids: string[]) {
    return ApiClient.request<{ message: string }>(API_ROUTES.LISTINGS.BULK_DELETE, {
      method: "POST",
      body: JSON.stringify({ ids }),
      schema: apiResponseSchemas.genericMessage,
    });
  }

  static async bulkDraft(ids: string[]) {
    return ApiClient.request<{ message: string }>(API_ROUTES.LISTINGS.BULK_DRAFT, {
      method: "POST",
      body: JSON.stringify({ ids }),
      schema: apiResponseSchemas.genericMessage,
    });
  }

  static async getMyListings(page: number = 1, limit: number = 50) {
    return ApiClient.request<{
      listings: Listing[];
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
    }>(`${API_ROUTES.LISTINGS.BASE}?view=my&page=${page}&limit=${limit}`, {
      schema: apiResponseSchemas.paginatedListings,
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
