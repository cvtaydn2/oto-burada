/**
 * Chat Service Entry Facade
 *
 * Aggregates and exports modular layers for modern service pattern compliance.
 * Retains backward compatibility with existing consumers of @/features/chat/services/chat-logic.
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
