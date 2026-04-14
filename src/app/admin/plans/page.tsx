import { getPricingPlans } from "@/services/admin/plans";
import { requireAdminUser } from "@/lib/auth/session";
import { PlansTable } from "@/components/admin/plans-table";
import { CreditCard, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  await requireAdminUser();
  const plans = await getPricingPlans();

  return (
    <main className="space-y-8 p-6 lg:p-8 bg-slate-50/30 min-h-full">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Gelir & Paketler</span>
           </div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight">
             Paket <span className="text-indigo-600">Yönetimi</span>
           </h1>
           <p className="mt-1.5 text-sm text-slate-500 font-medium italic">Üyelik paketlerini, fiyatları ve ilan limitlerini buradan yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-600 transition-all">
              <Plus size={20} className="opacity-0 group-hover:opacity-100" />
           </div>
        </div>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-500 shadow-sm">
                  <CreditCard size={20} />
               </div>
               <div>
                  <h3 className="text-sm font-black text-slate-800">Aktif Paket Listesi</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Şu an yayında olan planlar</p>
               </div>
            </div>
         </div>
         
         <PlansTable initialPlans={plans} />
      </div>
    </main>
  );
}
