import { createNewChat } from "@/features/chat/services/chat-logic";
import type { CreateChatInput } from "@/types/chat";

/**
 * Use case: Create a chat between buyer and seller for a listing
 * - Validates listing exists and is approved
 * - Checks for existing chat (prevents duplicates)
 * - Creates system message for chat start
 */
export async function createChatUseCase(input: CreateChatInput) {
  // Input validation
  if (!input.listingId || !input.buyerId || !input.sellerId) {
    return {
      success: false as const,
      error: "Eksik gerekli parametreler.",
    };
  }

  if (input.buyerId === input.sellerId) {
    return {
      success: false as const,
      error: "Alıcı ve satıcı aynı kişi olamaz.",
    };
  }

  try {
    const chat = await createNewChat(input);

    return {
      success: true as const,
      data: chat,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Chat oluşturulamadı.";
    return {
      success: false as const,
      error: message,
    };
  }
}
