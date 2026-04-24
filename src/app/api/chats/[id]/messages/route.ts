import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChatService } from "@/services/chat/chat-service";

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
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: chatId } = await params;
    const body = await req.json();
    const { content, messageType = "text" } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Mesaj içeriği boş olamaz." }, { status: 400 });
    }

    const result = await ChatService.sendMessage({
      chatId: chatId,
      senderId: user.id,
      content: content,
      messageType: (messageType || "text") as "text" | "image" | "system",
    });
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Mesaj gönderilemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
