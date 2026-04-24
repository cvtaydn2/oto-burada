import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChatService } from "@/services/chat/chat-service";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await ChatService.getChatsForUser(user.id);
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Chat listesi alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { listingId, sellerId } = body;

    if (!listingId || !sellerId) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const result = await ChatService.createChat({
      listingId: listingId,
      buyerId: user.id,
      sellerId: sellerId,
    });
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Chat oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
