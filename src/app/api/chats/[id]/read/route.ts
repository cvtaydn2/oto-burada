import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markChatMessagesAsRead } from "@/services/chat/chat-logic";

async function handleMarkRead(req: NextRequest, params: Promise<{ id: string }>) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: chatId } = await params;

    const result = await markChatMessagesAsRead(chatId, user.id);
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Mesajlar okundu işaretlenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleMarkRead(req, params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleMarkRead(req, params);
}
