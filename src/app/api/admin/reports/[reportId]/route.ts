import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withAdminRoute } from "@/lib/api/security";
import { captureServerEvent } from "@/lib/monitoring/posthog-server";
import { rateLimitProfiles } from "@/lib/rate-limiting/rate-limit";
import { sanitizeText } from "@/lib/sanitization/sanitize";
import { createAdminModerationAction } from "@/services/admin/moderation-actions";
import { getStoredListingById } from "@/services/listings/listing-submissions";
import { createDatabaseNotification } from "@/services/notifications/notification-records";
import { updateDatabaseReportStatus } from "@/services/reports/report-submissions";
import type { ReportStatus } from "@/types";

const allowedStatuses: ReportStatus[] = ["reviewing", "resolved", "dismissed"];

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

  const status =
    typeof body === "object" && body !== null && "status" in body ? String(body.status ?? "") : "";
  const rawNote =
    typeof body === "object" && body !== null && "note" in body
      ? String(body.note ?? "").trim()
      : "";
  const note = rawNote ? sanitizeText(rawNote) : "";

  if (!allowedStatuses.includes(status as ReportStatus)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz rapor durumu.", 400);
  }

  if (note.length > 0 && note.length < 3) {
    return apiError(
      API_ERROR_CODES.BAD_REQUEST,
      "Moderasyon notu girersen en az 3 karakter olmalı.",
      400
    );
  }

  const { reportId } = await context.params;
  const persistedReport = await updateDatabaseReportStatus(reportId, status as ReportStatus);

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
    "admin_report_resolved",
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
