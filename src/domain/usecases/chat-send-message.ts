import { sendChatMessage } from "@/features/chat/services/chat-logic";
import type { SendMessageInput } from "@/types/chat";

/**
 * Use case: Send a message to a chat
 * - Validates chat exists and user is participant
 * - Applies rate limiting (100 messages/hour per user per chat)
 * - Updates chat's last_message_at timestamp
 */
export async function sendMessageUseCase(input: SendMessageInput) {
  // Input validation
  if (!input.chatId || !input.senderId || !input.content?.trim()) {
    return {
      success: false as const,
      error: "Eksik gerekli parametreler.",
    };
  }

  if (input.content.trim().length > 2000) {
    return {
      success: false as const,
      error: "Mesaj çok uzun. Maksimum 2000 karakter.",
    };
  }

  try {
    const message = await sendChatMessage(input);

    return {
      success: true as const,
      data: message,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Mesaj gönderilemedi.";
    return {
      success: false as const,
      error: message,
    };
  }
}
