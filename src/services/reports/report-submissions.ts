import { cookies } from "next/headers";

import { reportSchema } from "@/lib/validators";
import type { Report, ReportCreateInput, ReportStatus } from "@/types";

export const reportsCookieName = "oto-burada-report-submissions";

export const reportsCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
  sameSite: "lax" as const,
};

export function parseStoredReports(rawValue?: string | null) {
  if (!rawValue) {
    return [] satisfies Report[];
  }

  try {
    const parsed = JSON.parse(rawValue);
    const result = reportSchema.array().safeParse(parsed);

    if (!result.success) {
      return [] satisfies Report[];
    }

    return result.data;
  } catch {
    return [] satisfies Report[];
  }
}

export function serializeStoredReports(reports: Report[]) {
  return JSON.stringify(reports);
}

export function buildReport(
  input: ReportCreateInput,
  reporterId: string,
  existingReport?: Report,
) {
  const timestamp = new Date().toISOString();

  return reportSchema.parse({
    id: existingReport?.id ?? `report-${crypto.randomUUID()}`,
    listingId: input.listingId,
    reporterId,
    reason: input.reason,
    description: input.description ?? null,
    status: existingReport?.status ?? "open",
    createdAt: existingReport?.createdAt ?? timestamp,
    updatedAt: timestamp,
  });
}

export function replaceStoredReport(existingReports: Report[], nextReport: Report) {
  const alreadyExists = existingReports.some((report) => report.id === nextReport.id);

  if (!alreadyExists) {
    return [nextReport, ...existingReports];
  }

  return existingReports.map((report) => (report.id === nextReport.id ? nextReport : report));
}

export function getExistingActiveReport(
  reports: Report[],
  listingId: string,
  reporterId: string,
) {
  return reports.find(
    (report) =>
      report.listingId === listingId &&
      report.reporterId === reporterId &&
      (report.status === "open" || report.status === "reviewing"),
  );
}

export function getReportById(reports: Report[], reportId: string) {
  return reports.find((report) => report.id === reportId);
}

export function updateStoredReportStatus(existingReport: Report, status: ReportStatus) {
  return reportSchema.parse({
    ...existingReport,
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function getStoredReports() {
  const cookieStore = await cookies();

  return parseStoredReports(cookieStore.get(reportsCookieName)?.value).sort(
    (left, right) => Date.parse(right.updatedAt ?? right.createdAt) - Date.parse(left.updatedAt ?? left.createdAt),
  );
}
