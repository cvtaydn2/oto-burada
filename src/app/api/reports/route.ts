import { getStoredListingById } from "@/features/marketplace/services/listing-submissions";
import {
  createOrUpdateDatabaseReport,
  getDatabaseActiveReport,
} from "@/features/reports/services/report-submissions";
import { reportCreateSchema } from "@/lib";
import { hasSupabaseEnv } from "@/lib/env";
import { issuesToFieldErrors } from "@/lib/helpers";
import { rateLimitProfiles } from "@/lib/rate-limit";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/response";
import { sanitizeDescription } from "@/lib/sanitize";
import { withUserAndCsrf } from "@/lib/security";
import { captureServerEvent } from "@/lib/telemetry-server";

export async function POST(request: Request) {
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withUserAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.reportCreate,
    rateLimitKey: "reports:create",
  });

  if (!security.ok) return security.response;

  const user = security.user!; // Guaranteed by withAuthAndCsrf

  if (!hasSupabaseEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase ortam değişkenleri eksik. Rapor göndermek için .env.local dosyasını tamamlamalısın.",
      503
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Gönderilen form verisi okunamadı.", 400);
  }

  const parsed = reportCreateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      parsed.error.issues[0]?.message ?? "Form alanlarını kontrol et.",
      400,
      issuesToFieldErrors(parsed.error.issues)
    );
  }

  const listing = await getStoredListingById(parsed.data.listingId);

  if (!listing) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Raporlanacak ilan bulunamadı.", 404);
  }

  if (listing.sellerId === user.id) {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Kendi ilanını raporlayamazsın.", 403);
  }

  // Profile check - read-only, no side effects
  const sanitizedData = {
    ...parsed.data,
    description: parsed.data.description
      ? sanitizeDescription(parsed.data.description)
      : parsed.data.description,
  };

  const activeDatabaseReport = await getDatabaseActiveReport(sanitizedData.listingId, user.id);
  const persistedReport = await createOrUpdateDatabaseReport(
    sanitizedData,
    user.id,
    activeDatabaseReport
  );

  if (!persistedReport) {
    return apiError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Rapor kaydedilemedi. Lütfen tekrar dene.",
      500
    );
  }

  captureServerEvent(
    "report_submitted",
    {
      userId: user.id,
      reportId: persistedReport.id,
      listingId: sanitizedData.listingId,
      reason: sanitizedData.reason,
      isUpdate: Boolean(activeDatabaseReport),
    },
    user.id
  );

  return apiSuccess(
    {
      report: {
        id: persistedReport.id,
        status: persistedReport.status,
      },
    },
    activeDatabaseReport
      ? "Aynı ilan için açık raporun güncellendi."
      : "Raporun inceleme sırasına alındı.",
    201
  );
}
