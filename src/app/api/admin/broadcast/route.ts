import { NextResponse } from "next/server";

import { withAdminRoute } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/telemetry-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createDatabaseNotificationsBulk } from "@/services/notifications/notification-records";

// Broadcast: 5 per hour (admin-only, but still protect against accidents)
const BROADCAST_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

// Pagination batch size
const BATCH_SIZE = 100;

/**
 * Validates and sanitizes broadcast input to prevent XSS and injection attacks.
 */
interface BroadcastInput {
  title: string;
  message: string;
}

function validateAndSanitizeBroadcastInput(body: unknown): BroadcastInput {
  // Type check - must be a plain object
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new Error("İstek gövdesi geçersiz formatta.");
  }

  const { title, message } = body as Record<string, unknown>;

  // Title validation: non-empty string, minimum 3 chars
  if (!title || typeof title !== "string") {
    throw new Error("Başlık zorunludur.");
  }
  const trimmedTitle = title.trim();
  if (trimmedTitle.length < 3) {
    throw new Error("Başlık en az 3 karakter olmalıdır.");
  }
  if (trimmedTitle.length > 200) {
    throw new Error("Başlık en fazla 200 karakter olabilir.");
  }

  // Message validation: non-empty string, minimum 5 chars
  if (!message || typeof message !== "string") {
    throw new Error("Mesaj zorunludur.");
  }
  const trimmedMessage = message.trim();
  if (trimmedMessage.length < 5) {
    throw new Error("Mesaj en az 5 karakter olmalıdır.");
  }
  if (trimmedMessage.length > 5000) {
    throw new Error("Mesaj en fazla 5000 karakter olabilir.");
  }

  // Sanitize - remove HTML tags and potentially dangerous characters
  // For system broadcast, we want plain text only - no HTML allowed
  const sanitizedTitle = sanitizeBroadcastText(trimmedTitle);
  const sanitizedMessage = sanitizeBroadcastText(trimmedMessage);

  return { title: sanitizedTitle, message: sanitizedMessage };
}

/**
 * Sanitizes broadcast text to prevent XSS attacks.
 * Strips all HTML tags and encodes special characters.
 */
function sanitizeBroadcastText(input: string): string {
  // Step 1: Remove all HTML tags completely
  let sanitized = input.replace(/<[^>]*>/g, "");

  // Step 2: Encode special characters that could be used in XSS
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  // Step 3: Collapse multiple spaces and trim
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  return sanitized;
}

export async function POST(request: Request) {
  const security = await withAdminRoute(request, {
    ipRateLimit: BROADCAST_RATE_LIMIT,
    rateLimitKey: "admin:broadcast",
  });
  if (!security.ok) return security.response;
  const adminUser = security.user!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "İstek gövdesi okunamadı." } },
      { status: 400 }
    );
  }

  // Validate and sanitize input
  let sanitizedInput: BroadcastInput;
  try {
    sanitizedInput = validateAndSanitizeBroadcastInput(body);
  } catch (validationError) {
    return NextResponse.json(
      { success: false, error: { message: (validationError as Error).message } },
      { status: 400 }
    );
  }

  const { title, message } = sanitizedInput;
  const admin = createSupabaseAdminClient();

  // Process users in cursor-based pagination to avoid OOM
  let successCount = 0;
  let failCount = 0;
  let processedCount = 0;
  let lastProcessedId: string | null = null;

  try {
    // Use cursor-based pagination instead of offset for scalability
    while (true) {
      // Build query with cursor-based pagination
      let query = admin
        .from("profiles")
        .select("id")
        .order("id", { ascending: true })
        .limit(BATCH_SIZE);

      // Apply cursor if we have one (skip already processed)
      if (lastProcessedId) {
        query = query.gt("id", lastProcessedId);
      }

      const { data: profiles, error: fetchError } = await query;

      if (fetchError) {
        logger.admin.error("Broadcast: fetch profiles failed", fetchError);
        captureServerError("Broadcast fetch profiles failed", "admin", fetchError);
        return NextResponse.json(
          { success: false, error: { message: "Kullanıcı listesi alınamadı." } },
          { status: 500 }
        );
      }

      if (!profiles || profiles.length === 0) {
        // No more users to process
        break;
      }

      // Update cursor for next iteration
      lastProcessedId = profiles[profiles.length - 1].id;

      // Process batch
      try {
        const batch = profiles.map((profile) => ({
          userId: profile.id,
          type: "system" as const,
          title,
          message,
          href: "/",
        }));

        await createDatabaseNotificationsBulk(batch);
        successCount += profiles.length;
      } catch (batchError) {
        failCount += profiles.length;
        logger.admin.error("Broadcast batch failed", batchError, {
          batchStart: processedCount,
          batchSize: profiles.length,
          lastProcessedId,
        });
      }

      processedCount += profiles.length;

      // If we got fewer than batch size, we're done
      if (profiles.length < BATCH_SIZE) {
        break;
      }

      // Safety limit: process maximum 100,000 users per broadcast
      if (processedCount >= 100_000) {
        logger.admin.warn("Broadcast: safety limit reached", {
          processedCount,
          successCount,
          failCount,
        });
        break;
      }
    }

    if (failCount > 0) {
      logger.admin.warn("Broadcast partially failed", { successCount, failCount });
    }

    captureServerEvent(
      "admin_broadcast_sent",
      {
        adminUserId: adminUser.id,
        successCount,
        failCount,
        title: title.substring(0, 50), // Truncate for event size limit
      },
      adminUser.id
    );

    return NextResponse.json({
      success: true,
      message: `${successCount} kullanıcıya duyuru gönderildi.${failCount > 0 ? ` ${failCount} kullanıcıya gönderilemedi.` : ""}`,
      data: { successCount, failCount, totalProcessed: processedCount },
    });
  } catch (error) {
    logger.admin.error("Broadcast unexpected error", error);
    captureServerError("Broadcast unexpected error", "admin", error);
    return NextResponse.json(
      { success: false, error: { message: "Duyuru gönderilirken bir hata oluştu." } },
      { status: 500 }
    );
  }
}
