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
  AlertTriangle,
} from "lucide-react";

import { AdminErrorDisplay } from "@/components/admin/admin-error-display";
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

  const analyticsPromise = getAdminAnalytics("30d").catch((err) => ({ error: "Analitik hatası: " + (err.message || "Veriler yüklenemedi") }));
  const reportsPromise = getStoredReports().catch((err) => ({ error: "Rapor hatası: " + (err.message || "Raporlar yüklenemedi") }));
  const recentActionsPromise = getRecentAdminModerationActions(10).catch((err) => ({ error: "Moderasyon hatası: " + (err.message || "Son işlemler yüklenemedi") }));
  const persistenceHealthPromise = getPersistenceHealth().catch((err) => ({ error: "Persistence hatası: " + (err.message || "Sistem sağlığı kontrolü başarısız") }));

  let systemOnline = false;
  try {
    const admin = createSupabaseAdminClient();
    const { error: pingError } = await admin.from("profiles").select("id").limit(1);
    systemOnline = !pingError;
  } catch (err) {
    console.error("Admin client initialization failed:", err);
    systemOnline = false;
  }

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 space-y-12">
        
        {/* Admin Header */}
        <section className="bg-background border border-border rounded-2xl p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
                <ShieldCheck size={12} />
                YÖNETİM MERKEZİ
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Sistem <span className="text-primary">Genel Bakış</span>
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                Kritik metrikleri, ilan akışını ve sistem sağlığını buradan yönetin.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {features.adminAnalytics && (
                <Suspense fallback={<div className="h-11 min-w-[120px] animate-pulse rounded-xl bg-muted" />}>
                  <AdminRevenueBadge analyticsPromise={analyticsPromise} />
                </Suspense>
              )}
              <AdminHeaderActions />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-border pt-6">
            <QuickSystemStat icon={<Database size={14} />} label="DB Sağlığı" value={systemOnline ? "Normal" : "Hata"} color={systemOnline ? "emerald" : "rose"} />
            <QuickSystemStat icon={<Monitor size={14} />} label="Sunucu" value={systemOnline ? "Aktif" : "Hata"} color={systemOnline ? "blue" : "rose"} />
            <QuickSystemStat icon={<ShieldCheck size={14} />} label="Güvenlik" value={systemOnline ? "Aktif" : "Kapali"} color={systemOnline ? "indigo" : "rose"} />
            <QuickSystemStat icon={<Activity size={14} />} label="API" value={systemOnline ? "Normal" : "Hata"} color={systemOnline ? "emerald" : "rose"} />
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

function QuickSystemStat({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: "emerald" | "blue" | "indigo" | "rose" }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "flex size-9 items-center justify-center rounded-xl bg-muted/50 border border-border transition-colors",
        color === "emerald" ? "text-emerald-600" : 
        color === "blue" ? "text-blue-600" : 
        color === "rose" ? "text-rose-600" :
        "text-indigo-600"
      )}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

async function AdminRevenueBadge({
  analyticsPromise,
}: {
  analyticsPromise: Promise<any>;
}) {
  const analyticsData = await analyticsPromise;

  if (!analyticsData || "error" in analyticsData) {
    return (
      <div className="flex h-11 items-center px-4 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold uppercase tracking-widest animate-in fade-in">
        <AlertTriangle size={14} className="mr-2" />
        HATA
      </div>
    );
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
  analyticsPromise: Promise<any>;
  reportsPromise: Promise<any>;
}) {
  const [analyticsResult, reportsResult] = await Promise.all([analyticsPromise, reportsPromise]);
  
  const analyticsData = analyticsResult && !("error" in analyticsResult) ? analyticsResult : null;
  const analyticsError = analyticsResult && "error" in analyticsResult ? analyticsResult.error : null;
  
  const storedReports = Array.isArray(reportsResult) ? reportsResult : [];
  const reportsError = reportsResult && "error" in reportsResult ? reportsResult.error : null;
  
  const actionableReports = storedReports.filter((report: any) => report.status === "open");

  return (
    <div className="space-y-4">
      {(analyticsError || reportsError) && (
        <div className="p-4 flex flex-col gap-2 rounded-2xl border border-rose-200 bg-rose-50/50 text-xs font-medium text-rose-700 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 font-bold text-rose-800">
            <AlertTriangle size={14} />
            Veri Yükleme Sorunları
          </div>
          {analyticsError && <p className="pl-6">• {analyticsError}</p>}
          {reportsError && <p className="pl-6">• {reportsError}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          label="Bekleyen İlanlar"
          value={analyticsData ? String(analyticsData.listingsByStatus?.find((status: any) => status.status === "pending")?.count ?? 0) : "—"}
          helper="Moderasyon kuyruğu"
          icon={Car}
          tone={ (analyticsData?.listingsByStatus?.find((status: any) => status.status === "pending")?.count ?? 0) > 0 ? "amber" : "blue"}
        />
        <DashboardMetricCard
          label="Aktif Şikayetler"
          value={reportsError ? "Hata" : String(actionableReports.length)}
          helper="Kullanıcı ihbarları"
          icon={Flag}
          tone={actionableReports.length > 0 ? "rose" : "blue"}
        />
        <DashboardMetricCard
          label="Toplam İlan"
          value={analyticsData ? String(analyticsData.kpis.totalListings ?? 0) : "—"}
          helper="Envanter hacmi"
          icon={Activity}
          tone="emerald"
          trend={analyticsData?.listingTrend}
          trendLabel="Haftalık"
        />
        <DashboardMetricCard
          label="Kayıtlı Üye"
          value={analyticsData ? String(analyticsData.kpis.totalUsers ?? 0) : "—"}
          helper="Ekosistem büyüklüğü"
          icon={UserPlus}
          tone="indigo"
          trend={analyticsData?.userTrend}
          trendLabel="Haftalık"
        />
      </div>
    </div>
  );
}

async function PersistenceOnlySection({
  persistenceHealthPromise,
}: {
  persistenceHealthPromise: Promise<any>;
}) {
  const result = await persistenceHealthPromise;
  if (!result) return null;
  
  if ("error" in result) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        <p className="font-bold">Sistem sağlığı kontrolü yapılamadı</p>
        <p>{result.error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
      <AdminPersistencePanel health={result} />
    </div>
  );
}

async function AdminAnalyticsSection({
  analyticsPromise,
  persistenceHealthPromise,
}: {
  analyticsPromise: Promise<any>;
  persistenceHealthPromise: Promise<any>;
}) {
  const [analyticsResult, persistenceResult] = await Promise.all([analyticsPromise, persistenceHealthPromise]);

  const analyticsData = analyticsResult && !("error" in analyticsResult) ? analyticsResult : null;
  const analyticsError = analyticsResult && "error" in analyticsResult ? analyticsResult.error : null;
  
  const persistenceHealth = persistenceResult && !("error" in persistenceResult) ? persistenceResult : null;
  const persistenceError = persistenceResult && "error" in persistenceResult ? persistenceResult.error : null;

  return (
    <div className="space-y-12">
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-6 lg:p-8 shadow-sm group">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/5 text-primary shadow-inner group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <Zap size={24} className="fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Akış Analitiği</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">İlan yayın performans dağılımı</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="rounded-lg h-9 px-4 font-bold text-[10px] tracking-widest uppercase hover:bg-muted transition-colors" asChild>
            <a href="/admin/analytics">TAM RAPOR</a>
          </Button>
        </div>
        
        {analyticsError ? (
          <AdminErrorDisplay error={analyticsError} title="Analitik Verileri" className="py-20" />
        ) : (
          <div className="min-h-[300px]">
            <AdminAnalyticsPanel data={analyticsData} />
          </div>
        )}
      </div>

      {persistenceError ? (
        <AdminErrorDisplay error={persistenceError} title="Sistem Sağlığı" />
      ) : persistenceHealth ? (
        <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
          <AdminPersistencePanel health={persistenceHealth} />
        </div>
      ) : null}
    </div>
  );
}

async function AdminRecentActionsSection({
  recentActionsPromise,
  reportsPromise,
}: {
  recentActionsPromise: Promise<any>;
  reportsPromise: Promise<any>;
}) {
  const [recentActionsResult, reportsResult] = await Promise.all([recentActionsPromise, reportsPromise]);

  if (recentActionsResult && "error" in recentActionsResult) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <AdminErrorDisplay error={recentActionsResult.error} title="Son İşlemler" />
      </div>
    );
  }

  const recentActions = Array.isArray(recentActionsResult) ? recentActionsResult : [];
  const storedReports = Array.isArray(reportsResult) ? reportsResult : [];

  if (recentActions.length === 0) {
    return (
      <div className="rounded-2xl border border-white bg-white p-8 shadow-sm shadow-slate-200/50">
        <AdminRecentActions actions={[]} />
      </div>
    );
  }

  const actorIds = [...new Set(recentActions.map((action: any) => action.adminUserId))];
  const targetListingIds = [...new Set(recentActions.filter((action: any) => action.targetType === "listing").map((action: any) => action.targetId))];
  const reportListingIds = recentActions
    .filter((action: any) => action.targetType === "report")
    .map((action: any) => storedReports.find((report: any) => report.id === action.targetId)?.listingId)
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

  const recentActionItems: AdminRecentActionItem[] = recentActions.map((action: any) => {
    const actor = actorsMap[action.adminUserId];
    const listingId =
      action.targetType === "listing"
        ? action.targetId
        : storedReports.find((report: any) => report.id === action.targetId)?.listingId ?? null;
    const targetListing = listingId ? listingsMap[listingId] : null;

    return {
      action,
      actorLabel: actor?.full_name || "Sistem",
      targetHref: targetListing?.slug ? `/listing/${targetListing.slug}` : null,
      targetLabel: targetListing?.title || (action.targetType === "report" ? "Raporlanmış İlan" : "Bilinmeyen İlan"),
    };
  });

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm transition-all hover:shadow-md">
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
