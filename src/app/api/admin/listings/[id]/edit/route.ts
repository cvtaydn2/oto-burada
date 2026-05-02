import { waitUntil } from "@vercel/functions";
import { z } from "zod";

import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withAdminRoute } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { createAdminModerationAction } from "@/services/admin/moderation-actions";
import {
  performAsyncModeration,
  runListingTrustGuards,
} from "@/services/listings/listing-submission-moderation";
import { getStoredListingById } from "@/services/listings/listing-submissions";

const adminEditSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  price: z.coerce.number().int().positive().optional(),
  description: z.string().min(10).max(5000).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: listingId } = await params;
  const security = await withAdminRoute(request);
  if (!security.ok) return security.response;
  const adminUser = security.user!;

  if (!hasSupabaseAdminEnv()) {
    captureServerEvent(
      "admin_listing_edit_failed",
      { reason: "service_unavailable", responseStatus: 503 },
      "server"
    );
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const admin = createSupabaseAdminClient();

  const body = await request.json().catch(() => null);
  const parseResult = adminEditSchema.safeParse(body);

  if (!parseResult.success) {
    captureServerEvent(
      "admin_listing_edit_failed",
      {
        adminUserId: adminUser.id,
        listingId,
        reason: "invalid_payload",
        responseStatus: 400,
      },
      adminUser.id
    );
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz düzenleme verisi.", 400);
  }

  const updates = parseResult.data;

  if (Object.keys(updates).length === 0) {
    captureServerEvent(
      "admin_listing_edit_failed",
      {
        adminUserId: adminUser.id,
        listingId,
        reason: "empty_payload",
        responseStatus: 400,
      },
      adminUser.id
    );
    return apiError(API_ERROR_CODES.BAD_REQUEST, "En az bir alan düzenlenmelidir.", 400);
  }

  const existingListing = await getStoredListingById(listingId);
  if (!existingListing) {
    captureServerEvent(
      "admin_listing_edit_failed",
      {
        adminUserId: adminUser.id,
        listingId,
        reason: "listing_not_found",
        responseStatus: 404,
      },
      adminUser.id
    );
    return apiError(API_ERROR_CODES.NOT_FOUND, "İlan bulunamadı.", 404);
  }

  const criticalFieldsChanged =
    updates.price !== undefined || updates.title !== undefined || updates.description !== undefined;

  if (criticalFieldsChanged) {
    const trustGuard = await runListingTrustGuards(
      {
        title: updates.title ?? existingListing.title,
        brand: existingListing.brand,
        model: existingListing.model,
        carTrim: existingListing.carTrim ?? null,
        year: existingListing.year,
        mileage: existingListing.mileage,
        fuelType: existingListing.fuelType,
        transmission: existingListing.transmission,
        price: updates.price ?? existingListing.price,
        city: existingListing.city,
        district: existingListing.district,
        description: updates.description ?? existingListing.description,
        whatsappPhone: existingListing.whatsappPhone,
        vin: existingListing.vin ?? "",
        licensePlate: existingListing.licensePlate ?? null,
        tramerAmount: existingListing.tramerAmount ?? null,
        damageStatusJson: existingListing.damageStatusJson ?? null,
        images: existingListing.images,
        expertInspection: existingListing.expertInspection,
      },
      {
        excludeListingId: existingListing.id,
      }
    );

    if (!trustGuard.allowed) {
      return apiError(
        API_ERROR_CODES.FORBIDDEN,
        trustGuard.message ?? "İlan güvenlik kurallarına takıldı.",
        403
      );
    }
  }

  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (criticalFieldsChanged) dbUpdates.status = "pending_ai_review";

  const { data: updatedListing, error: updateError } = await admin
    .from("listings")
    .update(dbUpdates)
    .eq("id", listingId)
    .eq("version", existingListing.version ?? 0)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (!updateError && !updatedListing) {
    captureServerEvent(
      "admin_listing_edit_failed",
      {
        adminUserId: adminUser.id,
        listingId,
        reason: "listing_not_found",
        responseStatus: 404,
      },
      adminUser.id
    );
    return apiError(API_ERROR_CODES.NOT_FOUND, "İlan bulunamadı.", 404);
  }

  if (updateError) {
    captureServerError(
      "Admin listing edit failed",
      "admin",
      updateError,
      {
        adminUserId: adminUser.id,
        listingId,
      },
      adminUser.id
    );
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlan düzenlenemedi.", 500);
  }

  const changedFields = Object.keys(updates).join(", ");
  await createAdminModerationAction({
    action: "review",
    adminUserId: adminUser.id,
    note: `Admin düzenleme: ${changedFields} güncellendi`,
    targetId: listingId,
    targetType: "listing",
  });

  captureServerEvent(
    "admin_listing_edited",
    {
      adminUserId: adminUser.id,
      listingId,
      changedFields,
    },
    adminUser.id
  );

  if (criticalFieldsChanged) {
    // Fetch updated listing for async moderation
    const updatedListingForModeration = await getStoredListingById(listingId);

    waitUntil(
      performAsyncModeration(listingId, updatedListingForModeration ?? undefined).catch((error) => {
        logger.listings.error("Async moderation failed in background", error, {
          listingId,
          adminUserId: adminUser.id,
        });
        return Promise.resolve();
      })
    );
  }

  return apiSuccess({ listingId }, "İlan başarıyla düzenlendi.");
}
