import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { ZodIssue } from "zod";

import { exampleListings } from "@/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { reportCreateSchema } from "@/lib/validators";
import {
  buildReport,
  getExistingActiveReport,
  parseStoredReports,
  reportsCookieName,
  reportsCookieOptions,
  replaceStoredReport,
  serializeStoredReports,
} from "@/services/reports/report-submissions";
import { getStoredListings } from "@/services/listings/listing-submissions";

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

  const storedListings = await getStoredListings();
  const matchedListing = [...exampleListings, ...storedListings].find(
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
