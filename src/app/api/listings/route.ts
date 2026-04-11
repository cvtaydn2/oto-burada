import { hasSupabaseEnv } from "@/lib/supabase/env";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { enforceRateLimit, getRateLimitKey, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { sanitizeText, sanitizeDescription } from "@/lib/utils/sanitize";
import { issuesToFieldErrors } from "@/lib/utils/validation-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listingCreateFormSchema, listingCreateSchema } from "@/lib/validators";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import {
  buildPendingListing,
  createDatabaseListing,
  getStoredListings,
} from "@/services/listings/listing-submissions";
import { ensureProfileRecord } from "@/services/profile/profile-records";
import { checkListingLimit } from "@/services/listings/listing-limits";
import { parseListingFiltersFromSearchParams } from "@/services/listings/listing-filters";
import { getFilteredMarketplaceListings } from "@/services/listings/marketplace-listings";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Convert URLSearchParams to a key-value object
  const paramsObj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    paramsObj[key] = value;
  });

  const filters = parseListingFiltersFromSearchParams(paramsObj);
  
  try {
    const result = await getFilteredMarketplaceListings(filters);
    return apiSuccess(result);
  } catch (error) {
    console.error("GET /api/listings error:", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlanlar yüklenirken bir hata oluştu.", 500);
  }
}

export async function POST(request: Request) {
  const ipRateLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:listings:create"),
    rateLimitProfiles.general,
  );

  if (ipRateLimit) {
    return ipRateLimit.response;
  }

  if (!hasSupabaseEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase ortam değişkenleri eksik. İlan oluşturmak için .env.local dosyasını tamamlamalısın.",
      503,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Gönderilen form verisi okunamadı. Lütfen tekrar dene.", 400);
  }

  const parsedFormValues = listingCreateFormSchema.safeParse(body);

  if (!parsedFormValues.success) {
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      parsedFormValues.error.issues[0]?.message ?? "Form alanlarını kontrol et.",
      400,
      issuesToFieldErrors(parsedFormValues.error.issues),
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Oturum doğrulanamadı. Lütfen tekrar giriş yap.", 401);
  }

  const listingLimit = await checkListingLimit(user.id);
  if (!listingLimit.allowed) {
    return apiError(API_ERROR_CODES.FORBIDDEN, listingLimit.reason ?? "İlan sınırına ulaştın.", 403);
  }

  const userRateLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "listings:create"),
    rateLimitProfiles.listingCreate,
  );

  if (userRateLimit) {
    return userRateLimit.response;
  }

  const normalizedInput = {
    ...parsedFormValues.data,
    title: sanitizeText(parsedFormValues.data.title),
    description: sanitizeDescription(parsedFormValues.data.description),
    images: parsedFormValues.data.images
      .filter(
        (image: { url?: string; storagePath?: string }) =>
          (image.url ?? "").trim().length > 0 &&
          (image.storagePath ?? "").trim().length > 0,
      )
      .map((image: { url?: string; storagePath?: string }, index: number) => ({
        storagePath: image.storagePath?.trim() ?? "",
        url: image.url?.trim() ?? "",
        order: index,
        isCover: index === 0,
      })),
  };

  const parsedListingInput = listingCreateSchema.safeParse(normalizedInput);

  if (!parsedListingInput.success) {
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      parsedListingInput.error.issues[0]?.message ?? "İlan bilgileri doğrulanamadı.",
      400,
      issuesToFieldErrors(parsedListingInput.error.issues),
    );
  }

  await ensureProfileRecord(user);

  const existingListings = await getStoredListings();
  const createdListing = buildPendingListing(parsedListingInput.data, user.id, existingListings);
  const result = await createDatabaseListing(createdListing);

  if (result.error === "slug_collision") {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Bu başlıkla bir ilan zaten mevcut. Lütfen başlığı değiştir.", 409);
  }

  if (result.listing) {
    return apiSuccess(
      {
        message: "İlanın kaydedildi ve moderasyon incelemesine gönderildi.",
        listing: {
          id: result.listing.id,
          slug: result.listing.slug,
          status: result.listing.status,
          title: result.listing.title,
        },
      },
      undefined,
      201,
    );
  }

  return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlan kaydedilemedi. Lütfen tekrar dene.", 500);
}
