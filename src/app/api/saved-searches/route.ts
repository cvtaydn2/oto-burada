import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { apiError, API_ERROR_CODES, apiSuccess } from "@/lib/utils/api-response";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { issuesToFieldErrors } from "@/lib/utils/validation-helpers";
import { savedSearchCreateSchema } from "@/lib/validators";
import {
  createOrUpdateDatabaseSavedSearch,
  getStoredSavedSearchesByUser,
} from "@/services/saved-searches/saved-search-records";
import { hasMeaningfulSavedSearchFilters } from "@/services/saved-searches/saved-search-utils";
import { captureServerEvent } from "@/lib/monitoring/posthog-server";
import { withAuth } from "@/lib/utils/api-security";

export async function GET(request: Request) {
  // Security checks: Auth + Rate limiting
  const security = await withAuth(request, {
    ipRateLimit: rateLimitProfiles.general,
    rateLimitKey: "saved-searches:list",
  });

  if (!security.ok) return security.response;
  
  const user = security.user!; // Guaranteed by withAuth

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Kayıtlı arama servisi hazır değil.", 503);
  }

  // P1 Security: Removed ensureProfileRecord() - GET should be read-only
  const savedSearches = await getStoredSavedSearchesByUser(user.id);

  return apiSuccess({ savedSearches });
}

export async function POST(request: Request) {
  // Security checks: Auth + Rate limiting
  const security = await withAuth(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.general,
    rateLimitKey: "saved-searches:create",
  });

  if (!security.ok) return security.response;
  
  const user = security.user!; // Guaranteed by withAuth

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Kayıtlı arama servisi hazır değil.", 503);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Kaydedilecek arama okunamadı.", 400);
  }

  const parsed = savedSearchCreateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      parsed.error.issues[0]?.message ?? "Arama alanlarını kontrol et.",
      400,
      issuesToFieldErrors(parsed.error.issues),
    );
  }

  if (!hasMeaningfulSavedSearchFilters(parsed.data.filters)) {
    return apiError(
      API_ERROR_CODES.BAD_REQUEST,
      "Kayitli arama icin en az bir filtre veya arama kelimesi secmelisin.",
      400,
    );
  }

  // P1 Security: Removed ensureProfileRecord() - no side effects in mutations
  const savedSearch = await createOrUpdateDatabaseSavedSearch(user.id, parsed.data);

  if (!savedSearch) {
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Arama kaydedilemedi. Lütfen tekrar dene.", 500);
  }

  captureServerEvent("saved_search_created", {
    userId: user.id,
    savedSearchId: savedSearch.id,
    filters: parsed.data.filters,
  }, user.id);

  return apiSuccess(
    { savedSearch },
    "Araman kaydedildi. Yeni sonuclar geldiginde dashboard'dan takip edebilirsin.",
    201,
  );
}
