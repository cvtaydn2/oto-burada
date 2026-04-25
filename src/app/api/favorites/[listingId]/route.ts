import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withAuthAndCsrf } from "@/lib/api/security";
import { captureServerEvent } from "@/lib/monitoring/posthog-server";
import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const security = await withAuthAndCsrf(request);
  if (!security.ok) return security.response;
  const user = security.user!;

  if (!hasSupabaseEnv() || !hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const { listingId } = await params;
  if (!listingId) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçerli bir ilan seçmelisin.", 400);
  }

  const { favoriteRemoveUseCase } = await import("@/domain/usecases/favorite-remove");
  const result = await favoriteRemoveUseCase(user.id, listingId);

  if (!result.success) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, result.error || "Favori kaldırılamadı.", 400);
  }

  captureServerEvent("favorite_removed", {
    userId: user.id,
    listingId,
  });

  return apiSuccess({ favoriteIds: result.favoriteIds }, "İlan favorilerden kaldırıldı.");
}
