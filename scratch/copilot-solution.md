<write_file path="src/features/reports/services/reports/report-submissions.records.ts">
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { reportSchema } from "@/lib/validators/feedback";
import type { Report, ReportCreateInput, ReportStatus } from "@/types";

const reportRowSchema = z.object({
  created_at: z.string(),
  description: z.string().nullable(),
  id: z.string(),
  listing_id: z.string(),
  reason: reportSchema.shape.reason,
  reporter_id: z.string(),
  status: reportSchema.shape.status,
  updated_at: z.string(),
});

type ReportRow = z.infer<typeof reportRowSchema>;

const reportRowSelect =
  "id, listing_id, reporter_id, reason, description, status, created_at, updated_at";

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

function parseReportRows(data: unknown) {
  const parsed = z.array(reportRowSchema).safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return parsed.data.map(mapReportRow);
}

function parseReportRow(data: unknown) {
  const parsed = reportRowSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return mapReportRow(parsed.data);
}

export async function getDatabaseReportsRecord(options?: {
  reporterId?: string;
  reportId?: string;
  statuses?: ReportStatus[];
}) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  let query = admin.from("reports").select(reportRowSelect).order("updated_at", { ascending: false });

  if (options?.reporterId) {
    query = query.eq("reporter_id", options.reporterId);
  }

  if (options?.reportId) {
    query = query.eq("id", options.reportId);
  }

  if (options?.statuses?.length) {
    query = query.in("status", options.statuses);
  }

  const { data, error } = await query;

  if (error || !data) {
    return null;
  }

  return parseReportRows(data);
}

export async function getDatabaseActiveReportRecord(listingId: string, reporterId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("reports")
    .select(reportRowSelect)
    .eq("listing_id", listingId)
    .eq("reporter_id", reporterId)
    .in("status", ["open", "reviewing"])
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return parseReportRow(data);
}

export async function createOrUpdateDatabaseReportRecord(
  input: ReportCreateInput,
  reporterId: string,
  existingReport?: Report | null
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

    const reports = await getDatabaseReportsRecord({ reportId: existingReport.id });
    return reports?.[0] ?? null;
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
    .select(reportRowSelect)
    .single();

  if (error || !data) {
    return null;
  }

  const parsed = reportRowSchema.safeParse({
    ...data,
    updated_at:
      typeof data === "object" &&
      data !== null &&
      "updated_at" in data &&
      typeof data.updated_at === "string"
        ? data.updated_at
        : timestamp,
  });

  if (!parsed.success) {
    return null;
  }

  return mapReportRow(parsed.data);
}

export async function updateDatabaseReportStatusRecord(reportId: string, status: ReportStatus) {
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

  const reports = await getDatabaseReportsRecord({ reportId });
  return reports?.[0] ?? null;
}

export async function upsertDatabaseReportRowRecord(report: Report) {
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
      { onConflict: "id" }
    )
    .select(reportRowSelect)
    .single();

  if (error || !data) {
    return null;
  }

  return parseReportRow(data);
}
</write_file>

<write_file path="src/features/reports/services/reports/report-submissions.logic.ts">
import { reportSchema } from "@/lib/validators/feedback";
import type { Report, ReportCreateInput, ReportStatus } from "@/types";

export const reportsCookieName = "oto-burada-report-submissions";

export const reportsCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
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

export function buildReport(input: ReportCreateInput, reporterId: string, existingReport?: Report) {
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

export function getExistingActiveReport(reports: Report[], listingId: string, reporterId: string) {
  return reports.find(
    (report) =>
      report.listingId === listingId &&
      report.reporterId === reporterId &&
      (report.status === "open" || report.status === "reviewing")
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

export function sortReportsByUpdatedAt(reports: Report[]) {
  return [...reports].sort(
    (left, right) =>
      Date.parse(right.updatedAt ?? right.createdAt) - Date.parse(left.updatedAt ?? left.createdAt)
  );
}
</write_file>

<write_file path="src/features/reports/services/reports/report-submissions.actions.ts">
"use server";

import type { Report, ReportCreateInput, ReportStatus } from "@/types";

import {
  createOrUpdateDatabaseReportRecord,
  getDatabaseActiveReportRecord,
  getDatabaseReportsRecord,
  updateDatabaseReportStatusRecord,
  upsertDatabaseReportRowRecord,
} from "./report-submissions.records";
import { sortReportsByUpdatedAt } from "./report-submissions.logic";

export async function getDatabaseActiveReport(listingId: string, reporterId: string) {
  return getDatabaseActiveReportRecord(listingId, reporterId);
}

export async function createOrUpdateDatabaseReport(
  input: ReportCreateInput,
  reporterId: string,
  existingReport?: Report | null
) {
  return createOrUpdateDatabaseReportRecord(input, reporterId, existingReport);
}

export async function updateDatabaseReportStatus(reportId: string, status: ReportStatus) {
  return updateDatabaseReportStatusRecord(reportId, status);
}

export async function getStoredReports() {
  const databaseReports = await getDatabaseReportsRecord();
  return sortReportsByUpdatedAt(databaseReports ?? []);
}

export async function getStoredReportsByReporter(reporterId: string) {
  const databaseReports = await getDatabaseReportsRecord({ reporterId });
  return sortReportsByUpdatedAt(databaseReports ?? []);
}

export async function upsertDatabaseReportRecord(report: Report) {
  return upsertDatabaseReportRowRecord(report);
}
</write_file>

<write_file path="src/features/reports/services/reports/report-submissions.ts">
export {
  buildReport,
  getExistingActiveReport,
  getReportById,
  parseStoredReports,
  replaceStoredReport,
  reportsCookieName,
  reportsCookieOptions,
  serializeStoredReports,
  sortReportsByUpdatedAt,
  updateStoredReportStatus,
} from "./report-submissions.logic";

export {
  createOrUpdateDatabaseReport,
  getDatabaseActiveReport,
  getStoredReports,
  getStoredReportsByReporter,
  updateDatabaseReportStatus,
  upsertDatabaseReportRecord,
} from "./report-submissions.actions";
</write_file>