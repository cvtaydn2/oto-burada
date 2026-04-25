import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { withUserAndCsrf } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChatService } from "@/services/chat/chat-service";

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  messageType: z.enum(["text", "image", "system"]),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: chatId } = await params;

    const result = await ChatService.getMessages(chatId, user.id);
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Mesajlar alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
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

    const result = await ChatService.sendMessage({
      chatId: chatId,
      senderId: user.id,
      content: validated.content,
      messageType: validated.messageType,
    });
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Mesaj gönderilemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
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

    const result = await ChatService.deleteMessage(messageId, user.id);
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Mesaj silinemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
