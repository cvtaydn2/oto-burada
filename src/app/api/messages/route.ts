import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import { withAuthAndCsrf } from "@/lib/utils/api-security";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";

/**
 * POST /api/messages
 * Secure message insertion through server-side logic and rate limiting.
 */
export async function POST(request: Request) {
  const security = await withAuthAndCsrf(request, {
    userRateLimit: rateLimitProfiles.general, // Basic rate limit for now
    rateLimitKey: "messages:send",
  });

  if (!security.ok) return security.response;
  const user = security.user!;

  let body: { chatId?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek gövdesi.");
  }

  const { chatId, content } = body;

  if (!chatId || !content || content.trim().length === 0) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Mesaj içeriği ve sohbet ID gereklidir.");
  }

  if (content.length > 2000) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Mesaj çok uzun (maks 2000 karakter).");
  }

  const supabase = await createSupabaseServerClient();

  // 1. Double check chat ownership via RLS or explicit join
  // The insert policy for messages already checks chat participants, but we can be explicit here.
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("id")
    .eq("id", chatId)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single();

  if (chatError || !chat) {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Bu sohbet odasına mesaj gönderme yetkiniz yok.");
  }

  // 2. Insert message
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      sender_id: user.id,
      content: content.trim(),
    })
    .select("*")
    .single();

  if (messageError) {
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Mesaj gönderilemedi.");
  }

  return apiSuccess(message, "Mesaj gönderildi.", 201);
}
