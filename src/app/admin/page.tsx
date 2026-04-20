import { Suspense } from "react";
import {
  Zap,
  Activity,
  UserPlus,
  Car,
  Flag,
  ShieldCheck,
  ArrowUpRight,
  Monitor,
  Database,
} from "lucide-react";

import {
  AdminRecentActions,
  type AdminRecentActionItem,
} from "@/components/admin/admin-recent-actions";
import { AdminBroadcastPanel } from "@/components/shared/admin-broadcast-panel";
import { AdminPersistencePanel } from "@/components/shared/admin-persistence-panel";
import { DashboardMetricCard } from "@/components/shared/dashboard-metric-card";
import { AdminAnalyticsPanel } from "@/components/admin/admin-analytics-panel";
import { Button } from "@/components/ui/button";
import { AdminHeaderActions } from "@/components/admin/admin-header-actions";
import { requireAdminUser } from "@/lib/auth/session";
import { getRecentAdminModerationActions } from "@/services/admin/moderation-actions";
import { getPersistenceHealth } from "@/services/admin/persistence-health";
import { getAdminAnalytics } from "@/services/admin/analytics";
import { getStoredReports } from "@/services/reports/report-submissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { features } from "@/lib/features";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdminUser();

  const analyticsPromise = getAdminAnalytics("30d").catch(() => null);
  const reportsPromise = getStoredReports().catch(() => []);
  const recentActionsPromise = getRecentAdminModerationActions(10).catch(() => []);
  const persistenceHealthPromise = getPersistenceHealth().catch(() => null);

  const admin = createSupabaseAdminClient();
  const { error: pingError } = await admin.from("profiles").select("id").limit(1);
  const systemOnline = !pingError;

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 space-y-12">
        
        {/* Elite Admin Header */}
        <section className="relative overflow-hidden rounded-2xl bg-slate-900 px-8 py-12 text-white shadow-sm shadow-slate-900/20">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-white/5 to-transparent opacity-50" />
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          
          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md border border-white/5">
                <div className={cn("size-2 rounded-full shadow-[0_0_10px_currentColor]", systemOnline ? "bg-emerald-400 text-emerald-400" : "bg-rose-400 text-rose-400")} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Sistem: <span className={cn(systemOnline ? "text-emerald-400" : "text-rose-400")}>{systemOnline ? "ONLINE" : "OFFLINE"}</span>
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight lg:text-6xl">
                Yönetim <span className="text-blue-500">Merkezi</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg font-bold text-slate-400 lowercase first-letter:uppercase">
                Platform genelindeki operasyonları, moderasyon kuyruğunu ve sistem sağlığını buradan yönetin.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {features.adminAnalytics && (
                <Suspense fallback={<div className="h-[80px] min-w-[180px] animate-pulse rounded-2xl bg-white/5" />}>
                  <AdminRevenueBadge analyticsPromise={analyticsPromise} />
                </Suspense>
              )}
              <AdminHeaderActions />
            </div>
          </div>

          <div className="relative z-10 mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-t border-white/10 pt-8">
            <QuickSystemStat icon={<Database size={16} />} label="DB Sağlığı" value={systemOnline ? "%100" : "%0"} color="emerald" />
            <QuickSystemStat icon={<Monitor size={16} />} label="Sunucu Yükü" value="Normal" color="blue" />
            <QuickSystemStat icon={<ShieldCheck size={16} />} label="Güvenlik" value="Aktif" color="indigo" />
            <QuickSystemStat icon={<Activity size={16} />} label="Uptime" value="%99.9" color="emerald" />
          </div>
        </section>

        {/* Metrics Grid */}
        <Suspense fallback={<AdminMetricsSkeleton />}>
          <AdminMetricsSection analyticsPromise={analyticsPromise} reportsPromise={reportsPromise} />
        </Suspense>

        <div className="grid grid-cols-1 gap-12 xl:grid-cols-3">
          <div className="space-y-12 xl:col-span-2">
            {features.adminAnalytics ? (
              <Suspense fallback={<AdminAnalyticsSkeleton />}>
                <AdminAnalyticsSection
                  analyticsPromise={analyticsPromise}
                  persistenceHealthPromise={persistenceHealthPromise}
                />
              </Suspense>
            ) : persistenceHealthPromise ? (
               <Suspense fallback={<div className="h-60 animate-pulse bg-card rounded-2xl" />}>
                 <PersistenceOnlySection persistenceHealthPromise={persistenceHealthPromise} />
               </Suspense>
            ) : null}
          </div>

          <div className="space-y-12">
            <Suspense fallback={<AdminRecentActionsSkeleton />}>
              <AdminRecentActionsSection
                recentActionsPromise={recentActionsPromise}
                reportsPromise={reportsPromise}
              />
            </Suspense>
            <Suspense fallback={<div className="h-[420px] animate-pulse rounded-2xl border border-border bg-card shadow-sm" />}>
              <AdminBroadcastPanel />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}

function QuickSystemStat({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: "emerald" | "blue" | "indigo" }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "flex size-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner",
        color === "emerald" ? "text-emerald-400" : color === "blue" ? "text-blue-400" : "text-indigo-400"
      )}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

async function AdminRevenueBadge({
  analyticsPromise,
}: {
  analyticsPromise: Promise<Awaited<ReturnType<typeof getAdminAnalytics>> | null>;
}) {
  const analyticsData = await analyticsPromise;

  if (!analyticsData) {
    return null;
  }

  return (
    <div className="min-w-[180px] rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur-xl shadow-sm relative group overflow-hidden">
      <div className="absolute -right-4 -top-4 size-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
      <span className="relative z-10 block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ciro Hacmi</span>
      <div className="relative z-10 flex items-center gap-2">
        <span className="text-2xl font-bold tracking-tighter text-white">₺{analyticsData.kpis.totalRevenue.toLocaleString("tr-TR")}</span>
        <ArrowUpRight size={14} className="text-emerald-400" />
      </div>
    </div>
  );
}

async function AdminMetricsSection({
  analyticsPromise,
  reportsPromise,
}: {
  analyticsPromise: Promise<Awaited<ReturnType<typeof getAdminAnalytics>> | null>;
  reportsPromise: Promise<Awaited<ReturnType<typeof getStoredReports>>>;
}) {
  const [analyticsData, storedReports] = await Promise.all([analyticsPromise, reportsPromise]);
  const actionableReports = storedReports.filter((report) => report.status === "open");

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
      <DashboardMetricCard
        label="Bekleyen İlanlar"
        value={String(analyticsData?.listingsByStatus?.find((status) => status.status === "pending")?.count ?? 0)}
        helper="Moderasyon kuyruğu"
        icon={Car}
        tone={ (analyticsData?.listingsByStatus?.find((status) => status.status === "pending")?.count ?? 0) > 0 ? "amber" : "blue"}
      />
      <DashboardMetricCard
        label="Aktif Şikayetler"
        value={String(actionableReports.length)}
        helper="Kullanıcı ihbarları"
        icon={Flag}
        tone={actionableReports.length > 0 ? "rose" : "blue"}
      />
      <DashboardMetricCard
        label="Toplam İlan"
        value={String(analyticsData?.kpis.totalListings ?? 0)}
        helper="Envanter hacmi"
        icon={Activity}
        tone="emerald"
        trend={analyticsData?.listingTrend}
        trendLabel="Haftalık"
      />
      <DashboardMetricCard
        label="Kayıtlı Üye"
        value={String(analyticsData?.kpis.totalUsers ?? 0)}
        helper="Ekosistem büyüklüğü"
        icon={UserPlus}
        tone="indigo"
        trend={analyticsData?.userTrend}
        trendLabel="Haftalık"
      />
    </div>
  );
}

async function PersistenceOnlySection({
  persistenceHealthPromise,
}: {
  persistenceHealthPromise: Promise<Awaited<ReturnType<typeof getPersistenceHealth>> | null>;
}) {
  const persistenceHealth = await persistenceHealthPromise;
  if (!persistenceHealth) return null;
  return (
    <div className="rounded-2xl overflow-hidden border border-white bg-white shadow-sm shadow-slate-200/50">
      <AdminPersistencePanel health={persistenceHealth} />
    </div>
  );
}

async function AdminAnalyticsSection({
  analyticsPromise,
  persistenceHealthPromise,
}: {
  analyticsPromise: Promise<Awaited<ReturnType<typeof getAdminAnalytics>> | null>;
  persistenceHealthPromise: Promise<Awaited<ReturnType<typeof getPersistenceHealth>> | null>;
}) {
  const [analyticsData, persistenceHealth] = await Promise.all([analyticsPromise, persistenceHealthPromise]);

  return (
    <div className="space-y-12">
      <div className="overflow-hidden rounded-2xl border border-white bg-white p-10 shadow-sm shadow-slate-200/50 group">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
              <Zap size={28} strokeWidth={2.5} className="fill-current" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Akış Analitiği</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">İlan yayın performans dağılımı</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="rounded-xl h-10 px-6 font-bold text-[10px] tracking-widest uppercase hover:bg-slate-50 transition-colors" asChild>
            <a href="/admin/analytics">TAM RAPORU GÖR</a>
          </Button>
        </div>
        <div className="min-h-[300px]">
          <AdminAnalyticsPanel data={analyticsData} />
        </div>
      </div>

      {persistenceHealth && (
        <div className="rounded-2xl overflow-hidden border border-white bg-white shadow-sm shadow-slate-200/50">
          <AdminPersistencePanel health={persistenceHealth} />
        </div>
      )}
    </div>
  );
}

async function AdminRecentActionsSection({
  recentActionsPromise,
  reportsPromise,
}: {
  recentActionsPromise: Promise<Awaited<ReturnType<typeof getRecentAdminModerationActions>>>;
  reportsPromise: Promise<Awaited<ReturnType<typeof getStoredReports>>>;
}) {
  const [recentActions, storedReports] = await Promise.all([recentActionsPromise, reportsPromise]);

  if (recentActions.length === 0) {
    return (
      <div className="rounded-2xl border border-white bg-white p-8 shadow-sm shadow-slate-200/50">
        <AdminRecentActions actions={[]} />
      </div>
    );
  }

  const actorIds = [...new Set(recentActions.map((action) => action.adminUserId))];
  const targetListingIds = [...new Set(recentActions.filter((action) => action.targetType === "listing").map((action) => action.targetId))];
  const reportListingIds = recentActions
    .filter((action) => action.targetType === "report")
    .map((action) => storedReports.find((report) => report.id === action.targetId)?.listingId)
    .filter(Boolean) as string[];

  const allListingIds = [...new Set([...targetListingIds, ...reportListingIds])];

  const admin = createSupabaseAdminClient();
  const [actorProfiles, actionListings] = await Promise.all([
    actorIds.length > 0
      ? admin.from("profiles").select("id, full_name").in("id", actorIds)
      : Promise.resolve({ data: [], error: null }),
    allListingIds.length > 0
      ? admin.from("listings").select("id, title, slug").in("id", allListingIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const actorsMap = Object.fromEntries((actorProfiles.data || []).map((profile) => [profile.id, profile]));
  const listingsMap = Object.fromEntries((actionListings.data || []).map((listing) => [listing.id, listing]));

  const recentActionItems: AdminRecentActionItem[] = recentActions.map((action) => {
    const actor = actorsMap[action.adminUserId];
    const listingId =
      action.targetType === "listing"
        ? action.targetId
        : storedReports.find((report) => report.id === action.targetId)?.listingId ?? null;
    const targetListing = listingId ? listingsMap[listingId] : null;

    return {
      action,
      actorLabel: actor?.full_name || "Sistem",
      targetHref: targetListing?.slug ? `/listing/${targetListing.slug}` : null,
      targetLabel: targetListing?.title || (action.targetType === "report" ? "Raporlanmış İlan" : "Bilinmeyen İlan"),
    };
  });

  return (
    <div className="rounded-2xl overflow-hidden border border-white bg-white shadow-sm shadow-slate-200/50 transition-all hover:shadow-sm">
      <AdminRecentActions actions={recentActionItems} />
    </div>
  );
}

function AdminMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  );
}

function AdminAnalyticsSkeleton() {
  return (
    <div className="space-y-12">
      <div className="h-[460px] animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-[300px] animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}

function AdminRecentActionsSkeleton() {
  return <div className="h-[640px] animate-pulse rounded-2xl bg-slate-200" />;
}
