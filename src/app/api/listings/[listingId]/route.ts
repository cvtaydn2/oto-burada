import { hasSupabaseEnv } from "@/lib/supabase/env";
import { sanitizeText, sanitizeDescription } from "@/lib/utils/sanitize";
import { isValidRequestOrigin } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listingCreateFormSchema, listingCreateSchema } from "@/lib/validators";
import { issuesToFieldErrors } from "@/lib/utils/validation-helpers";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import {
  buildUpdatedListing,
  deleteDatabaseListing,
  findEditableListingById,
  getExistingListingSlugs,
  updateDatabaseListing,
} from "@/services/listings/listing-submissions";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { logger } from "@/lib/utils/logger";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  // CSRF check
  if (!isValidRequestOrigin(request)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek kaynağı.", 403);
  }

  if (!hasSupabaseEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase ortam değişkenleri eksik.",
      503,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Gönderilen form verisi okunamadı.", 400);
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
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Oturum doğrulanamadı.", 401);
  }

  const { listingId } = await context.params;
  const existingListing = await findEditableListingById(listingId, user.id);
  if (!existingListing) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Düzenlenebilir ilan bulunamadı.", 404);
  }

  const normalizedInput = {
    ...parsedFormValues.data,
    title: sanitizeText(parsedFormValues.data.title),
    description: sanitizeDescription(parsedFormValues.data.description),
    // damage_status_json: DB CHECK constraint'e uygun değerlere normalize et
    damageStatusJson: parsedFormValues.data.damageStatusJson
      ? Object.fromEntries(
          Object.entries(parsedFormValues.data.damageStatusJson).filter(
            ([, v]) => ["orjinal", "orijinal", "boyali", "lokal_boyali", "degisen", "hasarli", "belirtilmemis", "bilinmiyor"].includes(v as string)
          )
        )
      : null,
    images: parsedFormValues.data.images
      .filter(
        (image: { url?: string; storagePath?: string }) =>
          (image.url ?? "").trim().length > 0 &&
          (image.storagePath ?? "").trim().length > 0,
      )
      .map((image: { url?: string; storagePath?: string; placeholderBlur?: string | null; imageType?: string }, index: number) => ({
        storagePath: image.storagePath?.trim() ?? "",
        url: image.url?.trim() ?? "",
        order: index,
        isCover: index === 0,
        placeholderBlur: image.placeholderBlur ?? null,
        type: image.imageType === "360" ? "360" as const : "photo" as const,
      })),
  };

  const parsedListingInput = listingCreateSchema.safeParse(normalizedInput);
  if (!parsedListingInput.success) {
    logger.listings.error("PATCH /api/listings/[id] validation failed", parsedListingInput.error, {
      listingId,
      userId: user.id,
      issues: parsedListingInput.error.issues,
    });
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      parsedListingInput.error.issues[0]?.message ?? "İlan bilgileri doğrulanamadı.",
      400,
      issuesToFieldErrors(parsedListingInput.error.issues),
    );
  }

  const allListings = await getExistingListingSlugs();
  const updatedListing = buildUpdatedListing(
    parsedListingInput.data,
    existingListing,
    allListings,
  );
  const result = await updateDatabaseListing(updatedListing);

  if (result.error === "slug_collision") {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Bu başlıkla başka bir ilan zaten mevcut.", 409);
  }

  if (result.error) {
    logger.listings.error("PATCH /api/listings/[id] DB update failed", null, {
      listingId,
      userId: user.id,
      error: result.error,
    });
    captureServerError("Listing update DB failed", "listings", result.error, { listingId, userId: user.id }, user.id);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlan kaydedilemedi. Lütfen tekrar dene.", 500);
  }

  if (result.listing) {
    captureServerEvent("listing_updated", {
      userId: user.id,
      listingId: result.listing.id,
      listingSlug: result.listing.slug,
      listingStatus: result.listing.status,
    });

    return apiSuccess(
      {
        listing: {
          id: result.listing.id,
          slug: result.listing.slug,
          status: result.listing.status,
          title: result.listing.title,
        },
      },
      "İlan bilgilerin güncellendi.",
    );
  }

  return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlan kaydedilemedi. Lütfen tekrar dene.", 500);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  if (!hasSupabaseEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase ortam değişkenleri eksik. İlan silmek için .env.local dosyasını tamamlamalısın.",
      503,
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

  const { listingId } = await context.params;
  const result = await deleteDatabaseListing(listingId, user.id);

  if (!result) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Silinecek ilan bulunamadı. Sadece arşivlenmiş ilanlar silinebilir.", 404);
  }

  captureServerEvent("listing_deleted", {
    userId: user.id,
    listingId,
  });

  return apiSuccess({ deleted: true }, "İlan kalıcı olarak silindi.");
}
