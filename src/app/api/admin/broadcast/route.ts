import { NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/auth/api-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createDatabaseNotificationsBulk } from "@/services/notifications/notification-records";
import { sanitizeText } from "@/lib/utils/sanitize";
import { logger } from "@/lib/utils/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { enforceRateLimit } from "@/lib/utils/rate-limit-middleware";

// Broadcast: 5 per hour (admin-only, but still protect against accidents)
const BROADCAST_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  const authResponse = await requireApiAdminUser();
  if (authResponse instanceof Response) return authResponse;

  // Rate limit even for admins
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = await enforceRateLimit(`admin:broadcast:${ip}`, BROADCAST_RATE_LIMIT);
  if (rateLimit) return rateLimit.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: { message: "İstek gövdesi okunamadı." } }, { status: 400 });
  }

  const { title, message } = body as { title?: unknown; message?: unknown };

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return NextResponse.json({ success: false, error: { message: "Başlık en az 3 karakter olmalıdır." } }, { status: 400 });
  }
  if (!message || typeof message !== "string" || message.trim().length < 5) {
    return NextResponse.json({ success: false, error: { message: "Mesaj en az 5 karakter olmalıdır." } }, { status: 400 });
  }

  // Sanitize inputs
  const sanitizedTitle = sanitizeText(title.trim());
  const sanitizedMessage = sanitizeText(message.trim());

  try {
    const admin = createSupabaseAdminClient();

    const { data: profiles, error: fetchError } = await admin
      .from("profiles")
      .select("id");

    if (fetchError) {
      logger.admin.error("Broadcast: fetch profiles failed", fetchError);
      captureServerError("Broadcast fetch profiles failed", "admin", fetchError);
      return NextResponse.json({ success: false, error: { message: "Kullanıcı listesi alınamadı." } }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, message: "Gönderilecek kullanıcı bulunamadı." });
    }

    // Batch insert with error tracking per batch
    const BATCH_SIZE = 100;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
      const batch = profiles.slice(i, i + BATCH_SIZE);
      try {
        await createDatabaseNotificationsBulk(
          batch.map((profile) => ({
            userId: profile.id,
            type: "system" as const,
            title: sanitizedTitle,
            message: sanitizedMessage,
            href: "/",
          })),
        );
        successCount += batch.length;
      } catch (batchError) {
        failCount += batch.length;
        logger.admin.error("Broadcast batch failed", batchError, {
          batchStart: i,
          batchSize: batch.length,
        });
      }
    }

    if (failCount > 0) {
      logger.admin.warn("Broadcast partially failed", { successCount, failCount });
    }

    captureServerEvent("admin_broadcast_sent", {
      adminUserId: authResponse.id,
      successCount,
      failCount,
      title: sanitizedTitle,
    }, authResponse.id);

    return NextResponse.json({
      success: true,
      message: `${successCount} kullanıcıya duyuru gönderildi.${failCount > 0 ? ` ${failCount} kullanıcıya gönderilemedi.` : ""}`,
      data: { successCount, failCount },
    });
  } catch (error) {
    logger.admin.error("Broadcast unexpected error", error);
    captureServerError("Broadcast unexpected error", "admin", error);
    return NextResponse.json(
      { success: false, error: { message: "Duyuru gönderilirken bir hata oluştu." } },
      { status: 500 },
    );
  }
}
