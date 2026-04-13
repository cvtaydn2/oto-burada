import { requireUser } from "@/lib/auth/session";
import { getUserChats } from "@/services/messages/chat-service";
import { ChatLayout } from "@/components/chat/chat-layout";
import { MessageSquare, ShieldCheck } from "lucide-react";

export default async function MessagesPage() {
  const user = await requireUser();
  const chats = await getUserChats(user.id);

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col space-y-5">
      <div className="shrink-0">
        <div>
          <div className="mb-2 flex items-center gap-2">
             <MessageSquare className="text-primary" size={16} />
             <span className="text-xs text-slate-500">İletişim merkezi</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            İç mesajlaşma
          </h1>
          <p className="mt-1 text-sm text-slate-500">İlan sahipleri ve alıcılar ile güvenli bir ortamda pazarlığınızı yapın.</p>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
          <ShieldCheck size={16} />
          <span className="text-xs font-medium">Güvenli iletişim aktif</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <ChatLayout initialChats={chats} currentUserId={user.id} />
      </div>
    </div>
  );
}
