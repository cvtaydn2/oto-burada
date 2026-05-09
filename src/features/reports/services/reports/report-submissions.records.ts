import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { reportReasonEnum, reportSchema, reportStatusEnum } from "@/lib/validators/feedback";
import type { Report, ReportCreateInput, ReportStatus } from "@/types";

const reportRowSchema = z.object({
  created_at: z.string(),
  description: z.string().nullable(),
  id: z.string(),
  listing_id: z.string(),
  reason: reportReasonEnum,
  reporter_id: z.string(),
  status: reportStatusEnum,
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
  let query = admin
    .from("reports")
    .select(reportRowSelect)
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
