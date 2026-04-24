export interface Chat {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: "active" | "archived";
  lastMessageAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType: "text" | "image" | "system";
  isRead: boolean;
  createdAt: string;
}

export interface CreateChatInput {
  listingId: string;
  buyerId: string;
  sellerId: string;
}

export interface SendMessageInput {
  chatId: string;
  senderId: string;
  content: string;
  messageType?: "text" | "image" | "system";
}

export interface MessageWithChat extends Message {
  chat: Chat;
}

export interface ChatWithLastMessage extends Chat {
  lastMessage?: Message;
  unreadCount?: number;
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

export interface ChatParticipant {
  userId: string;
  chatId: string;
  isTyping?: boolean;
}
