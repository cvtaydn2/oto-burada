import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/session";
import { createAdminModerationAction } from "@/services/admin/moderation-actions";
import { updateDatabaseReportStatus } from "@/services/reports/report-submissions";
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
  const note =
    typeof body === "object" && body !== null && "note" in body ? String(body.note ?? "").trim() : "";

  if (!allowedStatuses.includes(status as ReportStatus)) {
    return NextResponse.json({ message: "Gecersiz rapor durumu." }, { status: 400 });
  }

  if (note.length > 0 && note.length < 3) {
    return NextResponse.json(
      { message: "Moderasyon notu girersen en az 3 karakter olmali." },
      { status: 400 },
    );
  }

  const { reportId } = await context.params;
  const persistedReport = await updateDatabaseReportStatus(reportId, status as ReportStatus);

  if (!persistedReport) {
    return NextResponse.json({ message: "Guncellenecek rapor bulunamadi." }, { status: 404 });
  }

  await createAdminModerationAction({
    action:
      status === "reviewing" ? "review" : status === "resolved" ? "resolve" : "dismiss",
    adminUserId: adminUser.id,
    note: note || `Rapor durumu ${status} olarak guncellendi.`,
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

