import { NextRequest, NextResponse } from "next/server";

import { withUserAndCsrf } from "@/lib/api/security";
import { toggleChatArchive } from "@/services/chat/chat-logic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const security = await withUserAndCsrf(req);
  if (!security.ok) return security.response;

  const user = security.user!;
  const { id: chatId } = await params;

  try {
    const body = await req.json();
    const { archive } = body;

    const result = await toggleChatArchive(chatId, user.id, !!archive);
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Chat arşivlenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
