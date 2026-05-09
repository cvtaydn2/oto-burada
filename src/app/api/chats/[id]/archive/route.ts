import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { toggleChatArchive } from "@/features/chat/services/chat-logic";
import { logger } from "@/lib/logger";
import { API_ERROR_CODES, apiError } from "@/lib/response";
import { withUserAndCsrf } from "@/lib/security";

const archiveSchema = z.object({
  archive: z.boolean(),
});

function mapChatArchiveRouteError(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;

  if (message.includes("erişim izniniz yok") || message.includes("bulunamadı")) {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Bu kaynağa erişim yetkiniz yok.", 403);
  }

  if (message.includes("Geçersiz")) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek.", 400);
  }

  return apiError(API_ERROR_CODES.INTERNAL_ERROR, fallbackMessage, 500);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const security = await withUserAndCsrf(req);
  if (!security.ok) return security.response;

  const user = security.user!;
  const { id: chatId } = await params;

  try {
    const body = await req.json();
    const validated = archiveSchema.parse(body);

    const result = await toggleChatArchive(chatId, user.id, validated.archive);
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Geçersiz arşiv isteği." }, { status: 400 });
    }

    logger.messages.error("[API:CHAT_ARCHIVE:POST] Failed to toggle archive", error, {
      userId: user.id,
      chatId,
    });
    return mapChatArchiveRouteError(error, "Chat arşivlenemedi.");
  }
}
