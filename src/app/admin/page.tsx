import { Suspense } from "react";
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

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdminUser();

  const analyticsPromise = getAdminAnalytics("30d").catch(() => null);
  const reportsPromise = getStoredReports().catch(() => []);
  const recentActionsPromise = getRecentAdminModerationActions(10).catch(() => []);
  const persistenceHealthPromise = getPersistenceHealth().catch(() => null);

  // Sistem durumu için hızlı DB ping
  const admin = createSupabaseAdminClient();
  const { error: pingError } = await admin.from("profiles").select("id").limit(1);
  const systemOnline = !pingError;

  return (
    <main className="min-h-screen space-y-8 bg-muted/30/30 p-6 lg:p-8">
      <section className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className={`size-2 animate-pulse rounded-full ${systemOnline ? "bg-emerald-500" : "bg-rose-500"}`} />
            <span className={`text-[10px] font-bold uppercase tracking-widest italic ${systemOnline ? "text-muted-foreground/70" : "text-rose-500"}`}>
              Sistem Durumu: {systemOnline ? "Çevrimiçi" : "Bağlantı Sorunu"}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Yönetim <span className="text-blue-600">Paneli</span>
          </h1>
          <p className="mt-1.5 text-sm font-medium text-muted-foreground">Platform operasyonlarını ve sistem sağlığını buradan takip edin.</p>
        </div>

        <div className="flex items-center gap-4">
          {features.adminAnalytics && (
            <Suspense fallback={<div className="h-[74px] min-w-[140px] animate-pulse rounded-2xl border border-border bg-card p-4 shadow-sm" />}>
              <AdminRevenueBadge analyticsPromise={analyticsPromise} />
            </Suspense>
          )}
          <AdminHeaderActions />
        </div>
      </section>

      <Suspense fallback={<AdminMetricsSkeleton />}>
        <AdminMetricsSection analyticsPromise={analyticsPromise} reportsPromise={reportsPromise} />
      </Suspense>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="space-y-8 xl:col-span-2">
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

        <div className="space-y-8">
          <Suspense fallback={<AdminRecentActionsSkeleton />}>
            <AdminRecentActionsSection
              recentActionsPromise={recentActionsPromise}
              reportsPromise={reportsPromise}
            />
          </Suspense>
          <Suspense fallback={<div className="h-[420px] animate-pulse rounded-[2rem] border border-border bg-card" />}>
            <AdminBroadcastPanel />
          </Suspense>
        </div>
      </div>
    </main>
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
    <div className="min-w-[140px] rounded-2xl border border-border bg-card p-4 shadow-sm">
      <span className="mb-1 block text-[10px] font-bold uppercase italic text-muted-foreground/70">Toplam Hacim</span>
      <span className="text-xl font-black tracking-tighter text-foreground">₺{analyticsData.kpis.totalRevenue.toLocaleString("tr-TR")}</span>
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
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      <DashboardMetricCard
        label="Bekleyen İlanlar"
        value={String(analyticsData?.listingsByStatus?.find((status) => status.status === "pending")?.count ?? 0)}
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
        value={String(analyticsData?.kpis.totalListings ?? 0)}
        helper="Toplam kayıtlı araç"
        icon={Activity}
        tone="emerald"
        trend={analyticsData?.listingTrend}
        trendLabel="Ay"
      />
      <DashboardMetricCard
        label="Yeni Üyeler"
        value={String(analyticsData?.kpis.totalUsers ?? 0)}
        helper="Toplam kayıtlı kullanıcı"
        icon={UserPlus}
        tone="indigo"
        trend={analyticsData?.userTrend}
        trendLabel="Ay"
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
  return <AdminPersistencePanel health={persistenceHealth} />;
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
    <>
      <div className="min-h-[400px] overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Zap size={20} className="fill-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">İlan Analiz Grafiği</h2>
              <p className="text-xs font-medium text-muted-foreground/70">Son 7 günlük ilan dağılımı</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs font-bold text-blue-600" asChild>
            <a href="/admin/analytics">Detaylı Gör →</a>
          </Button>
        </div>
        <AdminAnalyticsPanel data={analyticsData} />
      </div>

      {persistenceHealth ? <AdminPersistencePanel health={persistenceHealth} /> : null}
    </>
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
    return <AdminRecentActions actions={[]} />;
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

  return <AdminRecentActions actions={recentActionItems} />;
}

function AdminMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-2xl border border-border bg-card" />
      ))}
    </div>
  );
}

function AdminAnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-[460px] animate-pulse rounded-2xl border border-border bg-card" />
      <div className="h-[520px] animate-pulse rounded-3xl border border-border bg-card" />
    </div>
  );
}

function AdminRecentActionsSkeleton() {
  return <div className="h-[640px] animate-pulse rounded-3xl border border-border bg-card" />;
}
