/**
 * GET /api/listings/expiry-warnings  (Vercel Cron — GET)
 * POST /api/listings/expiry-warnings (manual/internal trigger)
 *
 * Sends expiry warning emails to sellers whose listings will expire in 7 days.
 * Called daily by Vercel Cron (see vercel.json).
 *
 * Security: requires CRON_SECRET header (Authorization: Bearer <secret>).
 * Vercel automatically sends this header when CRON_SECRET env var is set.
 */

import { captureServerError } from "@/lib/monitoring/posthog-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { getRequiredAppUrl } from "@/lib/utils/env";
import { logger } from "@/lib/utils/logger";
import { createDatabaseNotificationsBulk } from "@/services/notifications/notification-records";

export const dynamic = "force-dynamic";

// Warn when listing has 7 days left before the 60-day expiry
const EXPIRY_DAYS = 60;
const WARN_DAYS_BEFORE = 7;

function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  // CRON_SECRET must always be set in production — fail closed if missing
  if (!cronSecret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

// Vercel Cron sends GET requests — this is the primary handler
export async function GET(request: Request) {
  return handleCronRequest(request);
}

// POST kept for manual/internal triggers (e.g. admin panel, scripts)
export async function POST(request: Request) {
  return handleCronRequest(request);
}

async function handleCronRequest(request: Request) {
  if (!verifyCronSecret(request)) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Yetkisiz erişim.", 401);
  }

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const admin = createSupabaseAdminClient();
  const appUrl = getRequiredAppUrl();

  // Find listings that will expire in exactly WARN_DAYS_BEFORE days
  // published_at + EXPIRY_DAYS = expiry date
  // We want: expiry date is between now+6d and now+8d (±1 day window to avoid missing due to cron timing)
  const warnFrom = new Date(
    Date.now() - (EXPIRY_DAYS - WARN_DAYS_BEFORE - 1) * 24 * 60 * 60 * 1000
  ).toISOString();
  const warnTo = new Date(
    Date.now() - (EXPIRY_DAYS - WARN_DAYS_BEFORE + 1) * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: expiringListings, error } = await admin
    .from("listings")
    .select("id, title, slug, seller_id, published_at")
    .eq("status", "approved")
    .not("published_at", "is", null)
    .lte("published_at", warnFrom)
    .gte("published_at", warnTo);

  if (error) {
    logger.listings.error("Failed to fetch expiring listings", error);
    captureServerError("Expiry warnings cron query failed", "cron", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Süresi dolacak ilanlar alınamadı.", 500);
  }

  if (!expiringListings || expiringListings.length === 0) {
    return apiSuccess({ warned: 0 }, "Uyarı gönderilecek ilan yok.");
  }

  // Get unique seller IDs to fetch their emails in one query
  const sellerIds = [...new Set(expiringListings.map((l) => l.seller_id as string))];

  // Paginate listUsers — Supabase Auth caps at 1000 per page
  const userMap = new Map<string, { email: string; name: string }>();
  let authPage = 1;
  while (true) {
    const { data: authData } = await admin.auth.admin.listUsers({ page: authPage, perPage: 1000 });
    const users = authData?.users ?? [];
    for (const user of users) {
      if (sellerIds.includes(user.id)) {
        userMap.set(user.id, {
          email: user.email ?? "",
          name: (user.user_metadata as { full_name?: string } | undefined)?.full_name ?? "Satıcı",
        });
      }
    }
    // Stop when we've found all sellers or there are no more pages
    if (users.length < 1000 || userMap.size >= sellerIds.length) break;
    authPage++;
  }

  const { Resend } = await import("resend");
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    logger.listings.warn("RESEND_API_KEY eksik — expiry warning emails gönderilemez");
    return apiSuccess({ warned: 0 }, "Email servisi yapılandırılmamış.");
  }

  const resend = new Resend(resendKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "OtoBurada <onboarding@resend.dev>";

  let warnedCount = 0;

  // Send in-app notifications in bulk — one per expiring listing
  const notificationInputs = expiringListings.map((listing) => ({
    userId: listing.seller_id as string,
    type: "system" as const,
    title: "İlanın sona eriyor",
    message: `"${listing.title as string}" ilanın ${WARN_DAYS_BEFORE} gün içinde arşivlenecek. Yenilemek için paneline git.`,
    href: `/dashboard/listings`,
  }));

  if (notificationInputs.length > 0) {
    const created = await createDatabaseNotificationsBulk(notificationInputs);
    logger.listings.info("Expiry warning notifications created", { count: created.length });
  }

  for (const listing of expiringListings) {
    const seller = userMap.get(listing.seller_id as string);
    if (!seller?.email) continue;

    try {
      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: seller.email,
        subject: `İlanın 7 gün içinde sona eriyor: ${listing.title}`,
        html: expiryWarningHtml({
          toName: seller.name,
          listingTitle: listing.title as string,
          listingUrl: `${appUrl}/listing/${listing.slug}`,
          dashboardUrl: `${appUrl}/dashboard/listings`,
          daysLeft: WARN_DAYS_BEFORE,
        }),
      });

      if (!emailError) {
        warnedCount++;
        logger.listings.info("Expiry warning email sent", {
          listingId: listing.id,
          sellerId: listing.seller_id,
        });
      }
    } catch (err) {
      logger.listings.error("Expiry warning email failed", err, { listingId: listing.id });
    }
  }

  return apiSuccess(
    { warned: warnedCount, total: expiringListings.length },
    `${warnedCount} satıcıya ilan sona erme uyarısı gönderildi.`
  );
}

function expiryWarningHtml(p: {
  toName: string;
  listingTitle: string;
  listingUrl: string;
  dashboardUrl: string;
  daysLeft: number;
}): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#f59e0b;padding:32px 40px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:900;">OtoBurada</p>
            <p style="margin:4px 0 0;color:#fef3c7;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">İlan Sona Erme Uyarısı ⏰</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Merhaba ${p.toName},</p>
            <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:900;">
              İlanın ${p.daysLeft} gün içinde sona eriyor
            </h2>
            <div style="background:#fffbeb;border-radius:12px;padding:16px 20px;margin-bottom:24px;border:1px solid #fde68a;">
              <p style="margin:0;color:#92400e;font-size:15px;font-weight:700;">${p.listingTitle}</p>
            </div>
            <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
              İlanın otomatik olarak arşivlenmeden önce yeniden yayınlamak için paneline gidebilirsin.
              İlanını güncelleyerek veya yeniden göndererek görünürlüğünü koruyabilirsin.
            </p>
            <div style="display:flex;gap:12px;">
              <a href="${p.listingUrl}" style="display:inline-block;background:#f59e0b;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:800;margin-right:12px;">
                İlanı Görüntüle →
              </a>
              <a href="${p.dashboardUrl}" style="display:inline-block;background:#f1f5f9;color:#475569;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:700;">
                Panele Git
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">Bu e-posta OtoBurada tarafından otomatik gönderilmiştir.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
