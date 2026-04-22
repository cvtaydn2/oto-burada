import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

import { getChatMessages, getOrCreateChat, getUserChats, sendMessage } from "../chat-service";

vi.mock("@/lib/supabase/browser");

describe("chat-service", () => {
  type ChatQueryResult = {
    data: unknown;
    error: unknown;
  };

  const mockChain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    then: vi.fn(),
  };
  const mockClient = {
    from: vi.fn(() => mockChain),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSupabaseBrowserClient).mockReturnValue(mockClient as never);

    mockChain.select = vi.fn().mockReturnValue(mockChain);
    mockChain.insert = vi.fn().mockReturnValue(mockChain);
    mockChain.update = vi.fn().mockReturnValue(mockChain);
    mockChain.eq = vi.fn().mockReturnValue(mockChain);
    mockChain.neq = vi.fn().mockReturnValue(mockChain);
    mockChain.or = vi.fn().mockReturnValue(mockChain);
    mockChain.order = vi.fn().mockReturnValue(mockChain);
    mockChain.single = vi.fn().mockResolvedValue({ data: null, error: null });

    // Default promise resolution
    mockChain.then = vi
      .fn()
      .mockImplementation((onFulfilled: (value: ChatQueryResult) => unknown) => {
        return Promise.resolve({ data: [], error: null }).then(onFulfilled);
      });
  });

  describe("getOrCreateChat", () => {
    it("should return existing chat if found", async () => {
      const mockChat = { id: "chat-1", listing_id: "l1", buyer_id: "b1", seller_id: "s1" };
      mockChain.single.mockResolvedValueOnce({ data: mockChat, error: null });

      const chat = await getOrCreateChat("l1", "b1", "s1");
      expect(chat?.id).toBe("chat-1");
      expect(mockClient.from).toHaveBeenCalledWith("chats");
    });

    it("should create new chat if not found", async () => {
      mockChain.single.mockResolvedValueOnce({ data: null, error: null }); // First check
      const mockNewChat = { id: "new-chat", listing_id: "l1", buyer_id: "b1", seller_id: "s1" };
      mockChain.single.mockResolvedValueOnce({ data: mockNewChat, error: null }); // Insert result

      const chat = await getOrCreateChat("l1", "b1", "s1");
      expect(chat?.id).toBe("new-chat");
      expect(mockChain.insert).toHaveBeenCalledWith({
        listing_id: "l1",
        buyer_id: "b1",
        seller_id: "s1",
      });
    });
  });

  describe("getChatMessages", () => {
    it("should fetch and map messages", async () => {
      const mockMessages = [
        {
          id: "m1",
          chat_id: "c1",
          sender_id: "u1",
          content: "hi",
          is_read: false,
          created_at: "2023-01-01",
        },
      ];
      // Use thenable mock for select().eq().order()
      mockChain.then.mockImplementationOnce((onFulfilled: (value: ChatQueryResult) => unknown) => {
        return Promise.resolve({ data: mockMessages, error: null }).then(onFulfilled);
      });

      const messages = await getChatMessages("c1");
      expect(messages).toHaveLength(1);
      expect(messages[0].chatId).toBe("c1");
      expect(messages[0].content).toBe("hi");
    });
  });

  describe("sendMessage", () => {
    it("should insert and return new message", async () => {
      const mockMsg = { id: "m1", chat_id: "c1", sender_id: "u1", content: "hello" };
      mockChain.single.mockResolvedValueOnce({ data: mockMsg, error: null });

      const msg = await sendMessage("c1", "u1", "hello");
      expect(msg?.content).toBe("hello");
      expect(mockChain.insert).toHaveBeenCalledWith({
        chat_id: "c1",
        sender_id: "u1",
        content: "hello",
      });
    });
  });

  describe("getUserChats", () => {
    it("should fetch chats for a user", async () => {
      const mockChats = [{ id: "c1", buyer_id: "u1", seller_id: "s1" }];
      mockChain.then.mockImplementationOnce((onFulfilled: (value: ChatQueryResult) => unknown) => {
        return Promise.resolve({ data: mockChats, error: null }).then(onFulfilled);
      });

      const chats = await getUserChats("u1");
      expect(chats).toHaveLength(1);
      expect(mockChain.or).toHaveBeenCalledWith("buyer_id.eq.u1,seller_id.eq.u1");
    });
  });
});
