import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  getLegacyStoredListings,
  getLegacyStoredUserListings,
  serializeStoredListings,
  upsertDatabaseListingRecord,
} from "@/services/listings/listing-submissions";
import { listingSubmissionsCookieName, listingSubmissionsCookieOptions } from "@/services/listings/constants";
import {
  getLegacyStoredReports,
  getLegacyStoredReportsByReporter,
  reportsCookieName,
  reportsCookieOptions,
  serializeStoredReports,
  upsertDatabaseReportRecord,
} from "@/services/reports/report-submissions";

export async function POST() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { message: "Supabase ortam degiskenleri eksik. Legacy sync baslatilamadi." },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { message: "Legacy verileri tasimak icin giris yapmalisin." },
      { status: 401 },
    );
  }

  // P1 Security: Removed ensureProfileRecord() - no side effects in migrations
  const legacyListings = await getLegacyStoredUserListings(user.id);
  const legacyReports = await getLegacyStoredReportsByReporter(user.id);
  let migratedListings = 0;
  let migratedReports = 0;

  for (const listing of legacyListings) {
    const persisted = await upsertDatabaseListingRecord(listing);

    if (persisted) {
      migratedListings += 1;
    }
  }

  for (const report of legacyReports) {
    const persisted = await upsertDatabaseReportRecord(report);

    if (persisted) {
      migratedReports += 1;
    }
  }

  const allLegacyListings = await getLegacyStoredListings();
  const allLegacyReports = await getLegacyStoredReports();
  const remainingListings = allLegacyListings.filter((listing) => listing.sellerId !== user.id);
  const remainingReports = allLegacyReports.filter((report) => report.reporterId !== user.id);

  const response = NextResponse.json({
    counts: {
      listings: migratedListings,
      reports: migratedReports,
    },
    message:
      migratedListings === 0 && migratedReports === 0
        ? "Tasinacak legacy veri bulunamadi."
        : "Legacy kayitlar Supabase tarafina tasindi.",
  });

  response.cookies.set(
    listingSubmissionsCookieName,
    serializeStoredListings(remainingListings),
    listingSubmissionsCookieOptions,
  );
  response.cookies.set(
    reportsCookieName,
    serializeStoredReports(remainingReports),
    reportsCookieOptions,
  );

  return response;
}
