import { requireUser } from "@/lib/auth/session";
import { getUserChats } from "@/services/messages/chat-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChatLayout } from "@/components/chat/chat-layout";
import { MessageSquare, ShieldCheck, RefreshCw } from "lucide-react";
import { logger } from "@/lib/utils/logger";
import Link from "next/link";

export default async function MessagesPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const chats = await getUserChats(user.id, supabase).catch((error) => {
    logger.messages.error("MessagesPage failed to load chats", error, { userId: user.id });
    return null;
  });

  if (!chats) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <h2 className="text-lg font-bold text-red-700">Mesajlar yüklenemedi</h2>
        <p className="text-sm text-red-600 mt-1">Lütfen daha sonra tekrar deneyin.</p>
        <Link
          href="/dashboard/messages"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
        >
          <RefreshCw size={15} />
          Tekrar Dene
        </Link>
      </div>
    );
  }

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
          <p className="mt-1 text-sm text-slate-500">
            İlan sahipleri ve alıcılar ile güvenli bir ortamda pazarlığınızı yapın.
          </p>
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
