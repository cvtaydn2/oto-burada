import { describe, expect, it } from "vitest";

import { createSupabaseAdminClient } from "../../lib/supabase/admin";
import {
  getChatMessages,
  getOrCreateChat,
  sendMessage,
} from "../../services/messages/chat-service";

// This test runs against the REAL Supabase DB.
describe("Chat Service (Integration)", () => {
  const admin = createSupabaseAdminClient();

  // Real IDs from the DB found via SQL
  const TEST_LISTING_ID = "2f240bf5-7e85-4dd7-9df6-2b8bbf3d6dc1";
  const TEST_SELLER_ID = "0b0139fe-950c-4bd4-af12-33bb1ee3bd0d";
  const TEST_BUYER_ID = "fde3c732-6bdc-4eb4-9c4c-471040b94e7d";

  it("should flow: create chat -> send message -> get messages", async () => {
    // 1. Get or Create Chat
    const chat = await getOrCreateChat(TEST_LISTING_ID, TEST_BUYER_ID, TEST_SELLER_ID, admin);

    expect(chat).not.toBeNull();
    expect(chat?.id).toBeDefined();

    // 2. Send a Message
    const msgContent = `Integration Test Message ${Date.now()}`;
    const message = await sendMessage(chat!.id, TEST_BUYER_ID, msgContent, admin);

    expect(message).not.toBeNull();
    expect(message?.content).toBe(msgContent);

    // 3. Get Messages
    const messages = await getChatMessages(chat!.id, admin);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.some((m) => m.content === msgContent)).toBe(true);
  }, 10000); // Higher timeout for real DB
});
