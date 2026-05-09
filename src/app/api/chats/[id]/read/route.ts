import { NextRequest, NextResponse } from "next/server";

import { markChatMessagesAsRead } from "@/features/chat/services/chat-logic";
import { logger } from "@/lib/logger";
import { API_ERROR_CODES, apiError } from "@/lib/response";
import { withUserAndCsrf } from "@/lib/security";

function mapChatReadRouteError(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;

  if (message.includes("erişim izniniz yok") || message.includes("bulunamadı")) {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Bu kaynağa erişim yetkiniz yok.", 403);
  }

  return apiError(API_ERROR_CODES.INTERNAL_ERROR, fallbackMessage, 500);
}

async function handleMarkRead(req: NextRequest, params: Promise<{ id: string }>, userId: string) {
  try {
    const { id: chatId } = await params;

    const result = await markChatMessagesAsRead(chatId, userId);
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    logger.messages.error("[API:CHAT_READ] Failed to mark chat as read", error, {
      userId,
    });
    return mapChatReadRouteError(error, "Mesajlar okundu işaretlenemedi.");
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const security = await withUserAndCsrf(req);
  if (!security.ok) return security.response;
  return handleMarkRead(req, params, security.user!.id);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const security = await withUserAndCsrf(req);
  if (!security.ok) return security.response;
  return handleMarkRead(req, params, security.user!.id);
}
