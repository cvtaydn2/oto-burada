import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { createAdminModerationAction } from "@/services/admin/moderation-actions";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import { z } from "zod";

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
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Oturum doğrulanamadı.", 401);
  }

  // Check admin role
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Admin yetkisi gerekli.", 403);
  }

  // Parse body
  const body = await request.json().catch(() => null);
  const parseResult = adminEditSchema.safeParse(body);

  if (!parseResult.success) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz düzenleme verisi.", 400);
  }

  const updates = parseResult.data;

  if (Object.keys(updates).length === 0) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "En az bir alan düzenlenmelidir.", 400);
  }

  // Build DB update object
  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.description !== undefined) dbUpdates.description = updates.description;

  const { error: updateError } = await admin
    .from("listings")
    .update(dbUpdates)
    .eq("id", listingId);

  if (updateError) {
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlan düzenlenemedi.", 500);
  }

  // Audit log
  const changedFields = Object.keys(updates).join(", ");
  await createAdminModerationAction({
    action: "approve",
    adminUserId: user.id,
    note: `Admin düzenleme: ${changedFields} güncellendi`,
    targetId: listingId,
    targetType: "listing",
  });

  return apiSuccess({ listingId }, "İlan başarıyla düzenlendi.");
}
