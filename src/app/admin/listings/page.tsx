import { Car, Search } from "lucide-react";
import { AdminListingsModeration } from "@/components/listings/admin-listings-moderation";
import { requireAdminUser } from "@/lib/auth/session";
import { getAdminInventory } from "@/services/admin/inventory";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTable } from "@/components/admin/inventory-table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface AdminListingsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminListingsPage({ searchParams }: AdminListingsPageProps) {
  await requireAdminUser();
  const { q } = await searchParams;

  const allListings = await getAdminInventory({ query: q });
  const pendingListings = allListings.filter((l) => l.status === "pending");
  const approvedListings = allListings.filter((l) => l.status === "approved");
  const archivedListings = allListings.filter((l) => l.status === "archived" || l.status === "rejected");

  return (
    <main className="p-8 space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Car className="text-primary" size={16} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Envanter Kontrolü</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
            İlan <span className="text-primary italic">Yönetimi</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Platformdaki tüm ilanları denetleyin, onaylayın veya yayından kaldırın.</p>
        </div>
      </section>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <form className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                   name="q"
                   defaultValue={q}
                   className="pl-12 h-12 bg-white border-slate-200 focus:border-primary rounded-xl font-medium" 
                   placeholder="VIN, Başlık veya Marka ile ara..." 
                />
             </form>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <div className="px-6 border-b border-slate-100 bg-white">
              <TabsList className="h-16 bg-transparent gap-8 p-0">
                <TabsTrigger 
                  value="pending" 
                  className="h-16 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-black uppercase tracking-tighter text-xs gap-2"
                >
                  Onay Bekleyen
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none rounded-md px-1.5">{pendingListings.length}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="approved" 
                  className="h-16 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-black uppercase tracking-tighter text-xs gap-2"
                >
                  Yayında Olanlar
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none rounded-md px-1.5">{approvedListings.length}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="h-16 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-black uppercase tracking-tighter text-xs gap-2"
                >
                  Arşiv & Ret
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none rounded-md px-1.5">{archivedListings.length}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="pending" className="m-0 p-6 bg-slate-50/30">
               <AdminListingsModeration pendingListings={pendingListings} />
            </TabsContent>
            
            <TabsContent value="approved" className="m-0">
               <InventoryTable listings={approvedListings} />
            </TabsContent>

            <TabsContent value="history" className="m-0">
               <InventoryTable listings={archivedListings} />
            </TabsContent>
          </Tabs>
      </div>

      {/* Summary Stats Footer */}
      <div className="grid md:grid-cols-4 gap-6 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
         <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-1 italic">Toplam Envanter</h3>
            <span className="text-2xl font-black text-slate-900">{allListings.length}</span>
         </div>
         <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-emerald-500 font-black uppercase text-[10px] tracking-widest mb-1 italic">Aktif Satış</h3>
            <span className="text-2xl font-black text-slate-900">{approvedListings.length}</span>
         </div>
      </div>
    </main>
  );
}
