import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { enforceRateLimit, getRateLimitKey, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { sanitizeDescription } from "@/lib/utils/sanitize";
import { issuesToFieldErrors } from "@/lib/utils/validation-helpers";
import { reportCreateSchema } from "@/lib/validators";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import { isValidRequestOrigin } from "@/lib/security";
import {
  createOrUpdateDatabaseReport,
  getDatabaseActiveReport,
} from "@/services/reports/report-submissions";
import { getStoredListingById } from "@/services/listings/listing-submissions";
import { ensureProfileRecord } from "@/services/profile/profile-records";
import { captureServerEvent } from "@/lib/monitoring/posthog-server";

export async function POST(request: Request) {
  // CSRF check
  if (!isValidRequestOrigin(request)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek kaynağı.", 403);
  }

  const ipRateLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:reports:create"),
    rateLimitProfiles.general,
  );

  if (ipRateLimit) {
    return ipRateLimit.response;
  }

  if (!hasSupabaseEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase ortam değişkenleri eksik. Rapor göndermek için .env.local dosyasını tamamlamalısın.",
      503,
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
      issuesToFieldErrors(parsed.error.issues),
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Rapor göndermek için giriş yapmalısın.", 401);
  }

  const userRateLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "reports:create"),
    rateLimitProfiles.reportCreate,
  );

  if (userRateLimit) {
    return userRateLimit.response;
  }

  const listing = await getStoredListingById(parsed.data.listingId);

  if (!listing) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Raporlanacak ilan bulunamadı.", 404);
  }

  if (listing.sellerId === user.id) {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Kendi ilanını raporlayamazsın.", 403);
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
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Rapor kaydedilemedi. Lütfen tekrar dene.", 500);
  }

  captureServerEvent("report_submitted", {
    userId: user.id,
    reportId: persistedReport.id,
    listingId: sanitizedData.listingId,
    reason: sanitizedData.reason,
    isUpdate: Boolean(activeDatabaseReport),
  }, user.id);

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
    201,
  );
}
