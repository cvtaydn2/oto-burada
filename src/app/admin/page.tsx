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
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  // Authentication check
  await requireAdminUser();

  // 1. Initial parallel fetch for core metrics and actions
  const [
    analyticsData,
    storedReports,
    recentActions,
    persistenceHealth
  ] = await Promise.all([
    getAdminAnalytics("30d").catch(() => null),
    getStoredReports().catch(() => []),
    getRecentAdminModerationActions(10).catch(() => []),
    getPersistenceHealth().catch(() => null),
  ]);

  // 2. Batch resolve related data for recent actions to avoid waterfalis
  const actorIds = [...new Set(recentActions.map(a => a.adminUserId))];
  const targetListingIds = [...new Set(
    recentActions
      .filter(a => a.targetType === "listing")
      .map(a => a.targetId)
  )];

  // Also include listings from reports mentioned in recent actions
  const reportTargets = recentActions.filter(a => a.targetType === "report");
  const reportListingIds = reportTargets.map(rt => 
    storedReports.find(r => r.id === rt.targetId)?.listingId
  ).filter(Boolean) as string[];

  const admin = createSupabaseAdminClient();
  const [actorProfiles, actionListings] = await Promise.all([
    admin.from("profiles").select("id, full_name").in("id", actorIds),
    admin.from("listings").select("id, title, slug").in("id", [...new Set([...targetListingIds, ...reportListingIds])])
  ]);

  const actorsMap = Object.fromEntries((actorProfiles.data || []).map((p: any) => [p.id, p]));
  const listingsMap = Object.fromEntries((actionListings.data || []).map((l: any) => [l.id, l]));

  const actionableReports = (storedReports || []).filter(r => r.status === "open");

  const recentActionItems: AdminRecentActionItem[] = recentActions.map(action => {
    const actor = actorsMap[action.adminUserId];
    
    // Determine the relevant listing for the target (whether it's a listing or a report on a listing)
    let listingId = action.targetType === "listing" ? action.targetId : null;
    if (action.targetType === "report") {
      listingId = storedReports.find(r => r.id === action.targetId)?.listingId || null;
    }
    
    const targetListing = listingId ? listingsMap[listingId] : null;

    return {
      action,
      actorLabel: actor?.full_name || "Sistem",
      targetHref: targetListing?.slug ? `/listing/${targetListing.slug}` : null,
      targetLabel: targetListing?.title || (action.targetType === "report" ? "Raporlanmış İlan" : "Bilinmeyen İlan"),
    };
  });

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