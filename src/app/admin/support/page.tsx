import { getSupportTickets } from "@/services/admin/support";
import { requireAdminUser } from "@/lib/auth/session";
import { MessageSquare, Filter } from "lucide-react";
import { TicketList } from "@/components/admin/ticket-list";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  await requireAdminUser();
  const tickets = await getSupportTickets();

  return (
    <main className="space-y-8 p-6 lg:p-8 bg-slate-50/30 min-h-full">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Müşteri Deneyimi</span>
           </div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight">
             Destek <span className="text-emerald-600">Talepleri</span>
           </h1>
           <p className="mt-1.5 text-sm text-slate-500 font-medium italic">Kullanıcılardan gelen yardım çağrılarını ve genel mesajları yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="size-8 rounded-full border-2 border-white bg-slate-200" />
              ))}
           </div>
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">3 Aktif Operatör</span>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
         <StatCard title="Açık Talepler" count={tickets.filter(t => t.status === 'open').length} color="text-emerald-600" />
         <StatCard title="İşlemdekiler" count={tickets.filter(t => t.status === 'in_progress').length} color="text-amber-600" />
         <StatCard title="Bugün Çözülen" count={0} color="text-blue-600" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-500 shadow-sm">
                  <MessageSquare size={20} />
               </div>
               <h3 className="text-sm font-black text-slate-800">Tüm Talepler</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
               <Filter size={14} />
               <span>Sırala: <b>En Yeni</b></span>
            </div>
         </div>
         
         <TicketList initialTickets={tickets} />
      </div>
    </main>
  );
}

function StatCard({ title, count, color }: { title: string, count: number, color: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm group hover:border-emerald-100 transition-all">
       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block italic">{title}</span>
       <div className={`text-3xl font-black ${color} tracking-tighter`}>{count}</div>
    </div>
  );
}
