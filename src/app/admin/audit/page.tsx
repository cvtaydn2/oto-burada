import { History, ShieldCheck, ExternalLink, Search } from "lucide-react";
import { requireAdminUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requireAdminUser();
  const supabase = await createSupabaseServerClient();

  const { data: actions, error } = await supabase
    .from("admin_actions")
    .select("*, profile:profiles(*)")
    .order("created_at", { ascending: false });

  return (
    <main className="p-8 space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <History className="text-slate-400" size={16} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Denetim Günlüğü</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
            Audit <span className="text-slate-400 italic">Logs</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Sistem üzerinde gerçekleştirilen tüm admin aksiyonlarını takip edin.</p>
        </div>
      </section>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <h2 className="text-lg font-black italic uppercase tracking-tighter">İşlem Kayıtları</h2>
           <div className="relative w-full md:w-72">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <Input className="pl-10 h-10 rounded-xl bg-white border-slate-200 text-sm" placeholder="İşlem veya admin ara..." />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tarih</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Admin</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">İşlem</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Hedef (ID)</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Not</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {actions?.map((action) => (
                <tr key={action.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500">
                    {new Date(action.created_at).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                           <ShieldCheck size={12} className="text-slate-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">{(action as any).profile?.fullName || "Bilinmeyen Admin"}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <Badge className={`rounded-md text-[9px] font-black uppercase tracking-tighter ${
                        action.action === 'approve' ? 'bg-emerald-100 text-emerald-700' :
                        action.action === 'reject' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-600'
                     }`}>
                        {action.action}
                     </Badge>
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                     <div className="flex items-center gap-1">
                        {action.target_id.substring(0, 12)}...
                        <ExternalLink size={10} className="opacity-40" />
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-xs text-slate-500 max-w-xs truncate">{action.note || "-"}</p>
                  </td>
                </tr>
              ))}
              {!actions?.length && (
                <tr>
                   <td colSpan={5} className="px-6 py-20 text-center">
                      <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">Kayıt Bulunamadı</p>
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
