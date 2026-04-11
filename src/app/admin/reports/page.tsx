import { Flag, ShieldAlert } from "lucide-react";
import { AdminReportsModeration } from "@/components/listings/admin-reports-moderation";
import { requireAdminUser } from "@/lib/auth/session";
import { getStoredReports } from "@/services/reports/report-submissions";
import { getAllKnownListings } from "@/services/listings/marketplace-listings";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireAdminUser();
  const storedReports = await getStoredReports();
  const actionableReports = storedReports.filter(
    (report) => report.status === "open" || report.status === "reviewing",
  );
  const knownListings = await getAllKnownListings();
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
    <main className="p-8 space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Flag className="text-rose-500" size={16} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Şikayet Yönetimi</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
            Kullanıcı <span className="text-rose-500 italic">Raporları</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">İlanlar hakkında gelen şikayetleri değerlendirin ve aksiyon alın.</p>
        </div>
      </section>

      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
         <div className="flex items-center gap-3 mb-8 p-4 bg-rose-50 rounded-2xl border border-rose-100/50">
            <ShieldAlert className="text-rose-500" size={24} />
            <div>
               <h3 className="font-bold text-rose-900 leading-tight">İnceleme Önceliği</h3>
               <p className="text-xs text-rose-700 font-medium">Dolandırıcılık ve Kapora şikayetleri sistem tarafından otomatik olarak en üste taşınır.</p>
            </div>
         </div>

         <AdminReportsModeration
            listingMetaById={listingMetaById}
            reports={actionableReports}
         />
      </div>

      <div className="grid md:grid-cols-4 gap-6">
         <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Açık</span>
            <span className="text-3xl font-black text-slate-900">{actionableReports.filter(r => r.status === "open").length}</span>
         </div>
         <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">İncelemede</span>
            <span className="text-3xl font-black text-slate-900">{actionableReports.filter(r => r.status === "reviewing").length}</span>
         </div>
         <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Çözüldü</span>
            <span className="text-3xl font-black text-emerald-600">142</span>
         </div>
         <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Geçersiz</span>
            <span className="text-3xl font-black text-slate-400">12</span>
         </div>
      </div>
    </main>
  );
}
