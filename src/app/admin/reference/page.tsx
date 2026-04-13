import { getBrands } from "@/services/admin/reference";
import { requireAdminUser } from "@/lib/auth/session";
import { Database, Search, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandsManager } from "@/components/admin/brands-manager";

export const dynamic = "force-dynamic";

export default async function AdminReferencePage() {
  await requireAdminUser();
  const brands = await getBrands();

  return (
    <main className="space-y-8 p-6 lg:p-8 bg-slate-50/30 min-h-full">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Veri & Envanter</span>
           </div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight">
             Araç <span className="text-blue-600">Veritabanı</span>
           </h1>
           <p className="mt-1.5 text-sm text-slate-500 font-medium italic">Sistemdeki marka, model ve donanım kütüphanesini yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-xl font-black text-[10px] tracking-widest uppercase h-11 px-6 bg-white border-slate-200">
              <Filter size={16} className="mr-2" />
              FİLTRELE
           </Button>
        </div>
      </section>

      <div className="grid gap-8">
         <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-500 shadow-sm">
                     <Database size={20} />
                  </div>
                  <div>
                     <h3 className="text-sm font-black text-slate-800">Marka Kütüphanesi</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Toplam {brands.length} marka kayıtlı</p>
                  </div>
               </div>
               <div className="relative w-full md:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input className="h-11 rounded-xl bg-white border-slate-200 pl-11 text-sm font-medium" placeholder="Marka ara..." />
               </div>
            </div>
            
            <BrandsManager initialBrands={brands} />
         </div>
      </div>
    </main>
  );
}