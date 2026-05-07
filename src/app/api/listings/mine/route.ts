/**
 * GET /api/listings/mine
 *
 * ── ARCHITECTURE FIX: Issue #8 - Separate Private Listings Endpoint ─────
 * Dedicated endpoint for authenticated user's own listings.
 *
 * Benefits:
 * - Clear separation of concerns (SRP)
 * - Private data never cached
 * - Different rate limiting strategy
 * - Simpler auth logic
 * - Better monitoring and metrics
 */

import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withSecurity } from "@/lib/api/security";
import { captureServerError } from "@/lib/monitoring/telemetry-server";
import { getStoredUserListings } from "@/services/listings/listing-submissions";

const MY_LISTINGS_DEFAULT_LIMIT = 12; // Mobile-first
const MY_LISTINGS_MAX_LIMIT = 50;

// ── ARCHITECTURE FIX: Issue #8 - No Caching for Private Data ─────
// Private user data should never be cached
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  // Auth required - no public access
  const security = await withSecurity(request, { requireAuth: true });
  if (!security.ok) return security.response;
  const user = security.user!;

  try {
    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = parseInt(searchParams.get("limit") || String(MY_LISTINGS_DEFAULT_LIMIT), 10);

    const page = Number.isFinite(rawPage) ? Math.max(rawPage, 1) : 1;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), MY_LISTINGS_MAX_LIMIT)
      : MY_LISTINGS_DEFAULT_LIMIT;

    const result = await getStoredUserListings(user.id, page, limit);

    // Private data - explicit no-cache headers
    return apiSuccess(result, undefined, 200, {
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
  } catch (error) {
    captureServerError("GET /api/listings/mine failed", "listings", error, {
      userId: user.id,
    });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlanların yüklenirken bir hata oluştu.", 500);
  }
}
