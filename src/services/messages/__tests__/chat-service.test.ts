import { describe, it, expect, vi } from "vitest";

describe.skip("Chat Service", () => {
  it("should get or create chat", async () => {
    const { getOrCreateChat } = await import("../chat-service");
    expect(getOrCreateChat).toBeDefined();
  });
});