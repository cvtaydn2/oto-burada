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
  await requireAdminUser();
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
    <main className="space-y-6 p-5 lg:p-6">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
             <div className="size-2 rounded-full bg-emerald-500" />
             <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Canlı sistem durumu</span>
          </div>
           <h1 className="text-2xl font-black text-slate-900">
             Kontrol Paneli
           </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">Platformun genel performans verileri ve akışı.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="min-w-20 rounded-lg border border-slate-200 bg-white p-3 text-center">
              <span className="mb-1 block text-[10px] text-slate-500 font-semibold uppercase">Yeni kayıt</span>
              <span className="text-lg font-black text-slate-900">+12</span>
           </div>
           <div className="min-w-20 rounded-lg border border-slate-200 bg-white p-3 text-center">
              <span className="mb-1 block text-[10px] text-slate-500 font-semibold uppercase">Görünüm</span>
              <span className="text-lg font-black text-slate-900">4.2k</span>
           </div>
        </div>
      </section>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
           {analyticsData && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                 <div className="mb-4 flex items-center gap-3">
                    <Zap className="text-amber-500 fill-amber-500" size={24} />
                    <h2 className="text-lg font-semibold text-slate-900">İlan analiz grafiği</h2>
                 </div>
                 <AdminAnalyticsPanel data={analyticsData} />
              </div>
           )}
           <AdminPersistencePanel health={persistenceHealth} />
        </div>
        
        <div className="space-y-6">
           <AdminRecentActions actions={recentActionItems} />
           <AdminBroadcastPanel />
        </div>
      </div>
    </main>
  );
}
