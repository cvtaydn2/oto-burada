"use server";

import { requireAdminUser } from "@/features/auth/lib/session";
import { getStoredListingById } from "@/features/marketplace/services/listing-submissions";
import { createDatabaseNotification } from "@/features/notifications/services/notification-records";
import { updateDatabaseReportStatus } from "@/features/reports/services/report-submissions";
import { sanitizeText } from "@/lib/sanitize";
import type { ReportStatus } from "@/types";

import { createAdminModerationAction } from "./moderation-actions";

const allowedStatuses: ReportStatus[] = ["reviewing", "resolved", "dismissed"];

export async function updateAdminReportStatusAction(params: {
  reportId: string;
  status: ReportStatus;
  note?: string;
}) {
  const adminUser = await requireAdminUser();

  if (!allowedStatuses.includes(params.status)) {
    throw new Error("Geçersiz rapor durumu.");
  }

  const note = params.note ? sanitizeText(params.note).trim() : "";
  if (note.length > 0 && note.length < 3) {
    throw new Error("Moderasyon notu girersen en az 3 karakter olmalı.");
  }

  const persistedReport = await updateDatabaseReportStatus(params.reportId, params.status);
  if (!persistedReport) {
    throw new Error("Güncellenecek rapor bulunamadı.");
  }

  await createAdminModerationAction({
    action:
      params.status === "reviewing"
        ? "review"
        : params.status === "resolved"
          ? "resolve"
          : "dismiss",
    adminUserId: adminUser.id,
    note: note || `Rapor durumu ${params.status} olarak güncellendi.`,
    targetId: persistedReport.id ?? params.reportId,
    targetType: "report",
  });

  const relatedListing = await getStoredListingById(persistedReport.listingId);
  const reportHref = relatedListing?.slug ? `/listing/${relatedListing.slug}` : null;
  const reportStatusMessage =
    params.status === "reviewing"
      ? "incelemeye alındı"
      : params.status === "resolved"
        ? "çözüldü"
        : "kapatıldı";

  await createDatabaseNotification({
    href: reportHref,
    message: relatedListing
      ? `"${relatedListing.title}" ilanı için gönderdiğin rapor ${reportStatusMessage}.`
      : `Gönderdiğin rapor ${reportStatusMessage}.`,
    title: "Rapor durumun güncellendi",
    type: "report",
    userId: persistedReport.reporterId,
  });

  return {
    report: {
      id: persistedReport.id,
      status: persistedReport.status,
    },
  };
}
