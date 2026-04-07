import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { ZodIssue } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { enforceRateLimit, getRateLimitKey, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { sanitizeDescription } from "@/lib/utils/sanitize";
import { reportCreateSchema } from "@/lib/validators";
import {
  buildReport,
  createOrUpdateDatabaseReport,
  getDatabaseActiveReport,
  getExistingActiveReport,
  parseStoredReports,
  reportsCookieName,
  reportsCookieOptions,
  replaceStoredReport,
  serializeStoredReports,
} from "@/services/reports/report-submissions";
import { getAllKnownListings } from "@/services/listings/marketplace-listings";
import { ensureProfileRecord } from "@/services/profile/profile-records";

function issuesToFieldErrors(issues: ZodIssue[]) {
  return issues.reduce<Record<string, string>>((fieldErrors, issue) => {
    const path = issue.path.join(".");

    if (!path || fieldErrors[path]) {
      return fieldErrors;
    }

    fieldErrors[path] = issue.message;
    return fieldErrors;
  }, {});
}

export async function POST(request: Request) {
  const ipRateLimit = enforceRateLimit(
    getRateLimitKey(request, "api:reports:create"),
    rateLimitProfiles.general,
  );

  if (ipRateLimit) {
    return ipRateLimit.response;
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        message:
          "Supabase ortam degiskenleri eksik. Rapor gonderebilmek icin .env.local dosyasini tamamlamalisin.",
      },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Gonderilen form verisi okunamadi." }, { status: 400 });
  }

  const parsed = reportCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message ?? "Form alanlarini kontrol et.",
        fieldErrors: issuesToFieldErrors(parsed.error.issues),
      },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { message: "Rapor gonderebilmek icin giris yapmalisin." },
      { status: 401 },
    );
  }

  const userRateLimit = enforceRateLimit(
    getUserRateLimitKey(user.id, "reports:create"),
    rateLimitProfiles.reportCreate,
  );

  if (userRateLimit) {
    return userRateLimit.response;
  }

  const matchedListing = (await getAllKnownListings()).find(
    (listing) => listing.id === parsed.data.listingId,
  );

  if (!matchedListing) {
    return NextResponse.json({ message: "Raporlanacak ilan bulunamadi." }, { status: 404 });
  }

  if (matchedListing.sellerId === user.id) {
    return NextResponse.json(
      { message: "Kendi ilanini raporlayamazsin." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const existingReports = parseStoredReports(cookieStore.get(reportsCookieName)?.value);
  await ensureProfileRecord(user);

  const sanitizedData = {
    ...parsed.data,
    description: parsed.data.description ? sanitizeDescription(parsed.data.description) : parsed.data.description,
  };

  const activeDatabaseReport = await getDatabaseActiveReport(sanitizedData.listingId, user.id);
  const persistedReport = await createOrUpdateDatabaseReport(
    sanitizedData,
    user.id,
    activeDatabaseReport,
  );

  if (persistedReport) {
    return NextResponse.json({
      report: {
        id: persistedReport.id,
        status: persistedReport.status,
      },
      message: activeDatabaseReport
        ? "Ayni ilan icin acik raporun guncellendi."
        : "Raporun inceleme sirasina alindi.",
    });
  }

  const activeReport = getExistingActiveReport(existingReports, parsed.data.listingId, user.id);
  const nextReport = buildReport(parsed.data, user.id, activeReport);
  const response = NextResponse.json({
    report: {
      id: nextReport.id,
      status: nextReport.status,
    },
    message: activeReport
      ? "Ayni ilan icin acik raporun guncellendi."
      : "Raporun inceleme sirasina alindi.",
  });

  response.cookies.set(
    reportsCookieName,
    serializeStoredReports(replaceStoredReport(existingReports, nextReport)),
    reportsCookieOptions,
  );

  return response;
}
