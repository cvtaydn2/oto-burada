import { requireApiUser } from "@/features/auth/lib/api-user";
import { getDatabaseFavoriteIds } from "@/features/favorites/services/favorite-records";
import { createDatabaseNotification } from "@/features/notifications/services/notification-records";
import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/response";
import { withUserAndCsrfToken } from "@/lib/security";
import { captureServerEvent } from "@/lib/telemetry-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getListingIdFromBody(body: unknown): string {
  if (typeof body !== "object" || body === null || !("listingId" in body)) {
    return "";
  }
  return String((body as Record<string, unknown>).listingId ?? "");
}

export async function GET() {
  if (!hasSupabaseEnv() || !hasSupabaseAdminEnv()) {
    return apiSuccess({ favoriteIds: [] });
  }

  const userOrError = await requireApiUser();
  if (userOrError instanceof Response) {
    // Unauthenticated — return empty list (favorites are optional for guests)
    return apiSuccess({ favoriteIds: [] });
  }

  // No ensureProfileRecord here — GET should be read-only with no side effects.
  const favoriteIds = await getDatabaseFavoriteIds(userOrError.id);

  return apiSuccess({ favoriteIds });
}

export async function POST(request: Request) {
  const security = await withUserAndCsrfToken(request, {
    ipRateLimit: { limit: 60, windowMs: 60 * 1000 },
    userRateLimit: { limit: 30, windowMs: 60 * 1000 },
    rateLimitKey: "favorites:mutate",
  });

  if (!security.ok) return security.response;
  const user = security.user!;

  if (!hasSupabaseEnv() || !hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Favori isteği okunamadı.", 400);
  }

  const listingId = getListingIdFromBody(body);
  if (!listingId) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçerli bir ilan seçmelisin.", 400);
  }

  const { favoriteAddUseCase } = await import("@/domain/usecases/favorite-add");
  const result = await favoriteAddUseCase(user.id, listingId);

  if (!result.success) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, result.error || "Favori eklenemedi.", 400);
  }

  // Side effects: Notifications & Analytics
  if (result.metadata && result.metadata.sellerId !== user.id) {
    await createDatabaseNotification({
      href: `/listing/${result.metadata.listingSlug}`,
      message: `"${result.metadata.listingTitle}" ilanını ${result.metadata.actorName} favorilerine ekledi.`,
      title: "İlanın favorilere eklendi",
      type: "favorite",
      userId: result.metadata.sellerId,
    });
  }

  captureServerEvent("favorite_added", {
    userId: user.id,
    listingId,
    sellerId: result.metadata?.sellerId,
    listingSlug: result.metadata?.listingSlug,
  });

  return apiSuccess({ favoriteIds: result.favoriteIds }, "İlan favorilere eklendi.");
}
