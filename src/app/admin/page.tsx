import { Suspense } from "react";
import {
  Zap,
  ArrowUpRight,
  Monitor,
  Database,
  ShieldCheck,
  Activity,
  AlertTriangle,
} from "lucide-react";

import { AdminBroadcastPanel } from "@/components/shared/admin-broadcast-panel";
import { AdminHeaderActions } from "@/components/admin/admin-header-actions";
import { requireAdminUser } from "@/lib/auth/session";
import { getRecentAdminModerationActions } from "@/services/admin/moderation-actions";
import { getPersistenceHealth } from "@/services/admin/persistence-health";
import { getAdminAnalytics, type AdminAnalyticsData } from "@/services/admin/analytics";
import { getStoredReports } from "@/services/reports/report-submissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { features } from "@/lib/features";
import { captureServerError } from "@/lib/monitoring/posthog-server";

// Dashboard Components
import { QuickSystemStat } from "@/components/admin/dashboard/quick-system-stat";
import { AdminMetricsSection, AdminMetricsSkeleton } from "@/components/admin/dashboard/admin-metrics-section";
import { AdminAnalyticsSection, AdminAnalyticsSkeleton } from "@/components/admin/dashboard/admin-analytics-section";
import { AdminRecentActionsSection, AdminRecentActionsSkeleton } from "@/components/admin/dashboard/admin-recent-actions-section";

type AsyncErrorResult = { error: string };

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdminUser();

  const analyticsPromise = getAdminAnalytics("30d").catch((err): AsyncErrorResult => ({ error: "Analitik hatası: " + (err.message || "Veriler yüklenemedi") }));
  const reportsPromise = getStoredReports().catch((err): AsyncErrorResult => ({ error: "Rapor hatası: " + (err.message || "Raporlar yüklenemedi") }));
  const recentActionsPromise = getRecentAdminModerationActions(10).catch((err): AsyncErrorResult => ({ error: "Moderasyon hatası: " + (err.message || "Son işlemler yüklenemedi") }));
  const persistenceHealthPromise = getPersistenceHealth().catch((err): AsyncErrorResult => ({ error: "Persistence hatası: " + (err.message || "Sistem sağlığı kontrolü başarısız") }));

  let systemOnline = false;
  try {
    const admin = createSupabaseAdminClient();
    const { error: pingError } = await admin.from("profiles").select("id").limit(1);
    systemOnline = !pingError;
    if (pingError) {
      captureServerError("Admin DB ping failed", "admin_dashboard", pingError);
    }
  } catch (err) {
    captureServerError("Admin client initialization failed", "admin_dashboard", err);
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
            <Suspense fallback={<AdminAnalyticsSkeleton />}>
              <AdminAnalyticsSection
                analyticsPromise={analyticsPromise}
                persistenceHealthPromise={persistenceHealthPromise}
              />
            </Suspense>
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

async function AdminRevenueBadge({
  analyticsPromise,
}: {
  analyticsPromise: Promise<AdminAnalyticsData | null | AsyncErrorResult>;
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
    <div className="min-w-[180px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative group overflow-hidden transition-all hover:shadow-md">
      <div className="absolute -right-4 -top-4 size-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
      <span className="relative z-10 block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ciro Hacmi</span>
      <div className="relative z-10 flex items-center gap-2">
        <span className="text-2xl font-bold tracking-tighter text-slate-900">₺{analyticsData.kpis.totalRevenue.toLocaleString("tr-TR")}</span>
        <div className="size-5 rounded-full bg-emerald-50 flex items-center justify-center">
          <ArrowUpRight size={12} className="text-emerald-600" />
        </div>
      </div>
    </div>
  );
}
