import { History, ShieldCheck, ExternalLink, Search } from "lucide-react";
import { requireAdminUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AdminActionWithProfile {
  id: string;
  action: string;
  admin_user_id: string;
  target_id: string;
  target_type: string;
  note: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdminUser();
  const { q } = await searchParams;
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("admin_actions")
    .select("*, profiles!admin_actions_admin_user_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) {
    query = query.or(`action.ilike.%${q}%,note.ilike.%${q}%`);
  }

  const { data: actions } = await query as { data: AdminActionWithProfile[] | null };

  function getTargetHref(action: AdminActionWithProfile): string | null {
    if (action.target_type === "listing") return `/admin/listings?q=${action.target_id}`;
    if (action.target_type === "user") return `/admin/users/${action.target_id}`;
    if (action.target_type === "report") return `/admin/reports`;
    return null;
  }

  return (
    <main className="space-y-8 p-6 lg:p-8 bg-slate-50/30 min-h-full">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.5)]" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Şeffaflık & Güvenlik</span>
           </div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight">
             Denetim <span className="text-slate-500">Kayıtları</span>
           </h1>
           <p className="mt-1.5 text-sm text-slate-500 font-medium italic">Sistem üzerinde gerçekleştirilen tüm admin aksiyonlarını geriye dönük takip edin.</p>
        </div>
      </section>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/30 p-6 md:flex-row md:items-center">
            <h2 className="text-lg font-black text-slate-800 tracking-tight italic">İşlem Günlüğü (Audit)</h2>
            <form className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <Input 
                name="q"
                defaultValue={q}
                className="h-12 rounded-xl border-slate-200 bg-white pl-12 pr-4 text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all" 
                placeholder="İşlem veya not ara..." 
              />
            </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Zamanlama</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Admin / Operatör</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Eylem</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hedef Nesne</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Açıklama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {actions?.map((action) => (
                <tr key={action.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="whitespace-nowrap px-6 py-5 text-xs font-bold text-slate-400 italic">
                    {new Date(action.created_at).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all">
                           <ShieldCheck size={16} className="text-slate-400 group-hover:text-blue-600" />
                        </div>
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{action.profiles?.full_name || "Bilinmeyen Admin"}</span>
                     </div>
                  </td>
                  <td className="px-6 py-5">
                     <Badge className={cn(
                        "rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border-none shadow-sm",
                        action.action === 'approve' ? 'bg-emerald-100 text-emerald-700' :
                        action.action === 'reject' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-500'
                     )}>
                        {action.action}
                     </Badge>
                  </td>
                  <td className="px-6 py-5 font-mono text-[10px] text-slate-400">
                     {(() => {
                       const href = getTargetHref(action);
                       return href ? (
                         <a href={href} className="flex items-center gap-2 hover:text-blue-500 transition-colors group-hover:text-blue-500">
                           <span className="font-bold">{action.target_type}</span>
                           <span>#{action.target_id.substring(0, 8)}...</span>
                           <ExternalLink size={12} />
                         </a>
                       ) : (
                         <div className="flex items-center gap-2">
                           <span className="font-bold">{action.target_type}</span>
                           <span>#{action.target_id.substring(0, 8)}...</span>
                         </div>
                       );
                     })()}
                  </td>
                  <td className="px-6 py-5">
                     <p className="text-sm font-medium text-slate-500 max-w-xs truncate italic">{action.note || "Ek not belirtilmedi."}</p>
                  </td>
                </tr>
              ))}
              {!actions?.length && (
                <tr>
                   <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                         <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
                            <History className="text-slate-200" size={32} />
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Henüz bir eylem kaydı bulunmuyor</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

