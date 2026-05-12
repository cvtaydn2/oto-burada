import { Activity, Database, Monitor, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminBroadcastPanel } from "@/features/admin-moderation/components/admin-broadcast-panel";
import { AdminHeaderActions } from "@/features/admin-moderation/components/admin-header-actions";
import {
  AdminAnalyticsSection,
  AdminAnalyticsSkeleton,
} from "@/features/admin-moderation/components/dashboard/admin-analytics-section";
import {
  AdminMetricsSection,
  AdminMetricsSkeleton,
} from "@/features/admin-moderation/components/dashboard/admin-metrics-section";
import {
  AdminRecentActionsSection,
  AdminRecentActionsSkeleton,
} from "@/features/admin-moderation/components/dashboard/admin-recent-actions-section";
// Dashboard Components
import { QuickSystemStat } from "@/features/admin-moderation/components/dashboard/quick-system-stat";
import { getAdminAnalytics } from "@/features/admin-moderation/services/analytics";
import { getRecentAdminModerationActions } from "@/features/admin-moderation/services/moderation-actions";
import { getPersistenceHealth } from "@/features/admin-moderation/services/persistence-health";
import { requireAdminUser } from "@/features/auth/lib/session";
import { getStoredReports } from "@/features/reports/services/report-submissions";
import { buildAbsoluteUrl } from "@/features/seo/lib";
import { createSupabaseAdminClient } from "@/lib/admin";
import { captureServerError } from "@/lib/telemetry-server";

type AsyncErrorResult = { error: string };

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Genel Bakış | OtoBurada",
  description:
    "Kritik sistem metriklerini, moderasyon akışını ve yönetim yüzeylerini genel bakış panelinden izleyin.",
  alternates: {
    canonical: buildAbsoluteUrl("/admin"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminOverviewPage() {
  await requireAdminUser();

  const analyticsPromise = getAdminAnalytics("30d").catch(
    (err): AsyncErrorResult => ({
      error: "Analitik hatası: " + (err.message || "Veriler yüklenemedi"),
    })
  );
  const reportsPromise = getStoredReports().catch(
    (err): AsyncErrorResult => ({
      error: "Rapor hatası: " + (err.message || "Raporlar yüklenemedi"),
    })
  );
  const recentActionsPromise = getRecentAdminModerationActions(10).catch(
    (err): AsyncErrorResult => ({
      error: "Moderasyon hatası: " + (err.message || "Son işlemler yüklenemedi"),
    })
  );
  const persistenceHealthPromise = getPersistenceHealth().catch(
    (err): AsyncErrorResult => ({
      error: "Persistence hatası: " + (err.message || "Sistem sağlığı kontrolü başarısız"),
    })
  );

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
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
              <AdminHeaderActions />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-border pt-6">
            <QuickSystemStat
              icon={<Database size={14} />}
              label="DB Sağlığı"
              value={systemOnline ? "Normal" : "Hata"}
              color={systemOnline ? "emerald" : "rose"}
            />
            <QuickSystemStat
              icon={<Monitor size={14} />}
              label="Sunucu"
              value={systemOnline ? "Aktif" : "Hata"}
              color={systemOnline ? "blue" : "rose"}
            />
            <QuickSystemStat
              icon={<ShieldCheck size={14} />}
              label="Güvenlik"
              value={systemOnline ? "Aktif" : "Kapali"}
              color={systemOnline ? "indigo" : "rose"}
            />
            <QuickSystemStat
              icon={<Activity size={14} />}
              label="API"
              value={systemOnline ? "Normal" : "Hata"}
              color={systemOnline ? "emerald" : "rose"}
            />
          </div>
        </section>

        {/* Metrics Grid */}
        <Suspense fallback={<AdminMetricsSkeleton />}>
          <AdminMetricsSection
            analyticsPromise={analyticsPromise}
            reportsPromise={reportsPromise}
          />
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
            <Suspense
              fallback={
                <div className="h-[420px] animate-pulse rounded-2xl border border-border bg-card shadow-sm" />
              }
            >
              <AdminBroadcastPanel />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
