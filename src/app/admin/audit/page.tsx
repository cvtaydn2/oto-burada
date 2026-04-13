import { History, ShieldCheck, ExternalLink, Search } from "lucide-react";
import { requireAdminUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface AdminActionWithProfile {
  id: string;
  action: string;
  admin_user_id: string;
  target_id: string;
  target_type: string;
  note: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
  } | null;
}

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requireAdminUser();
  const supabase = await createSupabaseServerClient();

  const { data: actions } = await supabase
    .from("admin_actions")
    .select("*, profile:profiles(full_name)")
    .order("created_at", { ascending: false }) as { data: AdminActionWithProfile[] | null };

  return (
    <main className="space-y-6 p-4 lg:p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <History className="text-slate-400" size={16} />
             <span className="text-xs text-slate-500">Denetim günlüğü</span>
          </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900">
             Denetim Kayıtları
           </h1>
          <p className="mt-1 text-sm text-slate-500">Sistem üzerinde gerçekleştirilen tüm admin aksiyonlarını takip edin.</p>
        </div>
      </section>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center">
           <h2 className="text-lg font-semibold text-slate-900">İşlem kayıtları</h2>
           <div className="relative w-full md:w-72">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <Input className="h-10 rounded-md border-slate-200 bg-white pl-10 text-sm" placeholder="İşlem veya admin ara..." />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">Tarih</th>
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">Admin</th>
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">İşlem</th>
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">Hedef (ID)</th>
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">Not</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {actions?.map((action) => (
                <tr key={action.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {new Date(action.created_at).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                     <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                           <ShieldCheck size={12} className="text-slate-400" />
                        </div>
                        <span className="text-xs font-medium text-slate-900">{action.profile?.full_name || "Bilinmeyen Admin"}</span>
                     </div>
                  </td>
                  <td className="px-4 py-3">
                     <Badge className={`rounded-md text-[9px] font-medium uppercase tracking-wide ${
                        action.action === 'approve' ? 'bg-emerald-100 text-emerald-700' :
                        action.action === 'reject' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-600'
                     }`}>
                        {action.action}
                     </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-400">
                     <div className="flex items-center gap-1">
                        {action.target_id.substring(0, 12)}...
                        <ExternalLink size={10} className="opacity-40" />
                     </div>
                  </td>
                  <td className="px-4 py-3">
                     <p className="text-xs text-slate-500 max-w-xs truncate">{action.note || "-"}</p>
                  </td>
                </tr>
              ))}
              {!actions?.length && (
                <tr>
                   <td colSpan={5} className="px-6 py-16 text-center">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Kayıt bulunamadı</p>
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
