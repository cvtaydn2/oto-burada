import { waitUntil } from "@vercel/functions";

import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withUserAndCsrf } from "@/lib/api/security";
import { validateListingEdit } from "@/lib/listings/edit-guard";
import { logger } from "@/lib/logging/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { sanitizeDescription, sanitizeText } from "@/lib/sanitization/sanitize";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { listingCreateFormSchema, listingCreateSchema } from "@/lib/validators";
import { issuesToFieldErrors } from "@/lib/validators/helpers";
import {
  performAsyncModeration,
  recordSellerTrustGuardRejection,
  runListingTrustGuards,
} from "@/services/listings/listing-submission-moderation";
import {
  buildUpdatedListing,
  deleteDatabaseListing,
  findEditableListingById,
  updateDatabaseListing,
} from "@/services/listings/listing-submissions";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const security = await withUserAndCsrf(request, {
    rateLimitKey: "listings:update",
  });
  if (!security.ok) return security.response;
  const user = security.user!;

  if (!hasSupabaseEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Supabase ortam değişkenleri eksik.", 503);
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
      issuesToFieldErrors(parsedFormValues.error.issues)
    );
  }

  const { id: listingId } = await context.params;
  const existingListing = await findEditableListingById(listingId, user.id);
  if (!existingListing) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Düzenlenebilir ilan bulunamadı.", 404);
  }

  const normalizedInput = {
    ...parsedFormValues.data,
    title: sanitizeText(parsedFormValues.data.title),
    description: sanitizeDescription(parsedFormValues.data.description),
    damageStatusJson: parsedFormValues.data.damageStatusJson
      ? Object.fromEntries(
          Object.entries(parsedFormValues.data.damageStatusJson).filter(([, v]) =>
            [
              "orjinal",
              "orijinal",
              "boyali",
              "lokal_boyali",
              "degisen",
              "hasarli",
              "belirtilmemis",
              "bilinmiyor",
            ].includes(v as string)
          )
        )
      : null,
    images: parsedFormValues.data.images
      .filter(
        (image: { url?: string; storagePath?: string }) =>
          (image.url ?? "").trim().length > 0 && (image.storagePath ?? "").trim().length > 0
      )
      .map(
        (
          image: {
            url?: string;
            storagePath?: string;
            placeholderBlur?: string | null;
            imageType?: string;
          },
          index: number
        ) => ({
          storagePath: image.storagePath?.trim() ?? "",
          url: image.url?.trim() ?? "",
          order: index,
          isCover: index === 0,
          placeholderBlur: image.placeholderBlur ?? null,
          type: image.imageType === "360" ? ("360" as const) : ("photo" as const),
        })
      ),
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
      issuesToFieldErrors(parsedListingInput.error.issues)
    );
  }

  const criticalFieldsChanged =
    parsedListingInput.data.price !== existingListing.price ||
    parsedListingInput.data.vin !== (existingListing.vin ?? "") ||
    (parsedListingInput.data.licensePlate ?? null) !== (existingListing.licensePlate ?? null) ||
    parsedListingInput.data.title !== existingListing.title ||
    parsedListingInput.data.description !== existingListing.description;

  const editIntegrity = validateListingEdit(
    {
      brand: existingListing.brand,
      model: existingListing.model,
      view_count: existingListing.viewCount,
    },
    {
      brand: parsedListingInput.data.brand,
      model: parsedListingInput.data.model,
    }
  );

  if (!editIntegrity.allowed) {
    return apiError(
      API_ERROR_CODES.FORBIDDEN,
      editIntegrity.reason ?? "Bu ilan güncellemesi güvenlik nedeniyle engellendi.",
      403
    );
  }

  if (criticalFieldsChanged) {
    const trustGuard = await runListingTrustGuards(parsedListingInput.data, {
      excludeListingId: existingListing.id,
    });

    if (!trustGuard.allowed) {
      const enforcement = await recordSellerTrustGuardRejection({
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined,
        sellerId: user.id,
        reason: trustGuard.reason,
        source: "edit",
      });

      return apiError(
        API_ERROR_CODES.FORBIDDEN,
        enforcement.restricted
          ? "Hesabın geçici olarak incelemeye alındı. Lütfen destek ekibiyle iletişime geç."
          : (trustGuard.message ?? "İlan güvenlik kurallarına takıldı."),
        403
      );
    }
  }

  const updatedListing = buildUpdatedListing(parsedListingInput.data, existingListing, []);
  const listingToPersist =
    criticalFieldsChanged || editIntegrity.resetStats
      ? {
          ...updatedListing,
          status: "pending_ai_review" as const,
          viewCount: editIntegrity.resetStats ? 0 : updatedListing.viewCount,
          bumpedAt: editIntegrity.resetStats ? null : updatedListing.bumpedAt,
        }
      : updatedListing;
  const result = await updateDatabaseListing(listingToPersist);

  if (result.error === "slug_collision") {
    return apiError(API_ERROR_CODES.CONFLICT, "Bu başlıkla başka bir ilan zaten mevcut.", 409, {
      conflictType: "slug_collision",
      listingId,
      retryable: true,
    });
  }

  if (result.error === "concurrent_update_detected") {
    return apiError(
      API_ERROR_CODES.CONFLICT,
      "İlan başka bir sekmede veya cihazda güncellenmiş. Lütfen sayfayı yenileyip tekrar dene.",
      409,
      {
        conflictType: "concurrent_update_detected",
        listingId,
        resolution: "reload_required",
        retryable: true,
      }
    );
  }

  if (result.error) {
    logger.listings.error("PATCH /api/listings/[id] DB update failed", null, {
      listingId,
      userId: user.id,
      error: result.error,
    });
    captureServerError(
      "Listing update DB failed",
      "listings",
      result.error,
      { listingId, userId: user.id },
      user.id
    );
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlan kaydedilemedi. Lütfen tekrar dene.", 500);
  }

  if (result.listing) {
    if (criticalFieldsChanged) {
      waitUntil(performAsyncModeration(result.listing.id));
    }

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
      "İlan bilgilerin güncellendi."
    );
  }

  return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlan kaydedilemedi. Lütfen tekrar dene.", 500);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const security = await withUserAndCsrf(request, {
    rateLimitKey: "listings:delete",
  });
  if (!security.ok) return security.response;
  const user = security.user!;

  if (!hasSupabaseEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase ortam değişkenleri eksik. İlan silmek için .env.local dosyasını tamamlamalısın.",
      503
    );
  }

  const { id: listingId } = await context.params;
  const result = await deleteDatabaseListing(listingId, user.id);

  if (!result) {
    return apiError(
      API_ERROR_CODES.NOT_FOUND,
      "Silinecek ilan bulunamadı. Sadece arşivlenmiş ilanlar silinebilir.",
      404
    );
  }

  captureServerEvent("listing_deleted", {
    userId: user.id,
    listingId,
  });

  return apiSuccess({ deleted: true }, "İlan kalıcı olarak silindi.");
}
