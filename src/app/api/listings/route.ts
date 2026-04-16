import { hasSupabaseEnv } from "@/lib/supabase/env";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { enforceRateLimit, getRateLimitKey, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { sanitizeText, sanitizeDescription } from "@/lib/utils/sanitize";
import { isValidRequestOrigin } from "@/lib/security";
import { issuesToFieldErrors } from "@/lib/utils/validation-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listingCreateFormSchema, listingCreateSchema } from "@/lib/validators";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import {
  buildPendingListing,
  createDatabaseListing,
  getExistingListingSlugs,
} from "@/services/listings/listing-submissions";
import { createDatabaseNotification } from "@/services/notifications/notification-records";
import { ensureProfileRecord, getStoredProfileById, isUserBanned } from "@/services/profile/profile-records";
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
    captureServerError("GET /api/listings failed", "listings", error, { filters: paramsObj });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlanlar yüklenirken bir hata oluştu.", 500);
  }
}

export async function POST(request: Request) {
  // CSRF check — reject cross-origin requests from untrusted origins
  if (!isValidRequestOrigin(request)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek kaynağı (CSRF).", 403);
  }

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
      .map((image: { url?: string; storagePath?: string; placeholderBlur?: string | null }, index: number) => ({
        storagePath: image.storagePath?.trim() ?? "",
        url: image.url?.trim() ?? "",
        order: index,
        isCover: index === 0,
        placeholderBlur: image.placeholderBlur ?? null,
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
  const profile = await getStoredProfileById(user.id);
  
  if (!profile || !profile.emailVerified) {
    return apiError(
      API_ERROR_CODES.FORBIDDEN,
      "İlan verebilmek için e-posta adresinizi doğrulamanız gerekmektedir.",
      403,
    );
  }

  // Ban check — prevent banned users from creating listings
  const banned = await isUserBanned(user.id);
  if (banned) {
    return apiError(
      API_ERROR_CODES.FORBIDDEN,
      "Hesabınız askıya alınmıştır. Lütfen destek ekibiyle iletişime geçin.",
      403,
    );
  }

  const existingListings = await getExistingListingSlugs();
  const createdListing = buildPendingListing(parsedListingInput.data, user.id, existingListings);
  const result = await createDatabaseListing(createdListing);

  if (result.error === "slug_collision") {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Bu başlıkla bir ilan zaten mevcut. Lütfen başlığı değiştir.", 409);
  }

  if (result.listing) {
    await createDatabaseNotification({
      href: `/dashboard/listings?edit=${result.listing.id}`,
      message: `"${result.listing.title}" ilanın moderasyon incelemesine alındı. Onaylandığında sana haber vereceğiz.`,
      title: "İlanın incelemeye alındı",
      type: "moderation",
      userId: user.id,
    });

    captureServerEvent("listing_created", {
      userId: user.id,
      listingId: result.listing.id,
      listingSlug: result.listing.slug,
      listingStatus: result.listing.status,
      brand: result.listing.brand,
      model: result.listing.model,
      city: result.listing.city,
      price: result.listing.price,
    });

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

  // createDatabaseListing returned { error: "database_error" } — log it
  captureServerError("POST /api/listings — createDatabaseListing failed", "listings", null, {
    userId: user.id,
    listingId: createdListing.id,
    brand: createdListing.brand,
    model: createdListing.model,
    resultError: result.error ?? "unknown",
  }, user.id);

  return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlan kaydedilemedi. Lütfen tekrar dene.", 500);}
