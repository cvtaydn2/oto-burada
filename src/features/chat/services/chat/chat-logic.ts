/**
 * Chat Service Entry Point
 *
 * Re-exports from chat-actions for backward compatibility.
 * New code should import directly from @/features/chat/services/chat-actions.
 */

export {
  createNewChat,
  deleteChatMessage,
  getChatMessages,
  getUserChats,
  markChatMessagesAsRead,
  sendChatMessage,
  toggleChatArchive,
} from "./chat-actions";
export { isValidUuid } from "./chat-pure-logic";
