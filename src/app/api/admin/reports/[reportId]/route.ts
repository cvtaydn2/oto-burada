import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/session";
import { createAdminModerationAction } from "@/services/admin/moderation-actions";
import {
  getReportById,
  parseStoredReports,
  reportsCookieName,
  reportsCookieOptions,
  replaceStoredReport,
  serializeStoredReports,
  updateDatabaseReportStatus,
  updateStoredReportStatus,
} from "@/services/reports/report-submissions";
import type { ReportStatus } from "@/types";

const allowedStatuses: ReportStatus[] = ["reviewing", "resolved", "dismissed"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  const adminUser = await requireAdminUser();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Rapor guncelleme istegi okunamadi." }, { status: 400 });
  }

  const status =
    typeof body === "object" && body !== null && "status" in body
      ? String(body.status ?? "")
      : "";

  if (!allowedStatuses.includes(status as ReportStatus)) {
    return NextResponse.json({ message: "Gecersiz rapor durumu." }, { status: 400 });
  }

  const { reportId } = await context.params;
  const persistedReport = await updateDatabaseReportStatus(reportId, status as ReportStatus);

  if (persistedReport) {
    await createAdminModerationAction({
      action:
        status === "reviewing" ? "review" : status === "resolved" ? "resolve" : "dismiss",
      adminUserId: adminUser.id,
      note: `Rapor durumu ${status} olarak guncellendi.`,
      targetId: persistedReport.id ?? reportId,
      targetType: "report",
    });

    return NextResponse.json({
      report: {
        id: persistedReport.id,
        status: persistedReport.status,
      },
      message: "Rapor durumu guncellendi.",
    });
  }

  const cookieStore = await cookies();
  const existingReports = parseStoredReports(cookieStore.get(reportsCookieName)?.value);
  const existingReport = getReportById(existingReports, reportId);

  if (!existingReport) {
    return NextResponse.json({ message: "Guncellenecek rapor bulunamadi." }, { status: 404 });
  }

  const updatedReport = updateStoredReportStatus(existingReport, status as ReportStatus);
  const response = NextResponse.json({
    report: {
      id: updatedReport.id,
      status: updatedReport.status,
    },
    message: "Rapor durumu guncellendi.",
  });

  response.cookies.set(
    reportsCookieName,
    serializeStoredReports(replaceStoredReport(existingReports, updatedReport)),
    reportsCookieOptions,
  );

  return response;
}
