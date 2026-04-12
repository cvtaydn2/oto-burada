import {
  Zap,
  Activity,
  UserPlus,
  Car,
  Flag,
} from "lucide-react";

import {
  AdminRecentActions,
  type AdminRecentActionItem,
} from "@/components/listings/admin-recent-actions";
import { AdminBroadcastPanel } from "@/components/shared/admin-broadcast-panel";
import { AdminPersistencePanel } from "@/components/shared/admin-persistence-panel";
import { DashboardMetricCard } from "@/components/shared/dashboard-metric-card";
import { AdminAnalyticsPanel } from "@/components/listings/admin-analytics-panel";
import { requireAdminUser } from "@/lib/auth/session";
import { getRecentAdminModerationActions } from "@/services/admin/moderation-actions";
import { getPersistenceHealth } from "@/services/admin/persistence-health";
import { getAdminAnalytics } from "@/services/admin/analytics";
import { getAllKnownListings } from "@/services/listings/marketplace-listings";
import { getStoredProfileById } from "@/services/profile/profile-records";
import { getStoredReports } from "@/services/reports/report-submissions";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const user = await requireAdminUser();
  const analyticsData = await getAdminAnalytics();
  const storedReports = await getStoredReports();
  const actionableReports = storedReports.filter(
    (report) => report.status === "open" || report.status === "reviewing",
  );
  const knownListings = await getAllKnownListings();
  const persistenceHealth = await getPersistenceHealth();
  const recentActions = await getRecentAdminModerationActions();
  const listingById = Object.fromEntries(knownListings.map((listing) => [listing.id, listing]));
  
  const recentActionItems: AdminRecentActionItem[] = await Promise.all(
    recentActions.map(async (action) => {
      const actorProfile = await getStoredProfileById(action.adminUserId);
      const targetListing =
        action.targetType === "listing"
          ? listingById[action.targetId]
          : listingById[storedReports.find((report) => report.id === action.targetId)?.listingId ?? ""];

      return {
        action,
        actorLabel: actorProfile?.fullName || actorProfile?.id || "Bilinmeyen admin",
        targetHref: targetListing?.slug ? `/listing/${targetListing.slug}` : null,
        targetLabel:
          action.targetType === "listing"
            ? targetListing?.title ?? "Ilan basligi bulunamadi"
            : targetListing
              ? `${targetListing.title} icin rapor`
              : "Rapor hedef ilani bulunamadi",
      };
    }),
  );

  return (
    <main className="p-8 space-y-8">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Canlı Sistem Durumu</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
            Kontrol <span className="text-primary text-glow">Paneli</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Platformun genel performans verileri ve akışı.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-center min-w-24">
              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Yeni Kayıt</span>
              <span className="text-xl font-black text-slate-900">+12</span>
           </div>
           <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-center min-w-24">
              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Görünüm</span>
              <span className="text-xl font-black text-slate-900">4.2k</span>
           </div>
        </div>
      </section>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardMetricCard
          label="Bekleyen İlanlar"
          value={String(analyticsData?.listingsByStatus.find(s => s.status === "pending")?.count ?? 0)}
          helper="Onay bekleyen araç ilanları"
          icon={Car}
          tone="amber"
        />
        <DashboardMetricCard
          label="Aktif Raporlar"
          value={String(actionableReports.length)}
          helper="İlgilenilmesi gereken şikayetler"
          icon={Flag}
          tone="amber"
        />
        <DashboardMetricCard
          label="Sistem Sağlığı"
          value={`${persistenceHealth.healthScore}%`}
          helper="Postgres & Redis statüsü"
          icon={Activity}
          tone="emerald"
        />
        <DashboardMetricCard
          label="Yeni Üyeler"
          value="48"
          helper="Son 24 saat içindeki kayıtlar"
          icon={UserPlus}
          tone="indigo"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
           {analyticsData && (
              <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                 <div className="flex items-center gap-3 mb-6">
                    <Zap className="text-amber-500 fill-amber-500" size={24} />
                    <h2 className="text-xl font-black italic uppercase tracking-tighter">İlan Analiz Grafiği</h2>
                 </div>
                 <AdminAnalyticsPanel data={analyticsData} />
              </div>
           )}
           <AdminPersistencePanel health={persistenceHealth} />
        </div>
        
        <div className="space-y-8">
           <AdminRecentActions actions={recentActionItems} />
           <AdminBroadcastPanel />
        </div>
      </div>
    </main>
  );
}
