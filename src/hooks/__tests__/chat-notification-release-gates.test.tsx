import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("chat and notification release gates", () => {
  const chatQueriesSource = read("src/hooks/use-chat-queries.ts");
  const chatRealtimeSource = read("src/hooks/use-chat-realtime.ts");
  const notificationsSource = read("src/hooks/use-notifications.ts");
  const realtimeNotificationsSource = read("src/hooks/use-realtime-notifications.ts");

  it("chat query hooks user ownership ve archived scope query key sözleşmesini korur", () => {
    expect(chatQueriesSource).toContain(
      'list: (userId: string, showArchived: boolean) => ["chats", userId, showArchived] as const'
    );
    expect(chatQueriesSource).toContain(
      'messages: (chatId: string) => ["chat-messages", chatId] as const'
    );
    expect(chatQueriesSource).toContain(
      'const path = `${API_ROUTES.CHATS.BASE}?archived=${showArchived ? "true" : "false"}`;'
    );
    expect(chatQueriesSource).toContain("enabled: Boolean(userId)");
    expect(chatQueriesSource).toContain("enabled: Boolean(chatId) && Boolean(userId)");
  });

  it("chat mutations release gate invalidation ve fail-closed davranışını korur", () => {
    expect(chatQueriesSource).toContain(
      "await queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });"
    );
    expect(chatQueriesSource).toContain("queryKey: chatQueryKeys.list(variables.buyerId, false)");
    expect(chatQueriesSource).toContain(
      "await queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(variables.chatId) });"
    );
    expect(chatQueriesSource).toContain(
      'throw new Error("Okundu işaretlenecek sohbet bulunamadı.");'
    );
    expect(chatQueriesSource).toContain(
      "`${API_ROUTES.CHATS.MESSAGES(vars.chatId)}?messageId=${encodeURIComponent(vars.messageId)}`"
    );
    expect(chatQueriesSource).toContain("API_ROUTES.CHATS.MARK_READ(chatId)");
    expect(chatQueriesSource).toContain("`${API_ROUTES.CHATS.DETAIL(vars.chatId)}/archive`");
  });

  it("chat realtime surface kanal isimleri ve participant boundary filtresini korur", () => {
    expect(chatRealtimeSource).toContain("channel(`chat-messages:${chatId}`)");
    expect(chatRealtimeSource).toContain('table: "messages"');
    expect(chatRealtimeSource).toContain("filter: `chat_id=eq.${chatId}`");
    expect(chatRealtimeSource).toContain("channel(`chat-typing:${chatId}`)");
    expect(chatRealtimeSource).toContain(
      "if (!payload?.userId || payload.userId === currentUserId)"
    );
    expect(chatRealtimeSource).toContain("payload: {");
    expect(chatRealtimeSource).toContain("chatId,");
    expect(chatRealtimeSource).toContain("userId: currentUserId,");
    expect(chatRealtimeSource).toContain("void supabase.removeChannel(messageChannel);");
    expect(chatRealtimeSource).toContain("void supabase.removeChannel(typingChannel);");
  });

  it("notifications query release gate user-scoped key, zod validation ve unread aggregate davranışını korur", () => {
    expect(notificationsSource).toContain(
      'queryKey: [...queryKeys.notifications, userId ?? "guest"] as const'
    );
    expect(notificationsSource).toContain("schema: apiResponseSchemas.notifications");
    expect(notificationsSource).toContain("enabled: Boolean(userId)");
    expect(notificationsSource).toContain(
      "(query.data ?? []).filter((notification) => !notification.read).length"
    );
    expect(notificationsSource).toContain("notifications: query.data ?? []");
  });

  it("notification realtime surface yalnız hedef user insert kanalını dinler", () => {
    expect(realtimeNotificationsSource).toContain("channel(`notifications:${userId}`)");
    expect(realtimeNotificationsSource).toContain('event: "INSERT"');
    expect(realtimeNotificationsSource).toContain('table: "notifications"');
    expect(realtimeNotificationsSource).toContain("filter: `user_id=eq.${userId}`");
    expect(realtimeNotificationsSource).toContain(
      "const next = payload.new as NotificationPayload | undefined;"
    );
    expect(realtimeNotificationsSource).toContain("options?.onNotification?.(next);");
    expect(realtimeNotificationsSource).toContain("void supabase.removeChannel(channel);");
  });
});
