import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import {
  deleteChatMessage,
  getChatMessages,
  sendChatMessage,
} from "@/features/chat/services/chat-logic";
import { logger } from "@/lib/logger";
import { API_ERROR_CODES, apiError } from "@/lib/response";
import { withUserAndCsrf, withUserRoute } from "@/lib/security";

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  messageType: z.enum(["text", "image", "system"]),
});

function mapChatMessageRouteError(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;

  if (message.includes("erişim izniniz yok") || message.includes("bulunamadı")) {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Bu kaynağa erişim yetkiniz yok.", 403);
  }

  if (message.includes("Çok fazla mesaj")) {
    return apiError(API_ERROR_CODES.RATE_LIMITED, "Çok fazla istek gönderdiniz.", 429);
  }

  if (message.includes("Geçersiz")) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek.", 400);
  }

  return apiError(API_ERROR_CODES.INTERNAL_ERROR, fallbackMessage, 500);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const security = await withUserRoute(req);
  if (!security.ok) return security.response;
  const user = security.user!;

  try {
    const { id: chatId } = await params;

    const result = await getChatMessages(chatId, user.id);
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    logger.messages.error("[API:CHAT_MESSAGES:GET] Failed to fetch messages", error, {
      userId: user.id,
    });
    return mapChatMessageRouteError(error, "Mesajlar alınamadı.");
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const security = await withUserAndCsrf(req);
  if (!security.ok) return security.response;
  const user = security.user!;

  try {
    const { id: chatId } = await params;
    const body = await req.json();
    const validated = messageSchema.parse(body);

    const result = await sendChatMessage({
      chatId: chatId,
      senderId: user.id,
      content: validated.content,
      messageType: validated.messageType,
    });
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Geçersiz mesaj içeriği." }, { status: 400 });
    }

    logger.messages.error("[API:CHAT_MESSAGES:POST] Failed to send message", error, {
      userId: user.id,
    });
    return mapChatMessageRouteError(error, "Mesaj gönderilemedi.");
  }
}

export async function DELETE(req: NextRequest) {
  const security = await withUserAndCsrf(req);
  if (!security.ok) return security.response;
  const user = security.user!;

  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json({ error: "Mesaj ID belirtilmedi." }, { status: 400 });
    }

    const result = await deleteChatMessage(messageId, user.id);
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    logger.messages.error("[API:CHAT_MESSAGES:DELETE] Failed to delete message", error, {
      userId: user.id,
    });
    return mapChatMessageRouteError(error, "Mesaj silinemedi.");
  }
}
