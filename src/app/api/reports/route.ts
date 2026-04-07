import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { enforceRateLimit, getRateLimitKey, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { sanitizeDescription } from "@/lib/utils/sanitize";
import { issuesToFieldErrors } from "@/lib/utils/validation-helpers";
import { reportCreateSchema } from "@/lib/validators";
import {
  createOrUpdateDatabaseReport,
  getDatabaseActiveReport,
} from "@/services/reports/report-submissions";
import { getStoredListingById } from "@/services/listings/listing-submissions";
import { ensureProfileRecord } from "@/services/profile/profile-records";

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

  const listing = await getStoredListingById(parsed.data.listingId);

  if (!listing) {
    return NextResponse.json({ message: "Raporlanacak ilan bulunamadi." }, { status: 404 });
  }

  if (listing.sellerId === user.id) {
    return NextResponse.json(
      { message: "Kendi ilanini raporlayamazsin." },
      { status: 400 },
    );
  }

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

  if (!persistedReport) {
    return NextResponse.json(
      { message: "Rapor kaydedilemedi. Lutfen tekrar dene." },
      { status: 500 },
    );
  }

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
