import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { createAdminModerationAction } from "@/services/admin/moderation-actions";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import { requireApiAdminUser } from "@/lib/auth/api-admin";
import { z } from "zod";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";

const adminEditSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  price: z.coerce.number().int().positive().optional(),
  description: z.string().min(10).max(5000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;

  if (!hasSupabaseAdminEnv()) {
    captureServerEvent("admin_listing_edit_failed", { reason: "service_unavailable", responseStatus: 503 }, "server");
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const user = await requireApiAdminUser();

  if (user instanceof Response) {
    return user;
  }

  const admin = createSupabaseAdminClient();

  // Parse body
  const body = await request.json().catch(() => null);
  const parseResult = adminEditSchema.safeParse(body);

  if (!parseResult.success) {
    captureServerEvent("admin_listing_edit_failed", {
      adminUserId: user.id,
      listingId,
      reason: "invalid_payload",
      responseStatus: 400,
    }, user.id);
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz düzenleme verisi.", 400);
  }

  const updates = parseResult.data;

  if (Object.keys(updates).length === 0) {
    captureServerEvent("admin_listing_edit_failed", {
      adminUserId: user.id,
      listingId,
      reason: "empty_payload",
      responseStatus: 400,
    }, user.id);
    return apiError(API_ERROR_CODES.BAD_REQUEST, "En az bir alan düzenlenmelidir.", 400);
  }

  // Build DB update object
  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.description !== undefined) dbUpdates.description = updates.description;

  const { data: updatedListing, error: updateError } = await admin
    .from("listings")
    .update(dbUpdates)
    .eq("id", listingId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (!updateError && !updatedListing) {
    captureServerEvent("admin_listing_edit_failed", {
      adminUserId: user.id,
      listingId,
      reason: "listing_not_found",
      responseStatus: 404,
    }, user.id);
    return apiError(API_ERROR_CODES.NOT_FOUND, "İlan bulunamadı.", 404);
  }

  if (updateError) {
    captureServerError("Admin listing edit failed", "admin", updateError, {
      adminUserId: user.id,
      listingId,
    }, user.id);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlan düzenlenemedi.", 500);
  }

  // Audit log
  const changedFields = Object.keys(updates).join(", ");
  await createAdminModerationAction({
    action: "review",
    adminUserId: user.id,
    note: `Admin düzenleme: ${changedFields} güncellendi`,
    targetId: listingId,
    targetType: "listing",
  });

  captureServerEvent("admin_listing_edited", {
    adminUserId: user.id,
    listingId,
    changedFields,
  }, user.id);

  return apiSuccess({ listingId }, "İlan başarıyla düzenlendi.");
}
