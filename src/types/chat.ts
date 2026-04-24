import type { Listing } from "./listing";
import type { Profile } from "./profile";

export interface Chat {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  lastMessageAt?: string;
  listing?: Partial<Listing>;
  buyer?: Partial<Profile>;
  seller?: Partial<Profile>;
  lastMessage?: Message;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}
