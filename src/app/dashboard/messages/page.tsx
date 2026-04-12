import { getCurrentUser } from "@/lib/auth/session";
import { getUserChats } from "@/services/messages/chat-service";
import { ChatLayout } from "@/components/chat/chat-layout";
import { redirect } from "next/navigation";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/messages");

  const chats = await getUserChats(user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ChatLayout initialChats={chats} currentUserId={user.id} />
    </div>
  );
}
