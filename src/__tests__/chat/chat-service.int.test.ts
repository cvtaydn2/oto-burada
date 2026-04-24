import { beforeAll, describe, expect, it } from "vitest";

import { createSupabaseAdminClient } from "../../lib/supabase/admin";
import { ChatService } from "../../services/chat/chat-service";

describe("ChatService Integration Tests", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let testUser: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let testListing: any;

  beforeAll(async () => {
    const admin = createSupabaseAdminClient();

    // Get a real user and listing from the DB to test with
    const { data: profiles } = await admin.from("profiles").select("*").limit(1);
    const { data: listings } = await admin.from("listings").select("*").limit(1);

    if (!profiles?.[0] || !listings?.[0]) {
      throw new Error(
        "Test data not found in DB. Please ensure there is at least one profile and one listing."
      );
    }

    testUser = profiles[0];
    testListing = listings[0];
  });

  it("should fetch chats for a user", async () => {
    const chats = await ChatService.getChatsForUser(testUser.id);
    expect(Array.isArray(chats)).toBe(true);

    if (chats.length > 0) {
      const chat = chats[0];
      expect(chat).toHaveProperty("id");
      expect(chat).toHaveProperty("status");
      // If messages exist, lastMessage should be mapped
      if (chat.lastMessage) {
        expect(chat.lastMessage).toHaveProperty("content");
        expect(chat.lastMessage).toHaveProperty("messageType");
      }
    }
  });

  it("should handle non-existent user with empty array", async () => {
    const randomId = "00000000-0000-0000-0000-000000000000";
    const chats = await ChatService.getChatsForUser(randomId);
    expect(chats).toEqual([]);
  });

  it("should get messages for a chat", async () => {
    // 1. Find a chat that the test user is part of
    const admin = createSupabaseAdminClient();
    const { data: chat } = await admin
      .from("chats")
      .select("id")
      .or(`buyer_id.eq.${testUser.id},seller_id.eq.${testUser.id}`)
      .limit(1)
      .single();

    if (chat) {
      const messages = await ChatService.getMessages(chat.id, testUser.id);
      expect(Array.isArray(messages)).toBe(true);
      if (messages.length > 0) {
        expect(messages[0]).toHaveProperty("content");
        expect(messages[0]).toHaveProperty("messageType");
      }
    }
  });
});
