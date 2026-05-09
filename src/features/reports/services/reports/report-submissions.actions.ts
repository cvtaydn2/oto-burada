"use server";

import type { Report, ReportCreateInput, ReportStatus } from "@/types";

import { sortReportsByUpdatedAt } from "./report-submissions.logic";
import {
  createOrUpdateDatabaseReportRecord,
  getDatabaseActiveReportRecord,
  getDatabaseReportsRecord,
  updateDatabaseReportStatusRecord,
  upsertDatabaseReportRowRecord,
} from "./report-submissions.records";

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
