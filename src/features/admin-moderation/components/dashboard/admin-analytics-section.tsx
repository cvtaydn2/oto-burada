import { Zap } from "lucide-react";

import { AdminAnalyticsPanel } from "@/features/admin-moderation/components/admin-analytics-panel";
import { AdminErrorDisplay } from "@/features/admin-moderation/components/admin-error-display";
import { AdminPersistencePanel } from "@/features/admin-moderation/components/admin-persistence-panel";
import type { AdminAnalyticsData } from "@/features/admin-moderation/services/analytics";
import type { PersistenceHealth } from "@/features/admin-moderation/services/persistence-health";
import { Button } from "@/features/ui/components/button";

interface AsyncErrorResult {
  error: string;
}

interface AdminAnalyticsSectionProps {
  analyticsPromise: Promise<AdminAnalyticsData | null | AsyncErrorResult>;
  persistenceHealthPromise: Promise<PersistenceHealth | AsyncErrorResult>;
}

export async function AdminAnalyticsSection({
  analyticsPromise,
  persistenceHealthPromise,
}: AdminAnalyticsSectionProps) {
  const [analyticsResult, persistenceResult] = await Promise.all([
    analyticsPromise,
    persistenceHealthPromise,
  ]);

  const analyticsData = analyticsResult && !("error" in analyticsResult) ? analyticsResult : null;
  const analyticsError =
    analyticsResult && "error" in analyticsResult ? analyticsResult.error : null;

  const persistenceHealth =
    persistenceResult && !("error" in persistenceResult) ? persistenceResult : null;
  const persistenceError =
    persistenceResult && "error" in persistenceResult ? persistenceResult.error : null;

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
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                İlan yayın performans dağılımı
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg h-9 px-4 font-bold text-[10px] tracking-widest uppercase hover:bg-muted transition-colors"
            asChild
          >
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

export function AdminAnalyticsSkeleton() {
  return (
    <div className="space-y-12">
      <div className="h-[460px] animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-[300px] animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}
