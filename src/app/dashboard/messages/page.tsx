import { requireUser } from "@/lib/auth/session";
import { getUserChats } from "@/services/messages/chat-service";
import { ChatLayout } from "@/components/chat/chat-layout";
import { MessageSquare, ShieldCheck } from "lucide-react";

export default async function MessagesPage() {
  const user = await requireUser();
  const chats = await getUserChats(user.id);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-160px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <MessageSquare className="text-primary italic" size={16} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">İletişim Hub</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">
            IÇ <span className="text-primary">MESAJLAŞMA</span>
          </h1>
          <p className="text-sm font-medium text-slate-400 italic mt-1">İlan sahipleri ve alıcılar ile güvenli bir ortamda pazarlığınızı yapın.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 italic">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Güvenli İletişim Aktif</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden flex flex-col">
        <ChatLayout initialChats={chats} currentUserId={user.id} />
      </div>
    </div>
  );
}
