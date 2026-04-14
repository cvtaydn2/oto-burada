import { ShieldAlert } from "lucide-react";
import { AdminReportsModeration } from "@/components/listings/admin-reports-moderation";
import { requireAdminUser } from "@/lib/auth/session";
import { getStoredReports } from "@/services/reports/report-submissions";
import { getAllKnownListings } from "@/services/listings/marketplace-listings";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ urgent?: string }> }) {
  await requireAdminUser();
  const { urgent } = await searchParams;

  // Paralel fetch — sequential await yerine
  const [storedReports, knownListings] = await Promise.all([
    getStoredReports(),
    getAllKnownListings(),
  ]);

  let actionableReports = storedReports.filter(
    (report) => report.status === "open" || report.status === "reviewing",
  );

  if (urgent === "true") {
     actionableReports = actionableReports.filter(r => r.reason === "fake_listing");
  }
  const listingMetaById = Object.fromEntries(
    knownListings.map((listing) => [
      listing.id,
      {
        slug: listing.slug,
        title: listing.title,
      },
    ]),
  );

  return (
    <main className="space-y-8 p-6 lg:p-8 max-w-full bg-slate-50/30 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Şikayet Denetimi</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Kullanıcı <span className="text-rose-600">Raporları</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium italic">İlanlar hakkında gelen topluluk geri bildirimlerini ve şikayetleri yönetin.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <div className="rounded-3xl border border-rose-200/50 bg-white p-6 md:p-8 shadow-sm relative overflow-hidden">
             <div className="absolute -right-10 -top-10 size-40 bg-rose-50 rounded-full blur-3xl opacity-50" />
             
             <div className="relative mb-8 flex items-center gap-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-6">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white text-rose-500 shadow-sm border border-rose-100">
                  <ShieldAlert size={28} />
                </div>
                <div>
                   <h3 className="text-base font-black text-rose-900 leading-tight uppercase tracking-tight">İnceleme Önceliği</h3>
                   <p className="mt-1 text-sm text-rose-700/80 font-bold italic leading-relaxed">Dolandırıcılık ve Kapora şikayetleri sistem tarafından otomatik olarak en üste taşınır.</p>
                </div>
             </div>

             <AdminReportsModeration
                listingMetaById={listingMetaById}
                reports={actionableReports}
             />
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4">
             <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-100 transition-all group">
                <span className="mb-2 block text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Açık</span>
                <span className="text-3xl font-black text-slate-800 tracking-tighter">{actionableReports.filter(r => r.status === "open").length}</span>
             </div>
             <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-100 transition-all group">
                <span className="mb-2 block text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-amber-600 transition-colors">İncelemede</span>
                <span className="text-3xl font-black text-slate-800 tracking-tighter">{actionableReports.filter(r => r.status === "reviewing").length}</span>
             </div>
             <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-100 transition-all group">
                <span className="mb-2 block text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Çözüldü</span>
                <span className="text-3xl font-black text-emerald-600 tracking-tighter">{storedReports.filter(r => r.status === "resolved").length}</span>
             </div>
             <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-100 transition-all group">
                <span className="mb-2 block text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Geçersiz</span>
                <span className="text-3xl font-black text-slate-400 tracking-tighter">{storedReports.filter(r => r.status === "dismissed").length}</span>
             </div>
          </div>

          <div className="rounded-3xl border border-blue-600 bg-blue-600 p-6 shadow-lg shadow-blue-100 relative overflow-hidden text-white group">
             <div className="absolute -right-4 -bottom-4 size-24 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
             <h4 className="font-black text-lg mb-2">Hızlı Filtre</h4>
             <p className="text-blue-100 text-xs font-medium mb-4 leading-relaxed italic">Sadece yüksek riskli şikayetleri listeleyerek zaman kazanın.</p>
             <a 
                href={urgent === "true" ? "/admin/reports" : "/admin/reports?urgent=true"}
                className="w-full bg-white text-blue-600 rounded-xl py-3 font-black text-[10px] tracking-widest uppercase hover:bg-blue-50 transition-colors flex items-center justify-center cursor-pointer"
             >
                {urgent === "true" ? "TÜMÜNÜ GÖSTER" : "ACİL OLANLAR"}
             </a>
          </div>
        </div>
      </div>
    </main>
  );
}
