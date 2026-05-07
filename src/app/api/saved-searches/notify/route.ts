/**
 * GET /api/saved-searches/notify  (Vercel Cron — GET)
 * POST /api/saved-searches/notify (manual/internal trigger)
 *
 * Internal endpoint — called by a cron job or admin panel.
 *
 * Security: requires CRON_SECRET header (Authorization: Bearer <secret>).
 * Vercel automatically sends this header when CRON_SECRET env var is set.
 *
 * ── SECURITY FIX: Issue SEC-CRON-01 - Uses Shared Server Function ──
 * Business logic extracted to shared server function to avoid
 * passing CRON_SECRET via internal HTTP fetch.
 */

import { API_ERROR_CODES, apiError, apiSuccess } from "@/features/shared/lib/response";
import { triggerSavedSearchNotifications } from "@/features/shared/services/saved-search-notifier";

/**
 * Main handler for Vercel Cron.
 * Triggers email notifications for saved searches with new matches.
 */
export async function GET(request: Request) {
  return handleCronRequest(request);
}

/**
 * Support POST for manual triggers (e.g., from admin panel)
 */
export async function POST(request: Request) {
  return handleCronRequest(request);
}

async function handleCronRequest(request: Request) {
  if (!verifyCronSecret(request)) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Yetkisiz erişim.", 401);
  }

  // Use shared server function — business logic extracted for security
  const result = await triggerSavedSearchNotifications();

  if (!result.success) {
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, result.error || "Bildirimler işlenemedi.", 500);
  }

  return apiSuccess(
    {
      processed: result.processed,
      notified: result.notified,
      skipped: result.skipped,
      errors: result.errors,
    },
    `${result.notified} kullanıcıya bildirim gönderildi, ${result.skipped} arama için yeni sonuç yok.`
  );
}

function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}
