import { NextRequest, NextResponse } from "next/server";

import { withUserAndCsrfToken } from "@/lib/api/security";
import { markChatMessagesAsRead } from "@/services/chat/chat-logic";

async function handleMarkRead(req: NextRequest, params: Promise<{ id: string }>, userId: string) {
  try {
    const { id: chatId } = await params;

    const result = await markChatMessagesAsRead(chatId, userId);
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Mesajlar okundu işaretlenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const security = await withUserAndCsrfToken(req);
  if (!security.ok) return security.response;
  return handleMarkRead(req, params, security.user!.id);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const security = await withUserAndCsrfToken(req);
  if (!security.ok) return security.response;
  return handleMarkRead(req, params, security.user!.id);
}
