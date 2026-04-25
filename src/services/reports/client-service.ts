import { ApiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/api-routes";

export const ReportService = {
  create: (data: { listingId: string; reason: string; description?: string }) =>
    ApiClient.request(API_ROUTES.REPORTS.BASE, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
