import { z } from "zod";

import { createAdminModerationAction } from "@/features/admin-moderation/services/moderation-actions";
import { getStoredListingById } from "@/features/marketplace/services/listing-submissions";
import { createDatabaseNotification } from "@/features/notifications/services/notification-records";
import { updateDatabaseReportStatus } from "@/features/reports/services/report-submissions";
import { rateLimitProfiles } from "@/features/shared/lib/rate-limit";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/features/shared/lib/response";
import { sanitizeText } from "@/features/shared/lib/sanitize";
import { withAdminRoute } from "@/features/shared/lib/security";
import { captureServerEvent } from "@/features/shared/lib/telemetry-server";
import type { ReportStatus } from "@/types";

const allowedStatuses: ReportStatus[] = ["reviewing", "resolved", "dismissed"];

const reportUpdateSchema = z.object({
  note: z.string().trim().max(2000).optional(),
  status: z.enum(allowedStatuses),
});

export async function PATCH(request: Request, context: { params: Promise<{ reportId: string }> }) {
  const security = await withAdminRoute(request, {
    ipRateLimit: rateLimitProfiles.adminModerate,
    rateLimitKey: "admin:reports",
  });
  if (!security.ok) return security.response;
  const adminUser = security.user!;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Rapor güncelleme isteği okunamadı.", 400);
  }

  const parsed = reportUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      API_ERROR_CODES.BAD_REQUEST,
      parsed.error.issues[0]?.message ?? "Rapor güncelleme alanlarını kontrol et.",
      400
    );
  }

  const status = parsed.data.status;
  const note = parsed.data.note ? sanitizeText(parsed.data.note) : "";

  if (note.length > 0 && note.length < 3) {
    return apiError(
      API_ERROR_CODES.BAD_REQUEST,
      "Moderasyon notu girersen en az 3 karakter olmalı.",
      400
    );
  }

  const { reportId } = await context.params;
  const persistedReport = await updateDatabaseReportStatus(reportId, status);

  if (!persistedReport) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Güncellenecek rapor bulunamadı.", 404);
  }

  await createAdminModerationAction({
    action: status === "reviewing" ? "review" : status === "resolved" ? "resolve" : "dismiss",
    adminUserId: adminUser.id,
    note: note || `Rapor durumu ${status} olarak güncellendi.`,
    targetId: persistedReport.id ?? reportId,
    targetType: "report",
  });

  const relatedListing = await getStoredListingById(persistedReport.listingId);
  const reportHref = relatedListing?.slug ? `/listing/${relatedListing.slug}` : null;
  const reportStatusMessage =
    status === "reviewing" ? "incelemeye alındı" : status === "resolved" ? "çözüldü" : "kapatıldı";

  await createDatabaseNotification({
    href: reportHref,
    message: relatedListing
      ? `"${relatedListing.title}" ilanı için gönderdiğin rapor ${reportStatusMessage}.`
      : `Gönderdiğin rapor ${reportStatusMessage}.`,
    title: "Rapor durumun güncellendi",
    type: "report",
    userId: persistedReport.reporterId,
  });

  captureServerEvent(
    "admin_report_status_updated",
    {
      adminUserId: adminUser.id,
      reportId,
      status,
      listingId: persistedReport.listingId,
    },
    adminUser.id
  );

  return apiSuccess(
    {
      report: {
        id: persistedReport.id,
        status: persistedReport.status,
      },
    },
    "Rapor durumu güncellendi."
  );
}
