import { NextRequest, NextResponse } from "next/server";

import { withUserAndCsrf, withUserRoute } from "@/lib/utils/api-security";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { ChatService } from "@/services/chat/chat-service";

export async function GET(req: NextRequest) {
  // SECURITY: Apply authentication and rate limiting for read operations
  const security = await withUserRoute(req, {
    userRateLimit: rateLimitProfiles.general,
    rateLimitKey: "chats:list",
  });

  if (!security.ok) {
    return security.response;
  }

  const user = security.user!;

  try {
    const result = await ChatService.getChatsForUser(user.id);
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    console.error("[API:CHATS:GET] Error:", error);
    const message = error instanceof Error ? error.message : "Chat listesi alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // SECURITY: Apply authentication, CSRF protection, and rate limiting for mutations
  const security = await withUserAndCsrf(req, {
    userRateLimit: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 chats per hour
    rateLimitKey: "chats:create",
  });

  if (!security.ok) {
    return security.response;
  }

  const user = security.user!;

  try {
    const body = await req.json();
    const { listingId, sellerId } = body;

    if (!listingId || !sellerId) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    // SECURITY: Prevent users from creating chats with themselves
    if (sellerId === user.id) {
      return NextResponse.json(
        { error: "Kendi ilanınız için mesaj oluşturamazsınız." },
        { status: 400 }
      );
    }

    const result = await ChatService.createChat({
      listingId: listingId,
      buyerId: user.id,
      sellerId: sellerId,
    });

    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    console.error("[API:CHATS:POST] Error:", error);
    const message = error instanceof Error ? error.message : "Chat oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
