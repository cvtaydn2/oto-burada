import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { CSRF_COOKIE_HASH_NAME_CLIENT } from "@/lib/csrf";

const createChatSchema = z.object({
  listingId: z.string().uuid(),
  sellerId: z.string().uuid(),
});

async function mapChatRouteError(error: unknown, fallbackMessage: string) {
  const { API_ERROR_CODES, apiError } = await import("@/lib/response");
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

export async function GET(req: NextRequest) {
  // SECURITY: Apply authentication and rate limiting for read operations
  const [{ withUserRoute }, { rateLimitProfiles }] = await Promise.all([
    import("@/lib/security"),
    import("@/lib/rate-limit"),
  ]);

  const security = await withUserRoute(req, {
    userRateLimit: rateLimitProfiles.general,
    rateLimitKey: "chats:list",
  });

  if (!security.ok) {
    return security.response;
  }

  const user = security.user!;
  const { searchParams } = new URL(req.url);
  const archived = searchParams.get("archived") === "true";

  try {
    const { getUserChats } = await import("@/features/chat/services/chat-logic");
    const result = await getUserChats(user.id, archived);
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const { logger } = await import("@/lib/logger");
    logger.messages.error("[API:CHATS:GET] Failed to fetch chat list", error, { userId: user.id });
    return mapChatRouteError(error, "Chat listesi alınamadı.");
  }
}

export async function POST(req: NextRequest) {
  // SECURITY: Apply authentication, CSRF protection, and rate limiting for mutations
  const { withUserAndCsrf } = await import("@/lib/security");

  const security = await withUserAndCsrf(req, {
    userRateLimit: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 chats per hour
    rateLimitKey: "chats:create",
  });

  if (!security.ok) {
    const { logger } = await import("@/lib/logger");
    logger.auth.warn("[API:CHATS:POST] Security check failed", {
      hasCsrfHeader: Boolean(req.headers.get("x-csrf-token")),
      hasOrigin: Boolean(req.headers.get("origin")),
      hasReferer: Boolean(req.headers.get("referer")),
      hasCsrfCookie: Boolean(req.cookies.get(CSRF_COOKIE_HASH_NAME_CLIENT)?.value),
      pathname: req.nextUrl.pathname,
    });
    return security.response;
  }

  const user = security.user!;

  try {
    const body = await req.json();
    const { listingId, sellerId } = createChatSchema.parse(body);

    // SECURITY: Prevent users from creating chats with themselves
    if (sellerId === user.id) {
      return NextResponse.json(
        { error: "Kendi ilanınız için mesaj oluşturamazsınız." },
        { status: 400 }
      );
    }

    const { createNewChat } = await import("@/features/chat/services/chat-logic");
    const result = await createNewChat({
      listingId: listingId,
      buyerId: user.id,
      sellerId: sellerId,
    });

    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const { logger } = await import("@/lib/logger");
    logger.messages.error("[API:CHATS:POST] Failed to create chat", error, { userId: user.id });
    return mapChatRouteError(error, "Chat oluşturulamadı.");
  }
}
