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
import { Button } from "@/components/ui/button";
import { AdminHeaderActions } from "@/components/admin/admin-header-actions";
import { requireAdminUser } from "@/lib/auth/session";
import { getRecentAdminModerationActions } from "@/services/admin/moderation-actions";
import { getPersistenceHealth } from "@/services/admin/persistence-health";
import { getAdminAnalytics } from "@/services/admin/analytics";
import { getAllKnownListings } from "@/services/listings/marketplace-listings";
import { getStoredProfileById } from "@/services/profile/profile-records";
import { getStoredReports } from "@/services/reports/report-submissions";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  // Authentication check
  await requireAdminUser();

  // Parallel data fetching for maximum performance (Clean Code)
  // We wrap each in a try-catch/catch to ensure one failure doesn't block the whole page
  const [
    analyticsData,
    storedReports,
    knownListings,
    persistenceHealth,
    recentActions
  ] = await Promise.all([
    getAdminAnalytics().catch((e) => {
      console.error("Admin Analytics Fetch Error:", e);
      return null;
    }),
    getStoredReports().catch((e) => {
      console.error("Admin Reports Fetch Error:", e);
      return [];
    }),
    getAllKnownListings().catch((e) => {
      console.error("Admin Listings Fetch Error:", e);
      return [];
    }),
    getPersistenceHealth().catch((e) => {
      console.error("Admin Persistence Health Error:", e);
      return null;
    }),
    getRecentAdminModerationActions().catch((e) => {
      console.error("Admin Moderation Actions Fetch Error:", e);
      return [];
    })
  ]);

  const actionableReports = (storedReports ?? []).filter(
    (report) => report.status === "open" || report.status === "reviewing",
  );

  const listingById = Object.fromEntries((knownListings ?? []).map((listing) => [listing.id, listing]));
  
  // Resolve actor labels and targets for recent actions
  const recentActionItems: AdminRecentActionItem[] = await Promise.all(
    (recentActions ?? []).map(async (action) => {
      let actorProfile = null;
      try {
        actorProfile = await getStoredProfileById(action.adminUserId);
      } catch (e) {
        console.error("Action actor profile fetch error:", e);
      }
      
      const targetListing =
        action.targetType === "listing"
          ? listingById[action.targetId]
          : listingById[storedReports.find((report) => report.id === action.targetId)?.listingId ?? ""];

      return {
        action,
        actorLabel: actorProfile?.fullName || actorProfile?.id || "Admin",
        targetHref: targetListing?.slug ? `/listing/${targetListing.slug}` : null,
        targetLabel:
          action.targetType === "listing"
            ? targetListing?.title ?? "İlan başlığı bulunamadı"
            : targetListing
              ? `${targetListing.title} için rapor`
              : "Rapor hedef ilanı bulunamadı",
      };
    }),
  );

  return (
    <main className="space-y-8 p-6 lg:p-8 bg-slate-50/30 min-h-screen">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
             <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Sistem Durumu: Çevrimiçi</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Yönetim <span className="text-blue-600">Paneli</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">Platform operasyonlarını ve sistem sağlığını buradan takip edin.</p>
        </div>
        
        <div className="flex items-center gap-4">
           {analyticsData && (
             <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm min-w-[140px]">
                <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1 italic">Toplam Hacim</span>
                <span className="text-xl font-black text-slate-800 tracking-tighter">₺{analyticsData.totalRevenue.toLocaleString("tr-TR")}</span>
             </div>
           )}
           <AdminHeaderActions />
        </div>
      </section>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          label="Bekleyen İlanlar"
          value={String(analyticsData?.listingsByStatus?.find(s => s.status === "pending")?.count ?? 0)}
          helper="İncelenmeyi bekleyen yeni ilanlar"
          icon={Car}
          tone="amber"
        />
        <DashboardMetricCard
          label="Aktif Şikayetler"
          value={String(actionableReports.length)}
          helper="Operatör müdahalesi bekleyenler"
          icon={Flag}
          tone="amber"
        />
        <DashboardMetricCard
          label="İlan Artışı"
          value={String(analyticsData?.totalListings ?? 0)}
          helper="Toplam kayıtlı araç"
          icon={Activity}
          tone="emerald"
          trend={analyticsData?.listingTrend}
          trendLabel="Ay"
        />
        <DashboardMetricCard
          label="Yeni Üyeler"
          value={String(analyticsData?.totalUsers ?? 0)}
          helper="Toplam kayıtlı kullanıcı"
          icon={UserPlus}
          tone="indigo"
          trend={analyticsData?.userTrend}
          trendLabel="Ay"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="space-y-8 xl:col-span-2">
           <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden min-h-[400px]">
              <div className="mb-6 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                       <Zap size={20} className="fill-blue-600" />
                    </div>
                    <div>
                       <h2 className="text-lg font-black text-slate-800">İlan Analiz Grafiği</h2>
                       <p className="text-xs text-slate-400 font-medium">Son 7 günlük ilan dağılımı</p>
                    </div>
                 </div>
                 <Button variant="ghost" size="sm" className="text-xs font-bold text-blue-600">Detaylı Gör</Button>
              </div>
              <AdminAnalyticsPanel data={analyticsData} />
           </div>
           
           {persistenceHealth && <AdminPersistencePanel health={persistenceHealth} />}
        </div>
        
        <div className="space-y-8">
           <AdminRecentActions actions={recentActionItems} />
           <AdminBroadcastPanel />
        </div>
      </div>
    </main>
  );
}