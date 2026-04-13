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
    <main className="space-y-6 p-4 lg:p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Flag className="text-rose-500" size={16} />
             <span className="text-xs text-slate-500">Şikayet yönetimi</span>
          </div>
           <h1 className="text-2xl font-black text-slate-900">
             Kullanıcı Raporları
           </h1>
          <p className="mt-1 text-sm text-slate-500">İlanlar hakkında gelen şikayetleri değerlendirin ve aksiyon alın.</p>
        </div>
      </section>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
         <div className="mb-6 flex items-center gap-3 rounded-lg border border-rose-200/70 bg-rose-50 p-4">
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

      <div className="grid gap-4 md:grid-cols-4">
         <div className="rounded-xl border border-slate-200 bg-white p-4">
            <span className="mb-1 block text-[10px] font-medium text-slate-500">Açık</span>
            <span className="text-2xl font-semibold text-slate-900">{actionableReports.filter(r => r.status === "open").length}</span>
         </div>
         <div className="rounded-xl border border-slate-200 bg-white p-4">
            <span className="mb-1 block text-[10px] font-medium text-slate-500">İncelemede</span>
            <span className="text-2xl font-semibold text-slate-900">{actionableReports.filter(r => r.status === "reviewing").length}</span>
         </div>
         <div className="rounded-xl border border-slate-200 bg-white p-4">
            <span className="mb-1 block text-[10px] font-medium text-slate-500">Çözüldü</span>
            <span className="text-2xl font-semibold text-emerald-600">142</span>
         </div>
         <div className="rounded-xl border border-slate-200 bg-white p-4">
            <span className="mb-1 block text-[10px] font-medium text-slate-500">Geçersiz</span>
            <span className="text-2xl font-semibold text-slate-400">12</span>
         </div>
      </div>
    </main>
  );
}
