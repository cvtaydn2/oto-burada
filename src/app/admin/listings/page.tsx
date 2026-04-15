import { Search } from "lucide-react";
import { AdminListingsModeration } from "@/components/listings/admin-listings-moderation";
import { requireAdminUser } from "@/lib/auth/session";
import { getAdminInventory } from "@/services/admin/inventory";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTable } from "@/components/admin/inventory-table";
import { Badge } from "@/components/ui/badge";
import { SimplePagination } from "@/components/admin/simple-pagination";
export const dynamic = "force-dynamic";

interface AdminListingsPageProps {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}

export default async function AdminListingsPage({ searchParams }: AdminListingsPageProps) {
  await requireAdminUser();
  const { q, page, status = "pending" } = await searchParams;
  const currentPage = Number(page) || 1;

  // Tüm count'ları ve asıl listeyi paralel çek
  const [
    { total: pendingCount },
    { total: approvedCount },
    { total: historyCount },
    { listings, total, limit },
  ] = await Promise.all([
    getAdminInventory({ status: "pending", limit: 1 }),
    getAdminInventory({ status: "approved", limit: 1 }),
    getAdminInventory({ status: "history", limit: 1 }),
    getAdminInventory({ query: q, status, page: currentPage }),
  ]);

  const totalPages = Math.ceil(total / (limit || 12));

  return (
    <main className="space-y-8 p-6 lg:p-8 max-w-full bg-slate-50/30 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Envanter Denetimi</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            İlan <span className="text-blue-600">Yönetimi</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium italic italic">Platformdaki tüm ilanları denetleyin, onaylayın veya yayından kaldırın.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4">
             <form className="relative flex-1 max-w-xl group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <Input 
                   name="q"
                   defaultValue={q}
                   className="pl-12 h-12 bg-white border-slate-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 rounded-xl font-medium placeholder:italic placeholder:text-slate-300 transition-all" 
                   placeholder="VIN, Başlık veya Marka ile akıllı ara..." 
                />
             </form>
          </div>

          <Tabs defaultValue={status} className="w-full">
            <div className="px-6 border-b border-slate-100 bg-white overflow-x-auto">
              <TabsList className="h-20 bg-transparent gap-10 p-0 flex">
                <TabsTrigger 
                  value="pending" 
                  asChild
                  className="h-20 rounded-none border-b-4 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-black uppercase tracking-widest text-[11px] gap-3 transition-all data-[state=active]:text-blue-600"
                >
                  <a href={`?status=pending${q ? `&q=${q}` : ""}`}>
                    Onay Bekleyen
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none rounded-lg px-2 py-0.5 font-black">{pendingCount}</Badge>
                  </a>
                </TabsTrigger>
                <TabsTrigger 
                  value="approved" 
                  asChild
                  className="h-20 rounded-none border-b-4 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-black uppercase tracking-widest text-[11px] gap-3 transition-all data-[state=active]:text-blue-600"
                >
                  <a href={`?status=approved${q ? `&q=${q}` : ""}`}>
                    Yayında Olanlar
                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none rounded-lg px-2 py-0.5 font-black">{approvedCount}</Badge>
                  </a>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  asChild
                  className="h-20 rounded-none border-b-4 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-black uppercase tracking-widest text-[11px] gap-3 transition-all data-[state=active]:text-blue-600"
                >
                  <a href={`?status=history${q ? `&q=${q}` : ""}`}>
                    Arşiv & Ret
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none rounded-lg px-2 py-0.5 font-black">{historyCount}</Badge>
                  </a>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="pending" className="m-0 p-8 bg-slate-50/20">
               <AdminListingsModeration pendingListings={listings} />
            </TabsContent>
            
            <TabsContent value="approved" className="m-0">
               <InventoryTable listings={listings} />
            </TabsContent>

            <TabsContent value="history" className="m-0">
               <InventoryTable listings={listings} />
            </TabsContent>

            <div className="p-4 border-t border-slate-100 bg-white">
                <SimplePagination currentPage={currentPage} totalPages={totalPages} />
            </div>
          </Tabs>
      </div>

      {/* Summary Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
          <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-2 -top-2 size-20 bg-slate-50 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
            <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2 italic">Bu Segmentte</h3>
            <span className="text-3xl font-black text-slate-800 tracking-tighter">{total}</span>
          </div>
          
          <div className="p-8 bg-white rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-2 -top-2 size-20 bg-blue-50 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
            <h3 className="text-blue-600 font-black uppercase text-[10px] tracking-widest mb-2 italic">Aktif Satıştakiler</h3>
            <span className="text-3xl font-black text-slate-800 tracking-tighter">{approvedCount}</span>
          </div>

          <div className="p-8 bg-white rounded-3xl border border-amber-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-2 -top-2 size-20 bg-amber-50 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
            <h3 className="text-amber-600 font-black uppercase text-[10px] tracking-widest mb-2 italic">Onay Bekleyen</h3>
            <span className="text-3xl font-black text-slate-800 tracking-tighter">{pendingCount}</span>
          </div>
      </div>
    </main>
  );
}
