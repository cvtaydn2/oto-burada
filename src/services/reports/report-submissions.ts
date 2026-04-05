import { cookies } from "next/headers";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { reportSchema } from "@/lib/validators";
import type { Report, ReportCreateInput, ReportStatus } from "@/types";

export const reportsCookieName = "oto-burada-report-submissions";

export const reportsCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
  sameSite: "lax" as const,
};

interface ReportRow {
  created_at: string;
  description: string | null;
  id: string;
  listing_id: string;
  reason: Report["reason"];
  reporter_id: string;
  status: ReportStatus;
  updated_at: string;
}

function mergeReports(primary: Report[], secondary: Report[]) {
  const reportMap = new Map<string, Report>();

  [...secondary, ...primary].forEach((report) => {
    reportMap.set(report.id ?? `${report.listingId}-${report.createdAt}`, report);
  });

  return [...reportMap.values()];
}

function mapReportRow(row: ReportRow) {
  return reportSchema.parse({
    createdAt: row.created_at,
    description: row.description,
    id: row.id,
    listingId: row.listing_id,
    reason: row.reason,
    reporterId: row.reporter_id,
    status: row.status,
    updatedAt: row.updated_at,
  });
}

async function getDatabaseReports(options?: {
  reporterId?: string;
  reportId?: string;
  statuses?: ReportStatus[];
}) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("reports")
    .select("id, listing_id, reporter_id, reason, description, status, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (options?.reporterId) {
    query = query.eq("reporter_id", options.reporterId);
  }

  if (options?.reportId) {
    query = query.eq("id", options.reportId);
  }

  if (options?.statuses?.length) {
    query = query.in("status", options.statuses);
  }

  const { data, error } = await query.returns<ReportRow[]>();

  if (error || !data) {
    return null;
  }

  return data.map(mapReportRow);
}

export async function getDatabaseActiveReport(listingId: string, reporterId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("reports")
    .select("id, listing_id, reporter_id, reason, description, status, created_at, updated_at")
    .eq("listing_id", listingId)
    .eq("reporter_id", reporterId)
    .in("status", ["open", "reviewing"])
    .maybeSingle<ReportRow>();

  if (error || !data) {
    return null;
  }

  return mapReportRow(data);
}

export async function createOrUpdateDatabaseReport(
  input: ReportCreateInput,
  reporterId: string,
  existingReport?: Report | null,
) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const timestamp = new Date().toISOString();

  if (existingReport?.id) {
    const { error } = await admin
      .from("reports")
      .update({
        description: input.description ?? null,
        reason: input.reason,
        updated_at: timestamp,
      })
      .eq("id", existingReport.id);

    if (error) {
      return null;
    }

    return (await getDatabaseReports({ reportId: existingReport.id }))?.[0] ?? null;
  }

  const { data, error } = await admin
    .from("reports")
    .insert({
      description: input.description ?? null,
      listing_id: input.listingId,
      reason: input.reason,
      reporter_id: reporterId,
      status: "open" satisfies ReportStatus,
    })
    .select("id, listing_id, reporter_id, reason, description, status, created_at, updated_at")
    .single<ReportRow>();

  if (error || !data) {
    return null;
  }

  return mapReportRow({
    ...data,
    updated_at: data.updated_at ?? timestamp,
  });
}

export async function updateDatabaseReportStatus(reportId: string, status: ReportStatus) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("reports")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    return null;
  }

  return (await getDatabaseReports({ reportId }))?.[0] ?? null;
}

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

export async function getLegacyStoredReports() {
  const cookieStore = await cookies();

  return parseStoredReports(cookieStore.get(reportsCookieName)?.value).sort(
    (left, right) =>
      Date.parse(right.updatedAt ?? right.createdAt) - Date.parse(left.updatedAt ?? left.createdAt),
  );
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
  const cookieReports = await getLegacyStoredReports();
  const databaseReports = await getDatabaseReports();

  if (databaseReports) {
    return mergeReports(databaseReports, cookieReports).sort(
      (left, right) =>
        Date.parse(right.updatedAt ?? right.createdAt) -
        Date.parse(left.updatedAt ?? left.createdAt),
    );
  }

  return cookieReports.sort(
    (left, right) => Date.parse(right.updatedAt ?? right.createdAt) - Date.parse(left.updatedAt ?? left.createdAt),
  );
}

export async function getStoredReportsByReporter(reporterId: string) {
  const reports = await getStoredReports();

  return reports
    .filter((report) => report.reporterId === reporterId)
    .sort(
      (left, right) =>
        Date.parse(right.updatedAt ?? right.createdAt) -
        Date.parse(left.updatedAt ?? left.createdAt),
    );
}

export async function getLegacyStoredReportsByReporter(reporterId: string) {
  return (await getLegacyStoredReports())
    .filter((report) => report.reporterId === reporterId)
    .sort(
      (left, right) =>
        Date.parse(right.updatedAt ?? right.createdAt) -
        Date.parse(left.updatedAt ?? left.createdAt),
    );
}

export async function upsertDatabaseReportRecord(report: Report) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("reports")
    .upsert(
      {
        created_at: report.createdAt,
        description: report.description ?? null,
        id: report.id,
        listing_id: report.listingId,
        reason: report.reason,
        reporter_id: report.reporterId,
        status: report.status,
        updated_at: report.updatedAt ?? report.createdAt,
      },
      { onConflict: "id" },
    )
    .select("id, listing_id, reporter_id, reason, description, status, created_at, updated_at")
    .single<ReportRow>();

  if (error || !data) {
    return null;
  }

  return mapReportRow(data);
}
