import { requireApiAdminUser } from "@/lib/auth/api-admin";
import { createAdminModerationAction } from "@/services/admin/moderation-actions";
import { updateDatabaseReportStatus } from "@/services/reports/report-submissions";
import { getStoredListingById } from "@/services/listings/listing-submissions";
import { createDatabaseNotification } from "@/services/notifications/notification-records";
import type { ReportStatus } from "@/types";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { checkRateLimit } from "@/lib/utils/rate-limit-middleware";
import { headers } from "next/headers";
import { sanitizeText } from "@/lib/utils/sanitize";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";

async function getClientIp() {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  return (forwarded?.split(",")[0]?.trim() || realIp || "unknown");
}

const allowedStatuses: ReportStatus[] = ["reviewing", "resolved", "dismissed"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  const clientIp = await getClientIp();
  const ipRateLimit = checkRateLimit(`admin:report:${clientIp}`, rateLimitProfiles.adminModerate);

  if (!ipRateLimit.allowed) {
    return apiError(API_ERROR_CODES.RATE_LIMITED, "Çok fazla rapor isteği. Lütfen bekle.", 429);
  }

  const adminUser = await requireApiAdminUser();

  if (adminUser instanceof Response) {
    return adminUser;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Rapor güncelleme isteği okunamadı.", 400);
  }

  const status =
    typeof body === "object" && body !== null && "status" in body
      ? String(body.status ?? "")
      : "";
  const rawNote =
    typeof body === "object" && body !== null && "note" in body ? String(body.note ?? "").trim() : "";
  const note = rawNote ? sanitizeText(rawNote) : "";

  if (!allowedStatuses.includes(status as ReportStatus)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz rapor durumu.", 400);
  }

  if (note.length > 0 && note.length < 3) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Moderasyon notu girersen en az 3 karakter olmalı.", 400);
  }

  const { reportId } = await context.params;
  const persistedReport = await updateDatabaseReportStatus(reportId, status as ReportStatus);

  if (!persistedReport) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Güncellenecek rapor bulunamadı.", 404);
  }

  await createAdminModerationAction({
    action:
      status === "reviewing" ? "review" : status === "resolved" ? "resolve" : "dismiss",
    adminUserId: adminUser.id,
    note: note || `Rapor durumu ${status} olarak güncellendi.`,
    targetId: persistedReport.id ?? reportId,
    targetType: "report",
  });

  const relatedListing = await getStoredListingById(persistedReport.listingId);
  const reportHref = relatedListing?.slug ? `/listing/${relatedListing.slug}` : null;
  const reportStatusMessage =
    status === "reviewing"
      ? "incelemeye alindi"
      : status === "resolved"
        ? "cozuldu"
        : "kapatildi";

  await createDatabaseNotification({
    href: reportHref,
    message: relatedListing
      ? `"${relatedListing.title}" ilanı icin gonderdigin rapor ${reportStatusMessage}.`
      : `Gonderdigin rapor ${reportStatusMessage}.`,
    title: "Rapor durumun guncellendi",
    type: "report",
    userId: persistedReport.reporterId,
  });

  return apiSuccess(
    {
      report: {
        id: persistedReport.id,
        status: persistedReport.status,
      },
    },
    "Rapor durumu güncellendi.",
  );
}
