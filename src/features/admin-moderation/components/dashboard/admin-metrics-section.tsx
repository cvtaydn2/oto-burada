import { Activity, AlertTriangle, Car, Flag, UserPlus } from "lucide-react";

import type { AdminAnalyticsData } from "@/features/admin-moderation/services/analytics";
import { DashboardMetricCard } from "@/features/shared/components/dashboard-metric-card";
import type { Report } from "@/types";

interface AsyncErrorResult {
  error: string;
}

interface AdminMetricsSectionProps {
  analyticsPromise: Promise<AdminAnalyticsData | null | AsyncErrorResult>;
  reportsPromise: Promise<Report[] | AsyncErrorResult>;
}

export async function AdminMetricsSection({
  analyticsPromise,
  reportsPromise,
}: AdminMetricsSectionProps) {
  const [analyticsResult, reportsResult] = await Promise.all([analyticsPromise, reportsPromise]);

  const analyticsData = analyticsResult && !("error" in analyticsResult) ? analyticsResult : null;
  const analyticsError =
    analyticsResult && "error" in analyticsResult ? analyticsResult.error : null;

  const storedReports = Array.isArray(reportsResult) ? reportsResult : [];
  const reportsError = reportsResult && "error" in reportsResult ? reportsResult.error : null;

  const actionableReports = storedReports.filter((report) => report.status === "open");

  // Derive pending count from typed listingsByStatus
  const pendingCount =
    analyticsData?.listingsByStatus?.find((s) => s.status === "pending")?.count ?? 0;

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
          value={analyticsData ? String(pendingCount) : "—"}
          helper="Moderasyon kuyruğu"
          icon={Car}
          tone={pendingCount > 0 ? "amber" : "blue"}
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

export function AdminMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  );
}
