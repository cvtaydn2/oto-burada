import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withAuth, withAuthAndCsrf } from "@/lib/api/security";
import { captureServerEvent } from "@/lib/monitoring/posthog-server";
import { rateLimitProfiles } from "@/lib/rate-limiting/rate-limit";
import { issuesToFieldErrors } from "@/lib/utils/validation-helpers";
import { savedSearchCreateSchema } from "@/lib/validators";
import {
  createOrUpdateDatabaseSavedSearch,
  getStoredSavedSearchesByUser,
} from "@/services/saved-searches/saved-search-records";
import { hasMeaningfulSavedSearchFilters } from "@/services/saved-searches/saved-search-utils";

export async function GET(request: Request) {
  // Security checks: Auth + Rate limiting
  const security = await withAuth(request, {
    ipRateLimit: rateLimitProfiles.general,
    rateLimitKey: "saved-searches:list",
  });

  if (!security.ok) return security.response;

  const user = security.user!; // Guaranteed by withAuth

  const savedSearches = await getStoredSavedSearchesByUser(user.id);

  return apiSuccess({ savedSearches });
}

export async function POST(request: Request) {
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withAuthAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.general,
    rateLimitKey: "saved-searches:create",
  });

  if (!security.ok) return security.response;

  const user = security.user!; // Guaranteed by withAuth

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
      issuesToFieldErrors(parsed.error.issues)
    );
  }

  if (!hasMeaningfulSavedSearchFilters(parsed.data.filters)) {
    return apiError(
      API_ERROR_CODES.BAD_REQUEST,
      "Kayitli arama icin en az bir filtre veya arama kelimesi secmelisin.",
      400
    );
  }

  // P1 Security: Removed ensureProfileRecord() - no side effects in mutations
  const savedSearch = await createOrUpdateDatabaseSavedSearch(user.id, parsed.data);

  if (!savedSearch) {
    return apiError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Arama kaydedilemedi. Lütfen tekrar dene.",
      500
    );
  }

  captureServerEvent(
    "saved_search_created",
    {
      userId: user.id,
      savedSearchId: savedSearch.id,
      filters: parsed.data.filters,
    },
    user.id
  );

  return apiSuccess(
    { savedSearch },
    "Araman kaydedildi. Yeni sonuclar geldiginde dashboard'dan takip edebilirsin.",
    201
  );
}
