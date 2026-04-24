import { API_ROUTES } from "@/lib/constants/api-routes";
import { ApiClient } from "@/lib/utils/api-client";

export const PaymentService = {
  initialize: (listingId: string, packageId: string) =>
    ApiClient.request<{ paymentPageUrl: string; token: string }>(API_ROUTES.PAYMENTS.INITIALIZE, {
      method: "POST",
      body: JSON.stringify({ listingId, packageId }),
    }),

  retrieve: (token: string) =>
    ApiClient.request<{ status: string; paymentId: string }>(API_ROUTES.PAYMENTS.RETRIEVE(token)),
};
